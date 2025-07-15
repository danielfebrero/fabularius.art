#!/usr/bin/env node

/**
 * Migration Script: Convert existing JPEG and PNG files to WebP format
 *
 * This script migrates existing JPEG and PNG thumbnail files to WebP format and
 * creates WebP display versions of original files for lightbox functionality,
 * updating DynamoDB records and S3 storage accordingly.
 *
 * Features:
 * - Preserves original files in their current format (for downloads)
 * - Creates WebP display versions of original files (for lightbox performance)
 * - Converts thumbnails to WebP format (for browsing performance)
 * - Updates database with metadata.webpDisplayUrl field
 *
 * Usage:
 *   node scripts/migrate-to-webp.js [options]
 *
 * Options:
 *   --dry-run                   Preview changes without making them
 *   --batch-size=10             Number of records to process at once
 *   --resume-from=mediaId       Resume from specific media ID
 *   --album-id=albumId          Process only specific album
 *   --log-level=info            Log level (debug, info, warn, error)
 *   --skip-originals            Skip original file conversion (thumbnails only)
 *
 * Examples:
 *   node scripts/migrate-to-webp.js --dry-run
 *   node scripts/migrate-to-webp.js --batch-size=5 --album-id=abc123
 *   node scripts/migrate-to-webp.js --resume-from=media456
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const path = require("path");

// Dynamic Sharp import for platform compatibility
let sharp;
const loadSharp = async () => {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("✓ Sharp module loaded successfully");
    } catch (error) {
      console.error("✗ Failed to load Sharp module:", error.message);
      throw new Error(
        "Sharp module not available. Please install Sharp: npm install sharp"
      );
    }
  }
  return sharp;
};

// Configuration
const THUMBNAIL_CONFIGS = {
  cover: { width: 128, height: 128, quality: 80, suffix: "_thumb_cover" },
  small: { width: 240, height: 240, quality: 85, suffix: "_thumb_small" },
  medium: { width: 300, height: 300, quality: 90, suffix: "_thumb_medium" },
  large: { width: 365, height: 365, quality: 90, suffix: "_thumb_large" },
  xlarge: { width: 600, height: 600, quality: 95, suffix: "_thumb_xlarge" },
};

const DISPLAY_QUALITY = 95; // WebP quality for display versions (matching new upload processing)
const DEFAULT_BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    batchSize: DEFAULT_BATCH_SIZE,
    resumeFrom: null,
    albumId: null,
    logLevel: "info",
    skipOriginals: false,
  };

  args.forEach((arg) => {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseInt(arg.split("=")[1]) || DEFAULT_BATCH_SIZE;
    } else if (arg.startsWith("--resume-from=")) {
      options.resumeFrom = arg.split("=")[1];
    } else if (arg.startsWith("--album-id=")) {
      options.albumId = arg.split("=")[1];
    } else if (arg.startsWith("--log-level=")) {
      options.logLevel = arg.split("=")[1];
    } else if (arg === "--skip-originals") {
      options.skipOriginals = true;
    } else if (arg === "--help") {
      console.log(`
Migration Script: Convert existing JPEG files to WebP format

Usage: node scripts/migrate-to-webp.js [options]

Options:
  --dry-run                   Preview changes without making them
  --batch-size=10             Number of records to process at once
  --resume-from=mediaId       Resume from specific media ID
  --album-id=albumId          Process only specific album
  --log-level=info            Log level (debug, info, warn, error)
  --skip-originals            Skip original file conversion (thumbnails only)
  --help                      Show this help message

Examples:
  node scripts/migrate-to-webp.js --dry-run
  node scripts/migrate-to-webp.js --batch-size=5 --album-id=abc123
  node scripts/migrate-to-webp.js --resume-from=media456
      `);
      process.exit(0);
    }
  });

  return options;
};

// Logging utility
class Logger {
  constructor(level = "info") {
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.level = this.levels[level] || 1;
    this.startTime = Date.now();
  }

  debug(...args) {
    if (this.level <= 0) console.log("🔍 DEBUG:", ...args);
  }
  info(...args) {
    if (this.level <= 1) console.log("ℹ️  INFO:", ...args);
  }
  warn(...args) {
    if (this.level <= 2) console.warn("⚠️  WARN:", ...args);
  }
  error(...args) {
    if (this.level <= 3) console.error("❌ ERROR:", ...args);
  }

  success(...args) {
    console.log("✅ SUCCESS:", ...args);
  }
  progress(...args) {
    console.log("🔄 PROGRESS:", ...args);
  }

  getElapsedTime() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}

// Statistics tracking
class MigrationStats {
  constructor() {
    this.totalRecords = 0;
    this.processedRecords = 0;
    this.skippedRecords = 0;
    this.failedRecords = 0;
    this.convertedThumbnails = 0;
    this.convertedOriginals = 0;
    this.createdDisplayVersions = 0;
    this.deletedFiles = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addError(mediaId, albumId, error) {
    this.errors.push({
      mediaId,
      albumId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    this.failedRecords++;
  }

  getReport() {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    return {
      totalRecords: this.totalRecords,
      processedRecords: this.processedRecords,
      skippedRecords: this.skippedRecords,
      failedRecords: this.failedRecords,
      convertedThumbnails: this.convertedThumbnails,
      convertedOriginals: this.convertedOriginals,
      createdDisplayVersions: this.createdDisplayVersions,
      deletedFiles: this.deletedFiles,
      errors: this.errors,
      elapsedSeconds: elapsed,
      recordsPerSecond:
        elapsed > 0 ? (this.processedRecords / elapsed).toFixed(2) : 0,
    };
  }
}

// AWS Service wrapper
class AWSService {
  constructor() {
    this.isLocal = process.env.AWS_SAM_LOCAL === "true";
    this.initializeClients();
  }

  initializeClients() {
    const clientConfig = {};

    if (this.isLocal) {
      clientConfig.endpoint = "http://localhost:4566";
      clientConfig.region = "us-east-1";
      clientConfig.credentials = {
        accessKeyId: "test",
        secretAccessKey: "test",
      };
      clientConfig.forcePathStyle = true;
    }

    this.dynamoClient = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.s3Client = new S3Client(clientConfig);

    this.tableName = process.env.DYNAMODB_TABLE;
    this.bucketName = this.isLocal
      ? "local-pornspot-media"
      : process.env.S3_BUCKET;

    if (!this.tableName || !this.bucketName) {
      throw new Error(
        "Missing required environment variables: DYNAMODB_TABLE, S3_BUCKET"
      );
    }
  }

  async scanMediaRecords(options = {}) {
    const params = {
      TableName: this.tableName,
      FilterExpression: "EntityType = :entityType",
      ExpressionAttributeValues: {
        ":entityType": "Media",
      },
    };

    // Add album filter if specified
    if (options.albumId) {
      params.FilterExpression += " AND albumId = :albumId";
      params.ExpressionAttributeValues[":albumId"] = options.albumId;
    }

    // Add resume capability
    if (options.lastEvaluatedKey) {
      params.ExclusiveStartKey = options.lastEvaluatedKey;
    }

    const result = await this.docClient.send(new ScanCommand(params));
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async downloadFile(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`No body in S3 response for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks = [];
    const stream = response.Body;

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async uploadFile(key, buffer, mimeType, metadata = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    await this.s3Client.send(command);
  }

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async updateMediaRecord(albumId, mediaId, updates) {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && key !== "id" && key !== "albumId") {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    if (updateExpressions.length === 0) return;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `ALBUM#${albumId}`,
        SK: `MEDIA#${mediaId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await this.docClient.send(command);
  }
}

// File processing utilities
class FileProcessor {
  constructor(logger) {
    this.logger = logger;
  }

  isConvertibleFile(url) {
    return (
      url &&
      (url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png"))
    );
  }

  isJpegFile(url) {
    return url && (url.includes(".jpg") || url.includes(".jpeg"));
  }

  isPngFile(url) {
    return url && url.includes(".png");
  }

  hasConvertibleThumbnails(media) {
    if (!media.thumbnailUrls) return false;

    return Object.values(media.thumbnailUrls).some((url) =>
      this.isConvertibleFile(url)
    );
  }

  hasJpegThumbnails(media) {
    if (!media.thumbnailUrls) return false;

    return Object.values(media.thumbnailUrls).some((url) =>
      this.isJpegFile(url)
    );
  }

  hasPngThumbnails(media) {
    if (!media.thumbnailUrls) return false;

    return Object.values(media.thumbnailUrls).some((url) =>
      this.isPngFile(url)
    );
  }

  needsDisplayVersion(media) {
    // Check if original file is convertible and doesn't already have a WebP display version
    return (
      this.isConvertibleFile(media.url) &&
      (!media.metadata || !media.metadata.webpDisplayUrl)
    );
  }

  generateDisplayKey(originalKey) {
    const parsedPath = path.parse(originalKey);
    return `${parsedPath.dir}/${parsedPath.name}_display.webp`;
  }

  generateDisplayUrl(originalUrl) {
    if (!originalUrl) return null;

    // Convert original URL to display URL
    const parsedPath = path.parse(originalUrl);
    return `${parsedPath.dir}/${parsedPath.name}_display.webp`;
  }

  extractKeyFromUrl(url) {
    if (!url) return null;

    // Handle relative URLs that start with '/'
    if (url.startsWith("/")) {
      return url.substring(1);
    }

    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, assume it's already a key
      return url;
    }
  }

  async convertToWebP(buffer, quality = 95) {
    const sharpInstance = await loadSharp();
    return await sharpInstance(buffer).webp({ quality }).toBuffer();
  }

  generateWebpKey(originalKey) {
    const parsedPath = path.parse(originalKey);
    return `${parsedPath.dir}/${parsedPath.name}.webp`;
  }

  generateWebpUrl(originalUrl) {
    if (!originalUrl) return null;

    // Replace .jpg, .jpeg, or .png with .webp
    return originalUrl.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
}

// Main migration class
class WebPMigrator {
  constructor(options) {
    this.options = options;
    this.logger = new Logger(options.logLevel);
    this.stats = new MigrationStats();
    this.awsService = new AWSService();
    this.fileProcessor = new FileProcessor(this.logger);
    this.processedIds = new Set();

    if (options.resumeFrom) {
      this.logger.info(
        `Resuming migration from media ID: ${options.resumeFrom}`
      );
    }
  }

  async run() {
    this.logger.info("🚀 Starting WebP migration...");
    this.logger.info(`Options: ${JSON.stringify(this.options, null, 2)}`);

    if (this.options.dryRun) {
      this.logger.warn("🔍 DRY RUN MODE - No changes will be made");
    }

    try {
      await loadSharp(); // Verify Sharp is available
      await this.processAllRecords();
      await this.generateReport();
    } catch (error) {
      this.logger.error("Migration failed:", error);
      process.exit(1);
    }
  }

  async processAllRecords() {
    let lastEvaluatedKey = null;
    let resumeFound = !this.options.resumeFrom;

    do {
      const result = await this.awsService.scanMediaRecords({
        albumId: this.options.albumId,
        lastEvaluatedKey,
      });

      const records = result.items;
      this.stats.totalRecords += records.length;

      if (records.length === 0) {
        this.logger.info("No more records to process");
        break;
      }

      // Filter records if resuming
      let filteredRecords = records;
      if (!resumeFound) {
        const resumeIndex = records.findIndex(
          (r) => r.id === this.options.resumeFrom
        );
        if (resumeIndex >= 0) {
          filteredRecords = records.slice(resumeIndex);
          resumeFound = true;
          this.logger.info(
            `Found resume point, processing from record ${resumeIndex + 1}/${
              records.length
            }`
          );
        } else {
          this.logger.debug(
            `Resume point not found in current batch, skipping ${records.length} records`
          );
          filteredRecords = [];
        }
      }

      // Process records in batches
      for (let i = 0; i < filteredRecords.length; i += this.options.batchSize) {
        const batch = filteredRecords.slice(i, i + this.options.batchSize);
        await this.processBatch(batch);

        const processed = Math.min(
          i + this.options.batchSize,
          filteredRecords.length
        );
        this.logger.progress(
          `Processed ${processed}/${filteredRecords.length} records in current scan`
        );
      }

      lastEvaluatedKey = result.lastEvaluatedKey;
    } while (lastEvaluatedKey);

    this.logger.success(
      `Migration completed! Processed ${
        this.stats.processedRecords
      } records in ${this.logger.getElapsedTime()}s`
    );
  }

  async processBatch(records) {
    const promises = records.map((record) => this.processRecord(record));
    await Promise.allSettled(promises);
  }

  async processRecord(media) {
    if (this.processedIds.has(media.id)) {
      this.logger.debug(`Skipping already processed record: ${media.id}`);
      this.stats.skippedRecords++;
      return;
    }

    this.processedIds.add(media.id);

    try {
      const needsConversion = this.needsConversion(media);

      if (!needsConversion) {
        this.logger.debug(`Record ${media.id} doesn't need conversion`);
        this.stats.skippedRecords++;
        return;
      }

      this.logger.info(
        `Processing record ${media.id} (Album: ${media.albumId})`
      );

      if (this.options.dryRun) {
        this.logDryRunChanges(media);
        this.stats.processedRecords++;
        return;
      }

      await this.convertMediaFiles(media);
      this.stats.processedRecords++;
    } catch (error) {
      this.logger.error(`Failed to process record ${media.id}:`, error.message);
      this.stats.addError(media.id, media.albumId, error);
    }
  }

  needsConversion(media) {
    // Check if thumbnails need conversion OR if original needs WebP display version
    return (
      this.fileProcessor.hasConvertibleThumbnails(media) ||
      this.fileProcessor.needsDisplayVersion(media)
    );
  }

  logDryRunChanges(media) {
    const changes = [];

    // Show that original file is preserved
    changes.push(`Original: ${media.url} (preserved for downloads)`);

    // Show WebP display version creation if needed
    if (this.fileProcessor.needsDisplayVersion(media)) {
      const displayUrl = this.fileProcessor.generateDisplayUrl(media.url);
      changes.push(`WebP Display Version: ${displayUrl} (for lightbox)`);
    }

    if (media.thumbnailUrls) {
      Object.entries(media.thumbnailUrls).forEach(([size, url]) => {
        if (this.fileProcessor.isConvertibleFile(url)) {
          const format = this.fileProcessor.isPngFile(url) ? "PNG" : "JPEG";
          changes.push(
            `Thumbnail ${size} (${format}): ${url} → ${this.fileProcessor.generateWebpUrl(
              url
            )}`
          );
        }
      });
    }

    this.logger.info(
      `[DRY RUN] Would convert ${media.id}:\n  ${changes.join("\n  ")}`
    );
  }

  async convertMediaFiles(media) {
    const updates = {};
    let hasChanges = false;

    // Create WebP display version if needed (preserving original for downloads)
    if (this.fileProcessor.needsDisplayVersion(media)) {
      await this.createDisplayVersion(media, updates);
      hasChanges = true;
    }

    // Convert thumbnails to WebP
    if (this.fileProcessor.hasConvertibleThumbnails(media)) {
      await this.convertThumbnails(media, updates);
      hasChanges = true;
    }

    // Update database record if there were changes
    if (hasChanges) {
      updates.updatedAt = new Date().toISOString();
      await this.awsService.updateMediaRecord(media.albumId, media.id, updates);
      this.logger.success(
        `Updated database record for ${media.id} (display version and/or thumbnails)`
      );
    }
  }

  async createDisplayVersion(media, updates) {
    if (!this.fileProcessor.needsDisplayVersion(media)) return;

    await this.retryOperation(async () => {
      this.logger.debug(`Creating WebP display version for: ${media.url}`);

      const originalKey = this.fileProcessor.extractKeyFromUrl(media.url);
      const buffer = await this.awsService.downloadFile(originalKey);

      // Convert to WebP with high quality for lightbox display
      const webpBuffer = await this.fileProcessor.convertToWebP(
        buffer,
        DISPLAY_QUALITY
      );
      const displayKey = this.fileProcessor.generateDisplayKey(originalKey);

      await this.awsService.uploadFile(displayKey, webpBuffer, "image/webp", {
        "original-key": originalKey,
        purpose: "lightbox-display",
        "converted-to-webp": "true",
        "migration-timestamp": new Date().toISOString(),
      });

      // Update metadata with WebP display URL
      const displayUrl = `/${displayKey}`;
      updates.metadata = {
        ...media.metadata,
        webpDisplayUrl: displayUrl,
      };

      this.stats.createdDisplayVersions++;
      this.logger.success(
        `Created WebP display version: ${originalKey} → ${displayKey}`
      );
    });
  }

  async convertThumbnails(media, updates) {
    if (!media.thumbnailUrls) return;

    const newThumbnailUrls = { ...media.thumbnailUrls };

    for (const [size, url] of Object.entries(media.thumbnailUrls)) {
      if (this.fileProcessor.isConvertibleFile(url)) {
        await this.retryOperation(async () => {
          const format = this.fileProcessor.isPngFile(url) ? "PNG" : "JPEG";
          this.logger.debug(`Converting ${format} thumbnail ${size}: ${url}`);

          const originalKey = this.fileProcessor.extractKeyFromUrl(url);
          const buffer = await this.awsService.downloadFile(originalKey);

          const quality = THUMBNAIL_CONFIGS[size]?.quality || 90;
          const webpBuffer = await this.fileProcessor.convertToWebP(
            buffer,
            quality
          );
          const webpKey = this.fileProcessor.generateWebpKey(originalKey);

          await this.awsService.uploadFile(webpKey, webpBuffer, "image/webp", {
            "original-key": originalKey,
            "thumbnail-size": size,
            "converted-to-webp": "true",
            "migration-timestamp": new Date().toISOString(),
          });

          // Update thumbnail URL
          newThumbnailUrls[size] = `/${webpKey}`;

          // Delete original thumbnail if key changed
          if (webpKey !== originalKey) {
            await this.awsService.deleteFile(originalKey);
            this.stats.deletedFiles++;
          }

          this.stats.convertedThumbnails++;
          this.logger.success(
            `Converted thumbnail ${size}: ${originalKey} → ${webpKey}`
          );
        });
      }
    }

    updates.thumbnailUrls = newThumbnailUrls;

    // Update single thumbnail URL if it was using the small size
    if (
      media.thumbnailUrl &&
      this.fileProcessor.isConvertibleFile(media.thumbnailUrl)
    ) {
      updates.thumbnailUrl =
        newThumbnailUrls.small || Object.values(newThumbnailUrls)[0];
    }
  }

  async retryOperation(operation, maxRetries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        this.logger.warn(
          `Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  async generateReport() {
    const report = this.stats.getReport();
    const reportPath = `migration-report-${Date.now()}.json`;

    this.logger.info("\n📊 Migration Report:");
    this.logger.info(`Total Records: ${report.totalRecords}`);
    this.logger.info(`Processed: ${report.processedRecords}`);
    this.logger.info(`Skipped: ${report.skippedRecords}`);
    this.logger.info(`Failed: ${report.failedRecords}`);
    this.logger.info(`Converted Originals: ${report.convertedOriginals}`);
    this.logger.info(
      `Created Display Versions: ${report.createdDisplayVersions}`
    );
    this.logger.info(`Converted Thumbnails: ${report.convertedThumbnails}`);
    this.logger.info(`Deleted Files: ${report.deletedFiles}`);
    this.logger.info(`Elapsed Time: ${report.elapsedSeconds}s`);
    this.logger.info(
      `Processing Rate: ${report.recordsPerSecond} records/second`
    );

    if (report.errors.length > 0) {
      this.logger.warn(`Errors occurred: ${report.errors.length}`);
      const errorPath = `migration-errors-${Date.now()}.json`;
      await fs.writeFile(errorPath, JSON.stringify(report.errors, null, 2));
      this.logger.info(`Error details saved to: ${errorPath}`);
    }

    // Save full report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.logger.success(`Full report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const migrator = new WebPMigrator(options);
    await migrator.run();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { WebPMigrator, parseArgs };
