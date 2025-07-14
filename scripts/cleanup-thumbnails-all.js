#!/usr/bin/env node

// Handle help first before loading other modules
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Complete Thumbnail Cleanup Script");
  console.log("");
  console.log("Usage: node cleanup-thumbnails-all.js [options]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --dry-run    Preview what would be cleaned without actually cleaning"
  );
  console.log("  --skip-s3    Skip S3 cleanup (only clean DynamoDB)");
  console.log("  --skip-db    Skip DynamoDB cleanup (only clean S3)");
  console.log("  --help, -h   Show this help message");
  console.log("");
  console.log("Environment Variables:");
  console.log("  S3_BUCKET       S3 bucket name (required unless --skip-s3)");
  console.log(
    "  DYNAMODB_TABLE  DynamoDB table name (required unless --skip-db)"
  );
  console.log("  AWS_REGION      AWS region (default: us-east-1)");
  console.log("");
  console.log("Examples:");
  console.log("  # Dry run for complete cleanup");
  console.log("  node cleanup-thumbnails-all.js --dry-run");
  console.log("");
  console.log("  # Complete cleanup");
  console.log(
    "  S3_BUCKET=my-bucket DYNAMODB_TABLE=my-table node cleanup-thumbnails-all.js"
  );
  console.log("");
  console.log("  # Only S3 cleanup");
  console.log("  node cleanup-thumbnails-all.js --skip-db");
  console.log("");
  console.log("  # Only DynamoDB cleanup");
  console.log("  node cleanup-thumbnails-all.js --skip-s3");
  process.exit(0);
}

const { cleanupS3Thumbnails } = require("./cleanup-thumbnails-s3");
const { cleanupDynamoDBThumbnails } = require("./cleanup-thumbnails-db");
const readline = require("readline");

// Configuration
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_S3 = process.argv.includes("--skip-s3");
const SKIP_DB = process.argv.includes("--skip-db");

/**
 * Create readline interface for user confirmation
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask user for confirmation
 */
function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const errors = [];

  if (!SKIP_S3 && !process.env.S3_BUCKET) {
    errors.push("S3_BUCKET environment variable is required for S3 cleanup");
  }

  if (!SKIP_DB && !process.env.DYNAMODB_TABLE) {
    errors.push(
      "DYNAMODB_TABLE environment variable is required for DynamoDB cleanup"
    );
  }

  if (errors.length > 0) {
    console.error("❌ Environment validation failed:");
    errors.forEach((error) => console.error(`   - ${error}`));
    console.error(
      "\nSet the required environment variables or use --skip-s3 or --skip-db flags."
    );
    return false;
  }

  return true;
}

/**
 * Run S3 cleanup with error handling
 */
