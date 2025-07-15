#!/usr/bin/env node

/**
 * Migration script to convert full URLs to relative paths in DynamoDB
 *
 * This script will:
 * 1. Scan all Album and Media records in DynamoDB
 * 2. Extract S3 keys from full URLs
 * 3. Convert to relative paths
 * 4. Update records with new relative paths
 *
 * Usage:
 *   npm run migrate:urls -- --dry-run     # Test without making changes
 *   npm run migrate:urls                  # Execute migration
 *   npm run migrate:urls -- --rollback    # Rollback to full URLs (future feature)
 */

const {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
  BatchWriteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

// Configuration
const TABLE_NAME = process.env.DYNAMODB_TABLE || "dev-pornspot-media";
const BATCH_SIZE = 25; // DynamoDB batch write limit
const isDryRun = process.argv.includes("--dry-run");
const isRollback = process.argv.includes("--rollback");

// S3 configuration (inlined from backend)
const isLocal = process.env.AWS_SAM_LOCAL === "true";
const BUCKET_NAME = isLocal ? "local-pornspot-media" : process.env.S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// Inlined S3Service methods
class S3Utils {
  static extractKeyFromUrl(url) {
    try {
      const urlObj = new URL(url);

      if (isLocal) {
        const pathParts = urlObj.pathname.split("/");
        return pathParts.slice(2).join("/");
      }

      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }

  static getRelativePath(key) {
    // Return the key as a relative path (with leading slash)
    return key.startsWith("/") ? key : `/${key}`;
  }

  static getPublicUrl(key) {
    if (isLocal) {
      return `http://localhost:4566/${BUCKET_NAME}/${key}`;
    }

    if (CLOUDFRONT_DOMAIN) {
      // Remove any existing protocol prefix to avoid duplication
      return `${CLOUDFRONT_DOMAIN}/${key}`;
    }

    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
  }

  static composePublicUrl(relativePath) {
    // Remove leading slash if present for key composition
    const key = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;
    return this.getPublicUrl(key);
  }
}

class URLMigration {
  constructor() {
    this.dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.processedCount = 0;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.backupData = [];
  }

  /**
   * Extract S3 key from URL and convert to relative path
   */
  urlToRelativePath(url) {
    if (!url || typeof url !== "string") return null;

    // If already a relative path, return as is
    if (url.startsWith("/")) return url;

    // Extract S3 key from full URL
    const key = S3Utils.extractKeyFromUrl(url);
    if (!key) {
      console.warn(`Could not extract key from URL: ${url}`);
      return null;
    }

    // Convert to relative path (add leading slash)
    return S3Utils.getRelativePath(key);
  }

  /**
   * Convert relative path back to full URL (for rollback)
   */
  relativePathToUrl(relativePath) {
    if (!relativePath || typeof relativePath !== "string") return null;

    // If already a full URL, return as is
    if (relativePath.startsWith("http")) return relativePath;

    // Compose full URL
    return S3Utils.composePublicUrl(relativePath);
  }

  /**
   * Process URL fields in a record
   */
  processUrlFields(record) {
    const updates = {};
    const originalValues = {};

    const convertFunction = isRollback
      ? this.relativePathToUrl.bind(this)
      : this.urlToRelativePath.bind(this);

    // Process main URL field (for Media records)
    if (record.url) {
      const converted = convertFunction(record.url);
      if (converted && converted !== record.url) {
        originalValues.url = record.url;
        updates.url = converted;
      }
    }

    // Process thumbnailUrl field
    if (record.thumbnailUrl) {
      const converted = convertFunction(record.thumbnailUrl);
      if (converted && converted !== record.thumbnailUrl) {
        originalValues.thumbnailUrl = record.thumbnailUrl;
        updates.thumbnailUrl = converted;
      }
    }

    // Process thumbnailUrls object
    if (record.thumbnailUrls && typeof record.thumbnailUrls === "object") {
      const originalThumbnailUrls = { ...record.thumbnailUrls };
      const updatedThumbnailUrls = { ...record.thumbnailUrls };
      let hasChanges = false;

      for (const [size, url] of Object.entries(originalThumbnailUrls)) {
        if (typeof url === "string") {
          const converted = convertFunction(url);
          if (converted && converted !== url) {
            updatedThumbnailUrls[size] = converted;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        originalValues.thumbnailUrls = originalThumbnailUrls;
        updates.thumbnailUrls = updatedThumbnailUrls;
      }
    }

    // Process coverImageUrl field (for Album records)
    if (record.coverImageUrl) {
      const converted = convertFunction(record.coverImageUrl);
      if (converted && converted !== record.coverImageUrl) {
        originalValues.coverImageUrl = record.coverImageUrl;
        updates.coverImageUrl = converted;
      }
    }

    return { updates, originalValues };
  }

  /**
   * Update a single record in DynamoDB
   */
  async updateRecord(record) {
    if (Object.keys(record.updates).length === 0) {
      return true; // No updates needed
    }

    try {
      const updateExpression = `SET ${Object.keys(record.updates)
        .map((key) => `#${key} = :${key}`)
        .join(", ")}`;
      const expressionAttributeNames = Object.keys(record.updates).reduce(
        (acc, key) => {
          acc[`#${key}`] = key;
          return acc;
        },
        {}
      );
      const expressionAttributeValues = Object.keys(record.updates).reduce(
        (acc, key) => {
          acc[`:${key}`] = record.updates[key];
          return acc;
        },
        {}
      );

      if (!isDryRun) {
        await this.dynamoClient.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: marshall({ PK: record.PK, SK: record.SK }),
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: marshall(expressionAttributeValues),
          })
        );
      }

      return true;
    } catch (error) {
      console.error(
        `Failed to update record ${record.PK}#${record.SK}:`,
        error
      );
      return false;
    }
  }

  /**
   * Scan and process all records
   */
  async scanAndProcess() {
    let lastEvaluatedKey;

    do {
      try {
        const scanCommand = new ScanCommand({
          TableName: TABLE_NAME,
          ExclusiveStartKey: lastEvaluatedKey,
          Limit: 100, // Process in smaller chunks
        });

        const response = await this.dynamoClient.send(scanCommand);

        if (response.Items) {
          const records = response.Items.map((item) => unmarshall(item));
          await this.processBatch(records);
        }

        lastEvaluatedKey = response.LastEvaluatedKey;

        // Progress indicator
        if (this.processedCount % 100 === 0) {
          console.log(
            `Processed ${this.processedCount} records, updated ${this.updatedCount}`
          );
        }
      } catch (error) {
        console.error("Error scanning DynamoDB:", error);
        this.errorCount++;
        break;
      }
    } while (lastEvaluatedKey);
  }

  /**
   * Process a batch of records
   */
  async processBatch(records) {
    const recordsToUpdate = [];

    for (const record of records) {
      this.processedCount++;

      // Only process Album and Media entities
      if (
        !record.EntityType ||
        !["Album", "Media"].includes(record.EntityType)
      ) {
        continue;
      }

      const { updates, originalValues } = this.processUrlFields(record);

      if (Object.keys(updates).length > 0) {
        const migrationRecord = {
          PK: record.PK,
          SK: record.SK,
          updates,
          originalValues,
        };

        recordsToUpdate.push(migrationRecord);
        this.backupData.push(migrationRecord);

        if (isDryRun) {
          console.log(
            `[DRY RUN] Would update ${record.PK}#${record.SK}:`,
            updates
          );
        } else {
          console.log(`Updating ${record.PK}#${record.SK}:`, updates);
        }
      }
    }

    // Update records
    for (const record of recordsToUpdate) {
      const success = await this.updateRecord(record);
      if (success) {
        this.updatedCount++;
      } else {
        this.errorCount++;
      }
    }
  }

  /**
   * Save backup data for potential rollback
   */
  async saveBackup() {
    if (this.backupData.length === 0) return;

    const backupFile = `migration-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const fs = require("fs/promises");

    try {
      await fs.writeFile(backupFile, JSON.stringify(this.backupData, null, 2));
      console.log(`Backup data saved to: ${backupFile}`);
    } catch (error) {
      console.error("Failed to save backup:", error);
    }
  }

  /**
   * Run the migration
   */
  async run() {
    console.log(
      `Starting URL migration${isDryRun ? " (DRY RUN)" : ""}${
        isRollback ? " (ROLLBACK MODE)" : ""
      }`
    );
    console.log(`Target table: ${TABLE_NAME}`);
    console.log("---");

    const startTime = Date.now();

    try {
      await this.scanAndProcess();

      if (!isDryRun && this.backupData.length > 0) {
        await this.saveBackup();
      }

      const duration = (Date.now() - startTime) / 1000;

      console.log("---");
      console.log("Migration completed!");
      console.log(`Records processed: ${this.processedCount}`);
      console.log(`Records updated: ${this.updatedCount}`);
      console.log(`Errors: ${this.errorCount}`);
      console.log(`Duration: ${duration.toFixed(2)}s`);

      if (isDryRun) {
        console.log(
          "\nThis was a dry run. No changes were made to the database."
        );
        console.log("Run without --dry-run to execute the migration.");
      }
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  }
}

// Validate environment
if (!TABLE_NAME) {
  console.error("DYNAMODB_TABLE environment variable is required");
  process.exit(1);
}

// Run migration
const migration = new URLMigration();
migration.run().catch(console.error);
