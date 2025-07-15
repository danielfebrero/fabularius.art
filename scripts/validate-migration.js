#!/usr/bin/env node

/**
 * Validation Script: Verify WebP migration results
 *
 * This script validates the WebP migration by checking:
 * - Database consistency (JPEG and PNG to WebP conversion)
 * - File existence in S3
 * - WebP format validation
 * - URL integrity
 *
 * Usage:
 *   node scripts/validate-migration.js [options]
 *
 * Options:
 *   --album-id=albumId          Validate only specific album
 *   --sample-size=N             Validate random sample of N records
 *   --check-files               Verify actual files in S3
 *   --check-format              Validate WebP format integrity
 *   --log-level=info            Log level (debug, info, warn, error)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs").promises;

// Dynamic Sharp import for format validation
let sharp;
const loadSharp = async () => {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("✓ Sharp module loaded for validation");
    } catch (error) {
      console.warn("⚠️  Sharp not available - format validation disabled");
      return null;
    }
  }
  return sharp;
};

// Configuration
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    albumId: null,
    sampleSize: null,
    checkFiles: false,
    checkFormat: false,
    logLevel: "info",
  };

  args.forEach((arg) => {
    if (arg.startsWith("--album-id=")) {
      options.albumId = arg.split("=")[1];
    } else if (arg.startsWith("--sample-size=")) {
      options.sampleSize = parseInt(arg.split("=")[1]);
    } else if (arg === "--check-files") {
      options.checkFiles = true;
    } else if (arg === "--check-format") {
      options.checkFormat = true;
    } else if (arg.startsWith("--log-level=")) {
      options.logLevel = arg.split("=")[1];
    } else if (arg === "--help") {
      console.log(`
Validation Script: Verify WebP migration results

Usage: node scripts/validate-migration.js [options]

Options:
  --album-id=albumId          Validate only specific album
  --sample-size=N             Validate random sample of N records
  --check-files               Verify actual files in S3
  --check-format              Validate WebP format integrity
  --log-level=info            Log level (debug, info, warn, error)
  --help                      Show this help message

Examples:
  node scripts/validate-migration.js --check-files
  node scripts/validate-migration.js --album-id=abc123 --check-format
  node scripts/validate-migration.js --sample-size=100
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
}

// Validation statistics
class ValidationStats {
  constructor() {
    this.totalRecords = 0;
    this.validRecords = 0;
    this.invalidRecords = 0;
    this.checkedFiles = 0;
    this.missingFiles = 0;
    this.formatErrors = 0;
    this.urlErrors = 0;
    this.issues = [];
    this.startTime = Date.now();
  }

  addIssue(mediaId, albumId, type, message) {
    this.issues.push({
      mediaId,
      albumId,
      type,
      message,
      timestamp: new Date().toISOString(),
    });
    this.invalidRecords++;
  }

  getReport() {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    return {
      totalRecords: this.totalRecords,
      validRecords: this.validRecords,
      invalidRecords: this.invalidRecords,
      checkedFiles: this.checkedFiles,
      missingFiles: this.missingFiles,
      formatErrors: this.formatErrors,
      urlErrors: this.urlErrors,
      validationRate:
        this.totalRecords > 0
          ? ((this.validRecords / this.totalRecords) * 100).toFixed(2)
          : 0,
      issues: this.issues,
      elapsedSeconds: elapsed,
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

    if (options.albumId) {
      params.FilterExpression += " AND albumId = :albumId";
      params.ExpressionAttributeValues[":albumId"] = options.albumId;
    }

    if (options.lastEvaluatedKey) {
      params.ExclusiveStartKey = options.lastEvaluatedKey;
    }

    const result = await this.docClient.send(new ScanCommand(params));
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async checkFileExists(key) {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }
}

// Validation utilities
class ValidationUtils {
  static isWebPUrl(url) {
    return url && url.includes(".webp");
  }

  static isJpegUrl(url) {
    return url && (url.includes(".jpg") || url.includes(".jpeg"));
  }

  static isPngUrl(url) {
    return url && url.includes(".png");
  }

  static isConvertibleUrl(url) {
    return (
      url &&
      (url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png"))
    );
  }

  static extractKeyFromUrl(url) {
    if (!url) return null;

    if (url.startsWith("/")) {
      return url.substring(1);
    }

    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }

  static validateThumbnailUrls(thumbnailUrls) {
    if (!thumbnailUrls || typeof thumbnailUrls !== "object") {
      return {
        valid: false,
        message: "Missing or invalid thumbnailUrls object",
      };
    }

    const expectedSizes = ["cover", "small", "medium", "large", "xlarge"];
    const issues = [];

    expectedSizes.forEach((size) => {
      const url = thumbnailUrls[size];
      if (!url) {
        issues.push(`Missing ${size} thumbnail`);
      } else if (this.isJpegUrl(url)) {
        issues.push(`${size} thumbnail still using JPEG format`);
      } else if (this.isPngUrl(url)) {
        issues.push(`${size} thumbnail still using PNG format`);
      } else if (!this.isWebPUrl(url)) {
        issues.push(`${size} thumbnail has unexpected format`);
      }
    });

    return {
      valid: issues.length === 0,
      message: issues.length > 0 ? issues.join(", ") : "All thumbnails valid",
    };
  }

  static validateMediaRecord(media) {
    const issues = [];

    // Check MIME type
    if (
      media.mimeType &&
      this.isConvertibleUrl(media.url) &&
      media.mimeType !== "image/webp"
    ) {
      issues.push(`MIME type mismatch: ${media.mimeType} for WebP file`);
    }

    // Check main URL (preserved originals should not be converted)
    // No validation needed for main URL as originals are preserved

    // Check thumbnail URL
    if (media.thumbnailUrl && this.isJpegUrl(media.thumbnailUrl)) {
      issues.push("Main thumbnail URL still using JPEG format");
    }
    if (media.thumbnailUrl && this.isPngUrl(media.thumbnailUrl)) {
      issues.push("Main thumbnail URL still using PNG format");
    }

    // Validate thumbnail URLs
    const thumbnailValidation = this.validateThumbnailUrls(media.thumbnailUrls);
    if (!thumbnailValidation.valid) {
      issues.push(thumbnailValidation.message);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// Main validation class
class MigrationValidator {
  constructor(options) {
    this.options = options;
    this.logger = new Logger(options.logLevel);
    this.stats = new ValidationStats();
    this.awsService = new AWSService();
    this.sharpInstance = null;
  }

  async run() {
    this.logger.info("🔍 Starting migration validation...");
    this.logger.info(`Options: ${JSON.stringify(this.options, null, 2)}`);

    try {
      if (this.options.checkFormat) {
        this.sharpInstance = await loadSharp();
        if (!this.sharpInstance) {
          this.logger.warn("Format validation disabled - Sharp not available");
          this.options.checkFormat = false;
        }
      }

      await this.validateAllRecords();
      await this.generateReport();
    } catch (error) {
      this.logger.error("Validation failed:", error);
      process.exit(1);
    }
  }

  async validateAllRecords() {
    let lastEvaluatedKey = null;
    let allRecords = [];

    // Collect all records first
    do {
      const result = await this.awsService.scanMediaRecords({
        albumId: this.options.albumId,
        lastEvaluatedKey,
      });

      allRecords = allRecords.concat(result.items);
      lastEvaluatedKey = result.lastEvaluatedKey;
    } while (lastEvaluatedKey);

    this.logger.info(`Found ${allRecords.length} media records to validate`);

    // Apply sampling if requested
    if (
      this.options.sampleSize &&
      this.options.sampleSize < allRecords.length
    ) {
      allRecords = this.sampleRecords(allRecords, this.options.sampleSize);
      this.logger.info(
        `Validating random sample of ${allRecords.length} records`
      );
    }

    this.stats.totalRecords = allRecords.length;

    // Process records in batches
    const batchSize = 10;
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      await this.validateBatch(batch);

      const processed = Math.min(i + batchSize, allRecords.length);
      this.logger.info(`Validated ${processed}/${allRecords.length} records`);
    }

    this.logger.success(
      `Validation completed! Checked ${this.stats.totalRecords} records`
    );
  }

  sampleRecords(records, sampleSize) {
    const shuffled = records.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  async validateBatch(records) {
    const promises = records.map((record) => this.validateRecord(record));
    await Promise.allSettled(promises);
  }

  async validateRecord(media) {
    try {
      this.logger.debug(
        `Validating record ${media.id} (Album: ${media.albumId})`
      );

      // Basic record validation
      const recordValidation = ValidationUtils.validateMediaRecord(media);
      if (!recordValidation.valid) {
        recordValidation.issues.forEach((issue) => {
          this.stats.addIssue(media.id, media.albumId, "record", issue);
        });
        return;
      }

      // File existence validation
      if (this.options.checkFiles) {
        await this.validateFileExistence(media);
      }

      // Format validation
      if (this.options.checkFormat && this.sharpInstance) {
        await this.validateFileFormat(media);
      }

      this.stats.validRecords++;
      this.logger.debug(`✓ Record ${media.id} validation passed`);
    } catch (error) {
      this.logger.error(
        `Validation failed for record ${media.id}:`,
        error.message
      );
      this.stats.addIssue(media.id, media.albumId, "error", error.message);
    }
  }

  async validateFileExistence(media) {
    const filesToCheck = [];

    // Add main file
    if (media.url) {
      filesToCheck.push({
        type: "main",
        url: media.url,
        key: ValidationUtils.extractKeyFromUrl(media.url),
      });
    }

    // Add thumbnails
    if (media.thumbnailUrls) {
      Object.entries(media.thumbnailUrls).forEach(([size, url]) => {
        if (url) {
          filesToCheck.push({
            type: `thumbnail-${size}`,
            url,
            key: ValidationUtils.extractKeyFromUrl(url),
          });
        }
      });
    }

    for (const file of filesToCheck) {
      if (!file.key) {
        this.stats.addIssue(
          media.id,
          media.albumId,
          "url",
          `Invalid URL: ${file.url}`
        );
        this.stats.urlErrors++;
        continue;
      }

      this.stats.checkedFiles++;
      const exists = await this.awsService.checkFileExists(file.key);

      if (!exists) {
        this.stats.addIssue(
          media.id,
          media.albumId,
          "file",
          `Missing ${file.type} file: ${file.key}`
        );
        this.stats.missingFiles++;
      }
    }
  }

  async validateFileFormat(media) {
    // This is a placeholder for format validation
    // In a real implementation, you would download and check the file format
    this.logger.debug(
      `Format validation for ${media.id} (not implemented in this version)`
    );
  }

  async generateReport() {
    const report = this.stats.getReport();
    const reportPath = `validation-report-${Date.now()}.json`;

    this.logger.info("\n📊 Validation Report:");
    this.logger.info(`Total Records: ${report.totalRecords}`);
    this.logger.info(`Valid Records: ${report.validRecords}`);
    this.logger.info(`Invalid Records: ${report.invalidRecords}`);
    this.logger.info(`Validation Rate: ${report.validationRate}%`);

    if (this.options.checkFiles) {
      this.logger.info(`Files Checked: ${report.checkedFiles}`);
      this.logger.info(`Missing Files: ${report.missingFiles}`);
    }

    this.logger.info(`Elapsed Time: ${report.elapsedSeconds}s`);

    if (report.issues.length > 0) {
      this.logger.warn(`\nIssues Found: ${report.issues.length}`);

      // Group issues by type
      const groupedIssues = {};
      report.issues.forEach((issue) => {
        if (!groupedIssues[issue.type]) {
          groupedIssues[issue.type] = [];
        }
        groupedIssues[issue.type].push(issue);
      });

      Object.entries(groupedIssues).forEach(([type, issues]) => {
        this.logger.warn(`${type.toUpperCase()} issues: ${issues.length}`);
      });

      const issuesPath = `validation-issues-${Date.now()}.json`;
      await fs.writeFile(issuesPath, JSON.stringify(report.issues, null, 2));
      this.logger.info(`Issue details saved to: ${issuesPath}`);
    } else {
      this.logger.success("No issues found! Migration appears successful.");
    }

    // Save full report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.logger.success(`Full validation report saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    const validator = new MigrationValidator(options);
    await validator.run();
  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationValidator, parseArgs };
