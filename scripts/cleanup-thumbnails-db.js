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
 * Scan all Album entities from DynamoDB
 */
async function scanAllAlbumEntities() {
  console.log("🔍 Scanning DynamoDB for Album entities...");

  const albumEntities = [];
  let lastEvaluatedKey;
  let scannedCount = 0;

  try {
    do {
      const params = {
        TableName: DYNAMODB_TABLE,
        FilterExpression: "EntityType = :entityType",
        ExpressionAttributeValues: {
          ":entityType": "Album",
        },
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await docClient.send(new ScanCommand(params));

      if (result.Items) {
        const batchAlbums = result.Items.filter(
          (item) =>
            item.PK && item.PK.startsWith("ALBUM#") && item.SK === "METADATA"
        );

        albumEntities.push(...batchAlbums);
        scannedCount += result.Items.length;

        if (batchAlbums.length > 0) {
          console.log(
            `   Found ${batchAlbums.length} album entities in this batch (${scannedCount} total scanned)`
          );
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`📊 Total Album entities found: ${albumEntities.length}`);
    return albumEntities;
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
 * Analyze album entities for thumbnail data
 */
function analyzeAlbumEntities(entities) {
  const analysis = {
    total: entities.length,
    withThumbnailUrls: 0,
    withoutThumbnails: 0,
    thumbnailSizeCounts: {},
  };

  entities.forEach((entity) => {
    const hasThumbnailUrls =
      entity.thumbnailUrls !== undefined && entity.thumbnailUrls !== null;

    if (hasThumbnailUrls) {
      analysis.withThumbnailUrls++;

      // Count available thumbnail sizes
      if (typeof entity.thumbnailUrls === "object") {
        Object.keys(entity.thumbnailUrls).forEach((size) => {
          if (entity.thumbnailUrls[size]) {
            analysis.thumbnailSizeCounts[size] =
              (analysis.thumbnailSizeCounts[size] || 0) + 1;
          }
        });
      }
    } else {
      analysis.withoutThumbnails++;
    }
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
 * Update a single album entity to remove thumbnail fields
 */
async function updateAlbumEntity(entity) {
  const albumId = entity.id || entity.PK.replace("ALBUM#", "");

  try {
    const updateParams = {
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: `ALBUM#${albumId}`,
        SK: "METADATA",
      },
      UpdateExpression: "REMOVE thumbnailUrls SET updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
      },
    };

    if (!DRY_RUN) {
      await docClient.send(new UpdateCommand(updateParams));
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating album ${albumId}:`, error);
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
 * Process album entities in batches
 */
async function processAlbumEntities(entities) {
  if (entities.length === 0) {
    console.log("✅ No album entities to process");
    return { processed: 0, success: 0, errors: 0 };
  }

  // Filter entities that need updates (have thumbnail fields)
  const entitiesToUpdate = entities.filter(
    (entity) => entity.thumbnailUrls !== undefined
  );

  if (entitiesToUpdate.length === 0) {
    console.log("✅ No album entities have thumbnail fields to remove");
    return { processed: 0, success: 0, errors: 0 };
  }

  console.log(`🔄 Processing ${entitiesToUpdate.length} album entities...`);

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
        const albumId = entity.id || entity.PK.replace("ALBUM#", "");
        console.log(`     - Album ${albumId}`);
      });
      results.processed += batch.length;
      results.success += batch.length;
      continue;
    }

    // Process each entity in the batch
    const batchPromises = batch.map(async (entity) => {
      const result = await updateAlbumEntity(entity);
      results.processed++;

      if (result.success) {
        results.success++;
      } else {
        results.errors++;
        results.errorDetails.push({
          entityId: entity.id || entity.PK,
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
function displayAnalysis(mediaAnalysis, albumAnalysis) {
  console.log("\n📋 Media Entities Analysis:");
  console.log(`   Total entities: ${mediaAnalysis.total}`);
  console.log(`   With thumbnailUrl field: ${mediaAnalysis.withThumbnailUrl}`);
  console.log(
    `   With thumbnailUrls field: ${mediaAnalysis.withThumbnailUrls}`
  );
  console.log(`   With both fields: ${mediaAnalysis.withBothFields}`);
  console.log(
    `   Without thumbnail fields: ${mediaAnalysis.withoutThumbnails}`
  );

  console.log("\n📊 Media Status Distribution:");
  Object.entries(mediaAnalysis.statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  const mediaNeedsUpdate =
    mediaAnalysis.withThumbnailUrl +
    mediaAnalysis.withThumbnailUrls -
    mediaAnalysis.withBothFields;
  console.log(`\n🎯 Media entities needing update: ${mediaNeedsUpdate}`);

  console.log("\n📋 Album Entities Analysis:");
  console.log(`   Total entities: ${albumAnalysis.total}`);
  console.log(
    `   With thumbnailUrls field: ${albumAnalysis.withThumbnailUrls}`
  );
  console.log(
    `   Without thumbnail fields: ${albumAnalysis.withoutThumbnails}`
  );

  if (Object.keys(albumAnalysis.thumbnailSizeCounts).length > 0) {
    console.log("\n📊 Album Thumbnail Size Distribution:");
    Object.entries(albumAnalysis.thumbnailSizeCounts).forEach(
      ([size, count]) => {
        console.log(`   ${size}: ${count}`);
      }
    );
  }

  console.log(
    `\n🎯 Album entities needing update: ${albumAnalysis.withThumbnailUrls}`
  );

  const totalNeedsUpdate = mediaNeedsUpdate + albumAnalysis.withThumbnailUrls;
  console.log(`\n🎯 Total entities needing update: ${totalNeedsUpdate}`);
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
    // Scan all Media and Album entities
    const [mediaEntities, albumEntities] = await Promise.all([
      scanAllMediaEntities(),
      scanAllAlbumEntities(),
    ]);

    if (mediaEntities.length === 0 && albumEntities.length === 0) {
      console.log("✅ No Media or Album entities found. Nothing to clean up.");
      return;
    }

    // Analyze entities
    const mediaAnalysis = analyzeMediaEntities(mediaEntities);
    const albumAnalysis = analyzeAlbumEntities(albumEntities);
    displayAnalysis(mediaAnalysis, albumAnalysis);

    // Check if any updates are needed
    const mediaEntitiesNeedingUpdate = mediaEntities.filter(
      (entity) =>
        entity.thumbnailUrl !== undefined || entity.thumbnailUrls !== undefined
    );

    const albumEntitiesNeedingUpdate = albumEntities.filter(
      (entity) => entity.thumbnailUrls !== undefined
    );

    const totalEntitiesNeedingUpdate =
      mediaEntitiesNeedingUpdate.length + albumEntitiesNeedingUpdate.length;

    if (totalEntitiesNeedingUpdate === 0) {
      console.log("\n✅ No thumbnail fields found. Nothing to clean up.");
      return;
    }

    // Ask for confirmation unless dry run
    if (!DRY_RUN) {
      console.log(
        "\n⚠️  WARNING: This will remove thumbnail fields from Media and Album entities!"
      );
      console.log("   Media entities:");
      console.log("     - thumbnailUrl fields will be removed");
      console.log("     - thumbnailUrls fields will be removed");
      console.log("     - status will be reset to 'uploaded'");
      console.log("   Album entities:");
      console.log("     - thumbnailUrls fields will be removed");
      console.log("   - updatedAt will be set to current timestamp for all");
      console.log("   This action cannot be undone.");

      const confirmed = await askConfirmation(
        "Are you sure you want to proceed?"
      );
      if (!confirmed) {
        console.log("❌ Operation cancelled by user");
        return;
      }
    }

    // Process entities
    console.log();
    const [mediaResults, albumResults] = await Promise.all([
      processMediaEntities(mediaEntities),
      processAlbumEntities(albumEntities),
    ]);

    // Display results
    console.log("\n📊 Cleanup Results:");
    console.log("\n📱 Media Entities:");
    console.log(`   Processed: ${mediaResults.processed}`);
    console.log(`   Successfully updated: ${mediaResults.success}`);
    console.log(`   Errors: ${mediaResults.errors}`);

    console.log("\n📚 Album Entities:");
    console.log(`   Processed: ${albumResults.processed}`);
    console.log(`   Successfully updated: ${albumResults.success}`);
    console.log(`   Errors: ${albumResults.errors}`);

    console.log("\n🎯 Total:");
    console.log(
      `   Processed: ${mediaResults.processed + albumResults.processed}`
    );
    console.log(
      `   Successfully updated: ${mediaResults.success + albumResults.success}`
    );
    console.log(`   Errors: ${mediaResults.errors + albumResults.errors}`);

    const totalErrors = mediaResults.errors + albumResults.errors;
    if (totalErrors > 0) {
      console.log("\n❌ Update Errors:");

      if (mediaResults.errors > 0) {
        console.log("   Media entities:");
        mediaResults.errorDetails.forEach((error, index) => {
          console.log(
            `     ${index + 1}. Entity ${error.entityId}: ${error.error}`
          );
        });
      }

      if (albumResults.errors > 0) {
        console.log("   Album entities:");
        albumResults.errorDetails.forEach((error, index) => {
          console.log(
            `     ${index + 1}. Entity ${error.entityId}: ${error.error}`
          );
        });
      }
    }

    if (DRY_RUN) {
      console.log(
        "\n🧪 This was a dry run. No entities were actually updated."
      );
      console.log("   Run without --dry-run flag to perform actual updates.");
    } else if (totalErrors === 0) {
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
  console.log(
    "Removes thumbnail fields from both Media and Album entities in DynamoDB."
  );
  console.log("This script will clean up legacy thumbnail data to prepare for");
  console.log("the new thumbnail generation system.");
  console.log("");
  console.log("Usage: node cleanup-thumbnails-db.js [options]");
  console.log("");
  console.log("What this script does:");
  console.log(
    "  • Scans for Media entities and removes thumbnailUrl and thumbnailUrls fields"
  );
  console.log("  • Scans for Album entities and removes thumbnailUrls fields");
  console.log("  • Resets Media status to 'uploaded'");
  console.log("  • Updates the updatedAt timestamp for all modified entities");
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
