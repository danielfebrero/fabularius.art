#!/usr/bin/env node

/**
 * Delete All Comments Script for pornspot.ai
 * 
 * This script deletes ALL comments from the production database.
 * WARNING: This is a destructive operation that cannot be undone.
 * 
 * Usage:
 *   node scripts/delete-all-comments.js --env=prod --dry-run
 *   node scripts/delete-all-comments.js --env=prod --confirm
 * 
 * Environment Options:
 *   --env=local     Delete from local database
 *   --env=dev       Delete from dev environment
 *   --env=staging   Delete from staging environment  
 *   --env=prod      Delete from production database
 * 
 * Options:
 *   --dry-run       Preview what would be deleted without actually deleting
 *   --confirm       Actually perform the deletion (required for real deletion)
 *   --help, -h      Show this help message
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const readline = require("readline");

// Configuration
let AWS_REGION = process.env.AWS_REGION || "us-east-1";
let ENVIRONMENT = "local";
let DRY_RUN = false;
let CONFIRM = false;
const BATCH_SIZE = 25; // DynamoDB batch write limit

// Parse command line arguments
const args = process.argv.slice(2);
for (const arg of args) {
  if (arg.startsWith("--env=")) {
    ENVIRONMENT = arg.split("=")[1];
  } else if (arg === "--dry-run") {
    DRY_RUN = true;
  } else if (arg === "--confirm") {
    CONFIRM = true;
  } else if (arg === "--help" || arg === "-h") {
    showHelp();
    process.exit(0);
  }
}

// Validate environment
if (!["local", "dev", "staging", "prod"].includes(ENVIRONMENT)) {
  console.error("❌ Error: Invalid environment. Must be: local, dev, staging, or prod");
  process.exit(1);
}

// For non-dry-run, require explicit confirmation
if (!DRY_RUN && !CONFIRM) {
  console.error("❌ Error: Must specify either --dry-run or --confirm");
  console.error("   Use --dry-run to preview changes");
  console.error("   Use --confirm to actually delete comments");
  process.exit(1);
}

// Environment-specific configurations
const getClientConfig = (environment) => {
  if (environment === "local") {
    return {
      endpoint: "http://localhost:4566",
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    };
  }

  // For staging/prod, use default AWS credentials from environment/profile
  return {
    region: AWS_REGION,
  };
};

const getTableName = (environment) => {
  return `${environment}-pornspot-media`;
};

// Initialize clients
const clientConfig = getClientConfig(ENVIRONMENT);
const TABLE_NAME = getTableName(ENVIRONMENT);
const ddbClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Show help message
 */
function showHelp() {
  console.log("Delete All Comments Script");
  console.log("");
  console.log("Deletes ALL comments from the specified environment database.");
  console.log("This is a destructive operation that cannot be undone.");
  console.log("");
  console.log("Usage: node scripts/delete-all-comments.js [options]");
  console.log("");
  console.log("Environment Options:");
  console.log("  --env=local     Delete from local database (LocalStack)");
  console.log("  --env=dev       Delete from dev environment");
  console.log("  --env=staging   Delete from staging environment");
  console.log("  --env=prod      Delete from production database");
  console.log("");
  console.log("Safety Options:");
  console.log("  --dry-run       Preview what would be deleted without actually deleting");
  console.log("  --confirm       Actually perform the deletion (required for real deletion)");
  console.log("  --help, -h      Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  node scripts/delete-all-comments.js --env=prod --dry-run");
  console.log("  node scripts/delete-all-comments.js --env=prod --confirm");
  console.log("");
  console.log("What this script does:");
  console.log("  • Scans all COMMENT# entities in DynamoDB");
  console.log("  • Deletes all comment likes and interactions");
  console.log("  • Deletes all comment records");
  console.log("  • Updates comment counts on target albums/media");
  console.log("  • Provides detailed progress reporting");
}

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
 * Scan all comment entities from DynamoDB
 */
async function scanAllComments() {
  console.log("🔍 Scanning DynamoDB for comment entities...");
  
  const allComments = [];
  let lastEvaluatedKey = undefined;
  let totalScanned = 0;

  do {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk_prefix)",
      ExpressionAttributeValues: {
        ":pk_prefix": "COMMENT#",
      },
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const result = await docClient.send(new ScanCommand(params));
    
    if (result.Items && result.Items.length > 0) {
      allComments.push(...result.Items);
      totalScanned += result.Items.length;
      console.log(`   Found ${result.Items.length} comments in this batch (${totalScanned} total scanned)`);
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total comment entities found: ${allComments.length}`);
  return allComments;
}

/**
 * Scan all comment interactions (likes) from DynamoDB
 */
async function scanAllCommentInteractions() {
  console.log("🔍 Scanning DynamoDB for comment interaction entities...");
  
  const allInteractions = [];
  let lastEvaluatedKey = undefined;
  let totalScanned = 0;

  do {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :sk_prefix)",
      ExpressionAttributeValues: {
        ":sk_prefix": "COMMENT_INTERACTION#",
      },
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const result = await docClient.send(new ScanCommand(params));
    
    if (result.Items && result.Items.length > 0) {
      allInteractions.push(...result.Items);
      totalScanned += result.Items.length;
      console.log(`   Found ${result.Items.length} comment interactions in this batch (${totalScanned} total scanned)`);
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📊 Total comment interaction entities found: ${allInteractions.length}`);
  return allInteractions;
}

