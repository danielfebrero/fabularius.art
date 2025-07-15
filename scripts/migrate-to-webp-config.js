/**
 * Configuration file for WebP migration script
 *
 * This file contains all configurable settings for the migration process.
 * Modify these values to customize the migration behavior.
 */

module.exports = {
  // Thumbnail configurations matching the main application
  thumbnailConfigs: {
    cover: { width: 128, height: 128, quality: 80, suffix: "_thumb_cover" },
    small: { width: 240, height: 240, quality: 85, suffix: "_thumb_small" },
    medium: { width: 300, height: 300, quality: 90, suffix: "_thumb_medium" },
    large: { width: 365, height: 365, quality: 90, suffix: "_thumb_large" },
    xlarge: { width: 600, height: 600, quality: 95, suffix: "_thumb_xlarge" },
  },

  // Quality settings
  quality: {
    // WebP display version quality (for lightbox performance)
    displayVersion: 95,

    // Thumbnails use size-specific quality (defined above)
    // Fallback quality for custom thumbnails
    defaultThumbnail: 90,
  },

  // Processing settings
  processing: {
    // Default batch size for processing records
    defaultBatchSize: 10,

    // Maximum number of retry attempts for failed operations
    maxRetries: 3,

    // Delay between retry attempts (milliseconds)
    retryDelay: 1000,

    // Timeout for individual file operations (milliseconds)
    operationTimeout: 30000,

    // Maximum file size to process (bytes) - 50MB
    maxFileSize: 50 * 1024 * 1024,
  },

  // File type handling
  fileTypes: {
    // JPEG extensions to convert
    jpegExtensions: [".jpg", ".jpeg"],

    // PNG extensions to convert
    pngExtensions: [".png"],

    // All convertible extensions
    convertibleExtensions: [".jpg", ".jpeg", ".png"],

    // MIME types for thumbnail conversion (originals are preserved)
    convertibleMimeTypes: ["image/jpeg", "image/jpg", "image/png"],

    // File patterns to skip during migration
    skipPatterns: [
      /\/thumbnails\/.*\.webp$/i, // Already WebP thumbnails
    ],
  },

  // AWS Configuration
  aws: {
    // DynamoDB table name (from environment)
    tableName: process.env.DYNAMODB_TABLE,

    // S3 bucket name (from environment)
    bucketName:
      process.env.AWS_SAM_LOCAL === "true"
        ? "local-pornspot-media"
        : process.env.S3_BUCKET,

    // Region configuration
    region: process.env.AWS_REGION || "us-east-1",

    // Local development settings
    local: {
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    },
  },

  // Logging configuration
  logging: {
    // Available log levels: debug, info, warn, error
    defaultLevel: "info",

    // Enable progress reporting
    showProgress: true,

    // Show detailed error information
    verboseErrors: true,

    // Log successful conversions
    logSuccessfulConversions: true,
  },

  // Safety settings
  safety: {
    // Require confirmation for non-dry-run migrations
    requireConfirmation: true,

    // Create backup manifest before starting
    createBackupManifest: true,

    // Validate WebP files before deleting originals
    validateConversions: true,

    // Keep original files for X days (0 = delete immediately)
    retentionDays: 0,
  },

  // Performance tuning
  performance: {
    // Number of concurrent file operations
    concurrentOperations: 3,

    // Memory limit for Sharp operations (MB)
    sharpMemoryLimit: 256,

    // Use streaming for large files
    useStreamingForLargeFiles: true,

    // Large file threshold (bytes)
    largeFileThreshold: 10 * 1024 * 1024,
  },

  // Progress tracking
  progress: {
    // Save progress every N records
    saveProgressInterval: 50,

    // Progress file path
    progressFile: ".migration-progress.json",

    // Enable progress restoration on restart
    enableProgressRestoration: true,
  },

  // Report generation
  reports: {
    // Generate detailed reports
    generateDetailedReports: true,

    // Include timing information
    includeTimingData: true,

    // Include conversion statistics
    includeConversionStats: true,

    // Report output directory
    outputDirectory: "./migration-reports",

    // Report file naming pattern
    fileNamePattern: "migration-report-{timestamp}.json",
  },

  // Validation settings
  validation: {
    // Validate file integrity after conversion
    validateFileIntegrity: true,

    // Check file size reduction (WebP should be smaller)
    validateSizeReduction: false,

    // Maximum allowed size increase (percentage)
    maxSizeIncreasePercent: 20,

    // Validate image dimensions match
    validateDimensions: true,
  },
};
