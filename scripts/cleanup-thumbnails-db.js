#!/usr/bin/env node

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const readline = require("readline");

// Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 25; // DynamoDB batch write limit

// Validate environment
if (!DYNAMODB_TABLE) {
  console.error("❌ Error: DYNAMODB_TABLE environment variable is required");
  console.error("   Set it with: export DYNAMODB_TABLE=your-table-name");
  process.exit(1);
}

// Initialize DynamoDB clients
const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

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
 * Scan all Media entities from DynamoDB
 */
async function scanAllMediaEntities() {
  console.log("🔍 Scanning DynamoDB for Media entities...");

  const mediaEntities = [];
  let lastEvaluatedKey;
  let scannedCount = 0;

  try {
    do {
      const params = {
        TableName: DYNAMODB_TABLE,
        FilterExpression: "EntityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "Media",
        },
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await docClient.send(new ScanCommand(params));

      if (result.Items) {
        const batchMedia = result.Items.filter(
          (item) =>
            item.PK &&
            item.PK.startsWith("ALBUM#") &&
            item.SK &&
            item.SK.startsWith("MEDIA#")
        );

        mediaEntities.push(...batchMedia);
        scannedCount += result.Items.length;

        if (batchMedia.length > 0) {
          console.log(
            `   Found ${batchMedia.length} media entities in this batch (${scannedCount} total scanned)`
          );
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`📊 Total Media entities found: ${mediaEntities.length}`);
    return mediaEntities;
  } catch (error) {
    console.error("❌ Error scanning DynamoDB:", error);
    throw error;
  }
}

/**
 * Analyze media entities for thumbnail data
 */
function analyzeMediaEntities(entities) {
  const analysis = {
    total: entities.length,
    withThumbnailUrl: 0,
    withThumbnailUrls: 0,
    withBothFields: 0,
    withoutThumbnails: 0,
    statusCounts: {},
  };

  entities.forEach((entity) => {
    const hasThumbnailUrl =
      entity.thumbnailUrl !== undefined && entity.thumbnailUrl !== null;
    const hasThumbnailUrls =
      entity.thumbnailUrls !== undefined && entity.thumbnailUrls !== null;

    if (hasThumbnailUrl) analysis.withThumbnailUrl++;
    if (hasThumbnailUrls) analysis.withThumbnailUrls++;
    if (hasThumbnailUrl && hasThumbnailUrls) analysis.withBothFields++;
    if (!hasThumbnailUrl && !hasThumbnailUrls) analysis.withoutThumbnails++;

    // Count status distribution
    const status = entity.status || "unknown";
    analysis.statusCounts[status] = (analysis.statusCounts[status] || 0) + 1;
  });

  return analysis;
}

/**
 * Update a single media entity to remove thumbnail fields
 */
async function updateMediaEntity(entity) {
  const albumId = entity.albumId || entity.PK.replace("ALBUM#", "");
  const mediaId = entity.id || entity.SK.replace("MEDIA#", "");

  try {
    const updateParams = {
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: `ALBUM#${albumId}`,
        SK: `MEDIA#${mediaId}`,
      },
      UpdateExpression:
        "REMOVE thumbnailUrl, thumbnailUrls SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "uploaded",
        ":updatedAt": new Date().toISOString(),
      },
    };

    if (!DRY_RUN) {
      await docClient.send(new UpdateCommand(updateParams));
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating media ${mediaId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process media entities in batches
 */
async function processMediaEntities(entities) {
  if (entities.length === 0) {
    console.log("✅ No media entities to process");
    return { processed: 0, success: 0, errors: 0 };
  }

  // Filter entities that need updates (have thumbnail fields)
  const entitiesToUpdate = entities.filter(
    (entity) =>
      entity.thumbnailUrl !== undefined || entity.thumbnailUrls !== undefined
  );

  if (entitiesToUpdate.length === 0) {
    console.log("✅ No media entities have thumbnail fields to remove");
    return { processed: 0, success: 0, errors: 0 };
  }

  console.log(`🔄 Processing ${entitiesToUpdate.length} media entities...`);

  const results = {
    processed: 0,
    success: 0,
    errors: 0,
    errorDetails: [],
  };

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < entitiesToUpdate.length; i += BATCH_SIZE) {
    const batch = entitiesToUpdate.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entitiesToUpdate.length / BATCH_SIZE);

    console.log(
      `   Processing batch ${batchNumber}/${totalBatches} (${batch.length} entities)`
    );

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would update ${batch.length} entities:`);
      batch.forEach((entity) => {
        const albumId = entity.albumId || entity.PK.replace("ALBUM#", "");
        const mediaId = entity.id || entity.SK.replace("MEDIA#", "");
        console.log(`     - Media ${mediaId} in Album ${albumId}`);
      });
      results.processed += batch.length;
      results.success += batch.length;
      continue;
    }

    // Process each entity in the batch
    const batchPromises = batch.map(async (entity) => {
      const result = await updateMediaEntity(entity);
      results.processed++;

      if (result.success) {
        results.success++;
      } else {
        results.errors++;
        results.errorDetails.push({
          entityId: entity.id || entity.SK,
          error: result.error,
        });
      }

      return result;
    });

    await Promise.all(batchPromises);

    console.log(
      `   ✅ Completed batch ${batchNumber}: ${batch.length} entities processed`
    );

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < entitiesToUpdate.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

/**
 * Display analysis summary
 */
function displayAnalysis(analysis) {
  console.log("\n📋 Media Entities Analysis:");
  console.log(`   Total entities: ${analysis.total}`);
  console.log(`   With thumbnailUrl field: ${analysis.withThumbnailUrl}`);
  console.log(`   With thumbnailUrls field: ${analysis.withThumbnailUrls}`);
  console.log(`   With both fields: ${analysis.withBothFields}`);
  console.log(`   Without thumbnail fields: ${analysis.withoutThumbnails}`);

  console.log("\n📊 Status Distribution:");
  Object.entries(analysis.statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  const needsUpdate =
    analysis.withThumbnailUrl +
    analysis.withThumbnailUrls -
    analysis.withBothFields;
  console.log(`\n🎯 Entities needing update: ${needsUpdate}`);
}

/**
 * Main cleanup function
 */
async function cleanupDynamoDBThumbnails() {
  console.log("🚀 DynamoDB Thumbnail Cleanup Script");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📋 DynamoDB Table: ${DYNAMODB_TABLE}`);
  console.log(`🌍 AWS Region: ${AWS_REGION}`);
  console.log(`🧪 Dry Run: ${DRY_RUN ? "YES" : "NO"}`);
  console.log();

  try {
    // Scan all Media entities
    const mediaEntities = await scanAllMediaEntities();

    if (mediaEntities.length === 0) {
      console.log("✅ No Media entities found. Nothing to clean up.");
      return;
    }

    // Analyze entities
    const analysis = analyzeMediaEntities(mediaEntities);
    displayAnalysis(analysis);

    // Check if any updates are needed
    const entitiesNeedingUpdate = mediaEntities.filter(
      (entity) =>
        entity.thumbnailUrl !== undefined || entity.thumbnailUrls !== undefined
    );

    if (entitiesNeedingUpdate.length === 0) {
      console.log("\n✅ No thumbnail fields found. Nothing to clean up.");
      return;
    }

    // Ask for confirmation unless dry run
    if (!DRY_RUN) {
      console.log(
        "\n⚠️  WARNING: This will remove thumbnail fields from all Media entities!"
      );
      console.log("   - thumbnailUrl fields will be removed");
      console.log("   - thumbnailUrls fields will be removed");
      console.log("   - status will be reset to 'uploaded'");
      console.log("   - updatedAt will be set to current timestamp");
      console.log("   This action cannot be undone.");

      const confirmed = await askConfirmation(
        "Are you sure you want to proceed?"
      );
      if (!confirmed) {
        console.log("❌ Operation cancelled by user");
        return;
      }
    }

    // Process media entities
    console.log();
    const results = await processMediaEntities(mediaEntities);

    // Display results
    console.log("\n📊 Cleanup Results:");
    console.log(`   Entities processed: ${results.processed}`);
    console.log(`   Successfully updated: ${results.success}`);
    console.log(`   Errors: ${results.errors}`);

    if (results.errors > 0) {
      console.log("\n❌ Update Errors:");
      results.errorDetails.forEach((error, index) => {
        console.log(
          `   ${index + 1}. Entity ${error.entityId}: ${error.error}`
        );
      });
    }

    if (DRY_RUN) {
      console.log(
        "\n🧪 This was a dry run. No entities were actually updated."
      );
      console.log("   Run without --dry-run flag to perform actual updates.");
    } else if (results.errors === 0) {
      console.log("\n✅ DynamoDB thumbnail cleanup completed successfully!");
    } else {
      console.log("\n⚠️  DynamoDB thumbnail cleanup completed with errors.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Fatal error during DynamoDB cleanup:", error);
    process.exit(1);
  }
}

// Script usage information
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("DynamoDB Thumbnail Cleanup Script");
  console.log("");
  console.log("Usage: node cleanup-thumbnails-db.js [options]");
  console.log("");
  console.log("Options:");
  console.log(
    "  --dry-run    Preview what would be updated without actually updating"
  );
  console.log("  --help, -h   Show this help message");
  console.log("");
  console.log("Environment Variables:");
  console.log("  DYNAMODB_TABLE  DynamoDB table name (required)");
  console.log("  AWS_REGION      AWS region (default: us-east-1)");
  console.log("");
  console.log("Examples:");
  console.log("  node cleanup-thumbnails-db.js --dry-run");
  console.log("  DYNAMODB_TABLE=my-table node cleanup-thumbnails-db.js");
  process.exit(0);
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupDynamoDBThumbnails().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { cleanupDynamoDBThumbnails };