/**
 * Analyze comment entities
 */
function analyzeComments(comments) {
  const analysis = {
    total: comments.length,
    byTargetType: {
      album: 0,
      media: 0,
    },
    targetIds: new Set(),
  };

  comments.forEach((comment) => {
    if (comment.targetType === "album") {
      analysis.byTargetType.album++;
    } else if (comment.targetType === "media") {
      analysis.byTargetType.media++;
    }
    
    if (comment.targetId) {
      analysis.targetIds.add(comment.targetId);
    }
  });

  return analysis;
}

/**
 * Display analysis summary
 */
function displayAnalysis(commentAnalysis, interactionAnalysis) {
  console.log("\n📋 Comment Analysis:");
  console.log(`   Total comments: ${commentAnalysis.total}`);
  console.log(`   Album comments: ${commentAnalysis.byTargetType.album}`);
  console.log(`   Media comments: ${commentAnalysis.byTargetType.media}`);
  console.log(`   Unique targets affected: ${commentAnalysis.targetIds.size}`);

  console.log("\n📋 Comment Interaction Analysis:");
  console.log(`   Total comment interactions: ${interactionAnalysis.total}`);

  const totalToDelete = commentAnalysis.total + interactionAnalysis.total;
  console.log(`\n🎯 Total entities to delete: ${totalToDelete}`);
}

/**
 * Delete entities in batches
 */
async function deleteEntitiesInBatches(entities, entityType) {
  if (entities.length === 0) {
    console.log(`✅ No ${entityType} entities to delete`);
    return { processed: 0, success: 0, errors: 0 };
  }

  console.log(`🔄 Deleting ${entities.length} ${entityType} entities...`);

  const results = {
    processed: 0,
    success: 0,
    errors: 0,
    errorDetails: [],
  };

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entities.length / BATCH_SIZE);

    console.log(`   Deleting batch ${batchNumber}/${totalBatches} (${batch.length} entities)`);

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would delete ${batch.length} ${entityType} entities`);
      results.processed += batch.length;
      results.success += batch.length;
      continue;
    }

    try {
      const deleteRequests = batch.map((entity) => ({
        DeleteRequest: {
          Key: {
            PK: entity.PK,
            SK: entity.SK,
          },
        },
      }));

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: deleteRequests,
          },
        })
      );

      results.processed += batch.length;
      results.success += batch.length;
      console.log(`   ✅ Completed batch ${batchNumber}: ${batch.length} entities deleted`);
    } catch (error) {
      console.error(`   ❌ Error in batch ${batchNumber}:`, error.message);
      results.processed += batch.length;
      results.errors += batch.length;
      results.errorDetails.push({
        batchNumber,
        error: error.message,
      });
    }

    // Small delay between batches to avoid overwhelming DynamoDB
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Update comment counts on target entities
 */
async function updateTargetCommentCounts(targetIds) {
  if (targetIds.size === 0 || DRY_RUN) {
    if (DRY_RUN) {
      console.log(`🔄 [DRY RUN] Would reset comment counts for ${targetIds.size} targets`);
    }
    return;
  }

  console.log(`🔄 Resetting comment counts for ${targetIds.size} target entities...`);
  
  let updated = 0;
  let errors = 0;

  for (const targetId of targetIds) {
    try {
      // Try to update as album first
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: [
              {
                PutRequest: {
                  Item: {
                    PK: `ALBUM#${targetId}`,
                    SK: "METADATA",
                    commentCount: 0,
                    updatedAt: new Date().toISOString(),
                  },
                },
              },
            ],
          },
        })
      );
      
      // Try to update as media second
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: [
              {
                PutRequest: {
                  Item: {
                    PK: `MEDIA#${targetId}`,
                    SK: "METADATA", 
                    commentCount: 0,
                    updatedAt: new Date().toISOString(),
                  },
                },
              },
            ],
          },
        })
      );

      updated++;
    } catch (error) {
      console.warn(`⚠️  Could not update comment count for ${targetId}: ${error.message}`);
      errors++;
    }
  }

  console.log(`✅ Updated comment counts: ${updated} succeeded, ${errors} failed`);
}

