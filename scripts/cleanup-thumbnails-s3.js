#!/usr/bin/env node

const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const readline = require("readline");

// Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET;
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 1000; // S3 delete batch limit

// Validate environment
if (!S3_BUCKET) {
  console.error("❌ Error: S3_BUCKET environment variable is required");
  console.error("   Set it with: export S3_BUCKET=your-bucket-name");
  process.exit(1);
}

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

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
 * List all thumbnail objects in S3 bucket
 */
async function listThumbnailObjects() {
  console.log("🔍 Scanning S3 bucket for thumbnail objects...");

  const thumbnailObjects = [];
  let continuationToken;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: "",
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        // Filter for thumbnail objects
        const thumbnails = response.Contents.filter((obj) => {
          const key = obj.Key;
          return (
            key.includes("/thumbnails/") ||
            key.includes("_thumb_small") ||
            key.includes("_thumb_medium") ||
            key.includes("_thumb_large")
          );
        });

        thumbnailObjects.push(...thumbnails);

        if (thumbnails.length > 0) {
          console.log(`   Found ${thumbnails.length} thumbnails in this batch`);
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(`📊 Total thumbnail objects found: ${thumbnailObjects.length}`);
    return thumbnailObjects;
  } catch (error) {
    console.error("❌ Error listing S3 objects:", error);
    throw error;
  }
}

/**
 * Delete objects in batches
 */
async function deleteThumbnailObjects(objects) {
  if (objects.length === 0) {
    console.log("✅ No thumbnail objects to delete");
    return { deleted: 0, errors: 0 };
  }

  console.log(`🗑️  Deleting ${objects.length} thumbnail objects...`);

  const results = {
    deleted: 0,
    errors: 0,
    errorDetails: [],
  };

  // Process in batches
  for (let i = 0; i < objects.length; i += BATCH_SIZE) {
    const batch = objects.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(objects.length / BATCH_SIZE);

    console.log(
      `   Processing batch ${batchNumber}/${totalBatches} (${batch.length} objects)`
    );

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would delete ${batch.length} objects:`);
      batch.forEach((obj) => console.log(`     - ${obj.Key}`));
      results.deleted += batch.length;
      continue;
    }

    try {
      const deleteParams = {
        Bucket: S3_BUCKET,
        Delete: {
          Objects: batch.map((obj) => ({ Key: obj.Key })),
          Quiet: true,
        },
      };

      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      const deleteResponse = await s3Client.send(deleteCommand);

      const deletedCount = batch.length - (deleteResponse.Errors?.length || 0);
      results.deleted += deletedCount;

      if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
        results.errors += deleteResponse.Errors.length;
        results.errorDetails.push(...deleteResponse.Errors);
        console.log(
          `   ⚠️  ${deleteResponse.Errors.length} errors in this batch`
        );
      } else {
        console.log(`   ✅ Successfully deleted ${deletedCount} objects`);
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < objects.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`   ❌ Error deleting batch ${batchNumber}:`, error);
      results.errors += batch.length;
      results.errorDetails.push({
        code: "BatchError",
        message: error.message,
        keys: batch.map((obj) => obj.Key),
      });
    }
  }

  return results;
}

/**
 * Display summary of thumbnail objects by pattern
 */
function displaySummary(objects) {
  const summary = {
    thumbnailDir: 0,
    thumbSmall: 0,
    thumbMedium: 0,
    thumbLarge: 0,
    totalSize: 0,
  };

  objects.forEach((obj) => {
    const key = obj.Key;
    const size = obj.Size || 0;
    summary.totalSize += size;

    if (key.includes("/thumbnails/")) summary.thumbnailDir++;
    if (key.includes("_thumb_small")) summary.thumbSmall++;
    if (key.includes("_thumb_medium")) summary.thumbMedium++;
    if (key.includes("_thumb_large")) summary.thumbLarge++;
  });

  console.log("\n📋 Thumbnail Objects Summary:");
  console.log(
    `   Objects in /thumbnails/ directories: ${summary.thumbnailDir}`
  );
  console.log(`   Objects with _thumb_small suffix: ${summary.thumbSmall}`);
  console.log(`   Objects with _thumb_medium suffix: ${summary.thumbMedium}`);
  console.log(`   Objects with _thumb_large suffix: ${summary.thumbLarge}`);
  console.log(
    `   Total size: ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`   Total objects: ${objects.length}`);
}

/**
 * Main cleanup function
 */
async function cleanupS3Thumbnails() {
  console.log("🚀 S3 Thumbnail Cleanup Script");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🪣 S3 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 AWS Region: ${AWS_REGION}`);
  console.log(`🧪 Dry Run: ${DRY_RUN ? "YES" : "NO"}`);
  console.log();

  try {
    // List all thumbnail objects
    const thumbnailObjects = await listThumbnailObjects();

    if (thumbnailObjects.length === 0) {
      console.log("✅ No thumbnail objects found. Nothing to clean up.");
      return;
    }

    // Display summary
    displaySummary(thumbnailObjects);

    // Ask for confirmation unless dry run
    if (!DRY_RUN) {
      console.log(
        "\n⚠️  WARNING: This will permanently delete all thumbnail objects!"
      );
      console.log("   This action cannot be undone.");

      const confirmed = await askConfirmation(
        "Are you sure you want to proceed?"
      );
      if (!confirmed) {
        console.log("❌ Operation cancelled by user");
        return;
      }
    }

    // Delete thumbnail objects
    console.log();
    const results = await deleteThumbnailObjects(thumbnailObjects);

    // Display results
    console.log("\n📊 Cleanup Results:");
    console.log(`   Objects processed: ${thumbnailObjects.length}`);
    console.log(`   Successfully deleted: ${results.deleted}`);
    console.log(`   Errors: ${results.errors}`);

    if (results.errors > 0) {
      console.log("\n❌ Deletion Errors:");
      results.errorDetails.forEach((error, index) => {
        console.log(
          `   ${index + 1}. ${error.code || "Error"}: ${
            error.message || "Unknown error"
          }`
        );
        if (error.key) console.log(`      Key: ${error.key}`);
        if (error.keys) console.log(`      Keys: ${error.keys.length} objects`);
      });
    }

    if (DRY_RUN) {
      console.log("\n🧪 This was a dry run. No objects were actually deleted.");
      console.log("   Run without --dry-run flag to perform actual deletion.");
    } else if (results.errors === 0) {
      console.log("\n✅ S3 thumbnail cleanup completed successfully!");
    } else {
      console.log("\n⚠️  S3 thumbnail cleanup completed with errors.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Fatal error during S3 cleanup:", error);
    process.exit(1);
  }
}

// Script usage information
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("S3 Thumbnail Cleanup Script");
  console.log("");
  console.log("Usage: node cleanup-thumbnails-s3.js [options]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --dry-run    Preview what would be deleted without actually deleting"
  );
  console.log("  --help, -h   Show this help message");
  console.log("");
  console.log("Environment Variables:");
  console.log("  S3_BUCKET    S3 bucket name (required)");
  console.log("  AWS_REGION   AWS region (default: us-east-1)");
  console.log("");
  console.log("Examples:");
  console.log("  node cleanup-thumbnails-s3.js --dry-run");
  console.log("  S3_BUCKET=my-bucket node cleanup-thumbnails-s3.js");
  process.exit(0);
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupS3Thumbnails().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { cleanupS3Thumbnails };