async function runS3Cleanup() {
  console.log("🪣 Starting S3 thumbnail cleanup...");
  console.log("=".repeat(60));

  try {
    await cleanupS3Thumbnails();
    console.log("✅ S3 cleanup completed successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ S3 cleanup failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run DynamoDB cleanup with error handling
 */
async function runDynamoDBCleanup() {
  console.log("📋 Starting DynamoDB thumbnail cleanup...");
  console.log("=".repeat(60));

  try {
    await cleanupDynamoDBThumbnails();
    console.log("✅ DynamoDB cleanup completed successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ DynamoDB cleanup failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Display cleanup plan
 */
function displayCleanupPlan() {
  console.log("📋 Cleanup Plan:");
  console.log(`   S3 Cleanup: ${SKIP_S3 ? "❌ SKIPPED" : "✅ ENABLED"}`);
  console.log(`   DynamoDB Cleanup: ${SKIP_DB ? "❌ SKIPPED" : "✅ ENABLED"}`);
  console.log(`   Dry Run: ${DRY_RUN ? "✅ YES" : "❌ NO"}`);

  if (!SKIP_S3) {
    console.log("\n🪣 S3 Operations:");
    console.log("   - Delete objects in /thumbnails/ directories");
    console.log("   - Delete objects with _thumb_small suffix");
    console.log("   - Delete objects with _thumb_medium suffix");
    console.log("   - Delete objects with _thumb_large suffix");
  }

  if (!SKIP_DB) {
    console.log("\n📋 DynamoDB Operations:");
    console.log("   - Remove thumbnailUrl fields from Media entities");
    console.log("   - Remove thumbnailUrls fields from Media entities");
    console.log("   - Reset status to 'uploaded'");
    console.log("   - Update updatedAt timestamp");
  }
}

/**
 * Handle rollback scenarios
 */
async function handleRollback(s3Result, dbResult) {
  console.log("\n🔄 Rollback Analysis:");

  if (s3Result.success && !dbResult.success) {
    console.log("⚠️  S3 cleanup succeeded but DynamoDB cleanup failed.");
    console.log(
      "   S3 thumbnails have been deleted but database still has references."
    );
    console.log(
      "   This is not critical - the references will just point to non-existent files."
    );
    console.log(
      "   You can re-run DynamoDB cleanup later with: npm run cleanup:thumbnails:db"
    );
  } else if (!s3Result.success && dbResult.success) {
    console.log("⚠️  DynamoDB cleanup succeeded but S3 cleanup failed.");
    console.log(
      "   Database references have been removed but S3 files still exist."
    );
    console.log(
      "   This wastes storage space but doesn't break functionality."
    );
    console.log(
      "   You can re-run S3 cleanup later with: npm run cleanup:thumbnails:s3"
    );
  } else if (!s3Result.success && !dbResult.success) {
    console.log("❌ Both S3 and DynamoDB cleanup failed.");
    console.log("   No changes have been made to your system.");
    console.log("   Check the error messages above and try again.");
  }
}

/**
 * Main cleanup orchestrator
 */
async function cleanupAllThumbnails() {
  console.log("🚀 Complete Thumbnail Cleanup Script");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌍 AWS Region: ${process.env.AWS_REGION || "us-east-1"}`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET || "Not set"}`);
  console.log(`📋 DynamoDB Table: ${process.env.DYNAMODB_TABLE || "Not set"}`);
  console.log();

  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }

  // Check if anything to do
  if (SKIP_S3 && SKIP_DB) {
    console.error(
      "❌ Both S3 and DynamoDB cleanup are skipped. Nothing to do."
    );
    console.error(
      "   Remove --skip-s3 and --skip-db flags to enable cleanup operations."
    );
    process.exit(1);
  }

  // Display plan
  displayCleanupPlan();

  // Ask for confirmation unless dry run
  if (!DRY_RUN) {
    console.log("\n⚠️  WARNING: This will permanently delete thumbnail data!");
    console.log("   - S3 thumbnail files will be deleted");
    console.log("   - DynamoDB thumbnail references will be removed");
    console.log("   This action cannot be undone.");

    const confirmed = await askConfirmation(
      "Are you sure you want to proceed with the complete cleanup?"
    );
    if (!confirmed) {
      console.log("❌ Operation cancelled by user");
      return;
    }
  }

  console.log("\n🚀 Starting complete thumbnail cleanup...");
  const startTime = new Date();

  const results = {
    s3: { success: false, error: null },
    db: { success: false, error: null },
  };

  // Execute S3 cleanup
  if (!SKIP_S3) {
    console.log("\n" + "=".repeat(80));
    results.s3 = await runS3Cleanup();

    if (!results.s3.success && !DRY_RUN) {
      console.log(
        "\n❌ S3 cleanup failed. Stopping here to prevent inconsistent state."
      );
      console.log(
        "   Fix S3 issues and try again, or use --skip-s3 to continue with DynamoDB only."
      );
      process.exit(1);
    }
  } else {
    results.s3.success = true; // Consider skipped as success
  }

  // Execute DynamoDB cleanup
  if (!SKIP_DB) {
    console.log("\n" + "=".repeat(80));
    results.db = await runDynamoDBCleanup();
  } else {
    results.db.success = true; // Consider skipped as success
  }

  // Calculate duration
  const endTime = new Date();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Final results
  console.log("\n" + "=".repeat(80));
  console.log("📊 Complete Cleanup Results:");
  console.log(`   Duration: ${duration} seconds`);
  console.log(
    `   S3 Cleanup: ${
      SKIP_S3 ? "SKIPPED" : results.s3.success ? "✅ SUCCESS" : "❌ FAILED"
    }`
  );
  console.log(
    `   DynamoDB Cleanup: ${
      SKIP_DB ? "SKIPPED" : results.db.success ? "✅ SUCCESS" : "❌ FAILED"
    }`
  );

  // Handle rollback scenarios
  if (!results.s3.success || !results.db.success) {
    await handleRollback(results.s3, results.db);
  }

  if (DRY_RUN) {
    console.log("\n🧪 This was a dry run. No actual changes were made.");
    console.log("   Run without --dry-run flag to perform actual cleanup.");
  } else if (results.s3.success && results.db.success) {
    console.log("\n🎉 Complete thumbnail cleanup finished successfully!");
    console.log(
      "   All old thumbnail data has been removed from both S3 and DynamoDB."
    );
    console.log("   You can now implement the new 5-size thumbnail system.");
  } else {
    console.log("\n⚠️  Cleanup completed with errors. See details above.");
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupAllThumbnails().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { cleanupAllThumbnails };