/**
 * Main deletion function
 */
async function deleteAllComments() {
  console.log("🚀 Delete All Comments Script");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📋 DynamoDB Table: ${TABLE_NAME}`);
  console.log(`🌍 AWS Region: ${AWS_REGION}`);
  console.log(`🏷️  Environment: ${ENVIRONMENT}`);
  console.log(`🧪 Dry Run: ${DRY_RUN ? "YES" : "NO"}`);
  console.log();

  try {
    // Scan all comments and interactions
    const [comments, interactions] = await Promise.all([
      scanAllComments(),
      scanAllCommentInteractions(),
    ]);

    if (comments.length === 0 && interactions.length === 0) {
      console.log("✅ No comments or interactions found. Nothing to delete.");
      return;
    }

    // Analyze the data
    const commentAnalysis = analyzeComments(comments);
    const interactionAnalysis = { total: interactions.length };
    displayAnalysis(commentAnalysis, interactionAnalysis);

    // Ask for confirmation unless dry run
    if (!DRY_RUN) {
      console.log("\n⚠️  WARNING: This will permanently delete ALL comments and interactions!");
      console.log("   This action cannot be undone.");
      console.log(`   Environment: ${ENVIRONMENT.toUpperCase()}`);
      console.log(`   Comments to delete: ${comments.length}`);
      console.log(`   Interactions to delete: ${interactions.length}`);
      
      if (ENVIRONMENT === "prod") {
        console.log("\n🚨 PRODUCTION ENVIRONMENT DELETION 🚨");
        console.log("   This will delete ALL comments from the production database!");
      }

      const confirmed = await askConfirmation("\nAre you absolutely sure you want to proceed?");
      if (!confirmed) {
        console.log("❌ Operation cancelled by user");
        return;
      }

      // Extra confirmation for production
      if (ENVIRONMENT === "prod") {
        const prodConfirmed = await askConfirmation(
          "This is PRODUCTION. Type 'DELETE ALL COMMENTS' to confirm"
        );
        if (!prodConfirmed) {
          console.log("❌ Production deletion cancelled");
          return;
        }
      }
    }

    // Delete all entities
    console.log();
    const [commentResults, interactionResults] = await Promise.all([
      deleteEntitiesInBatches(comments, "comment"),
      deleteEntitiesInBatches(interactions, "comment interaction"),
    ]);

    // Update comment counts on affected targets
    if (!DRY_RUN) {
      await updateTargetCommentCounts(commentAnalysis.targetIds);
    }

    // Display results
    console.log("\n📊 Deletion Results:");
    
    console.log("\n💬 Comments:");
    console.log(`   Processed: ${commentResults.processed}`);
    console.log(`   Successfully deleted: ${commentResults.success}`);
    console.log(`   Errors: ${commentResults.errors}`);

    console.log("\n👍 Comment Interactions:");
    console.log(`   Processed: ${interactionResults.processed}`);
    console.log(`   Successfully deleted: ${interactionResults.success}`);
    console.log(`   Errors: ${interactionResults.errors}`);

    const totalDeleted = commentResults.success + interactionResults.success;
    const totalErrors = commentResults.errors + interactionResults.errors;

    console.log("\n🎯 Total:");
    console.log(`   Successfully deleted: ${totalDeleted}`);
    console.log(`   Errors: ${totalErrors}`);

    // Show error details if any
    if (totalErrors > 0) {
      console.log("\n❌ Deletion Errors:");
      
      if (commentResults.errors > 0) {
        console.log("   Comment deletion errors:");
        commentResults.errorDetails.forEach((error, index) => {
          console.log(`     ${index + 1}. Batch ${error.batchNumber}: ${error.error}`);
        });
      }

      if (interactionResults.errors > 0) {
        console.log("   Interaction deletion errors:");
        interactionResults.errorDetails.forEach((error, index) => {
          console.log(`     ${index + 1}. Batch ${error.batchNumber}: ${error.error}`);
        });
      }
    }

    if (DRY_RUN) {
      console.log("\n🧪 This was a dry run. No entities were actually deleted.");
      console.log("   Run with --confirm flag to perform actual deletion.");
    } else if (totalErrors === 0) {
      console.log("\n✅ All comments deleted successfully!");
    } else {
      console.log("\n⚠️  Comment deletion completed with errors.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Fatal error during comment deletion:", error);
    process.exit(1);
  }
}

// Run the deletion if this script is executed directly
if (require.main === module) {
  deleteAllComments().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = { deleteAllComments };
