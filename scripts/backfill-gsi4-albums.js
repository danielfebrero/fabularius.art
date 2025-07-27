/**
 * backfill-gsi4-albums.js
 *
 * Migration script to add GSI4 fields to existing album records.
 *
 * This script adds the required GSI4PK and GSI4SK fields to existing albums
 * to support efficient querying of albums by creator.
 *
 * GSI4PK = "ALBUM_BY_CREATOR"
 * GSI4SK = "<createdBy>#<createdAt>#<albumId>"
 *
 * Usage:
 *   node backfill-gsi4-albums.js --env=local [--dry-run]
 *   node backfill-gsi4-albums.js --env=prod [--dry-run]
 *
 * Options:
 *   --env=<environment>    Load environment variables from .env.<environment>
 *   --dry-run             Show what would be updated without making changes
 *
 * ENV variables required:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - DYNAMODB_TABLE (name of the table)
 * - LOCAL_AWS_ENDPOINT (for local development)
 */

// CommonJS requires
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Global error handlers for debugging
process.on("unhandledRejection", (reason) => {
  console.error(
    "UNHANDLED REJECTION:",
    reason,
    typeof reason === "object" ? JSON.stringify(reason, null, 2) : ""
  );
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");
const envArg = process.argv.find((arg) => arg.startsWith("--env="));
let envFile = ".env";

if (envArg) {
  const envValue = envArg.split("=")[1];
  if (envValue && envValue.length > 0) {
    if (envValue.startsWith(".env")) {
      envFile = envValue;
    } else if (/^[\w.-]+$/.test(envValue)) {
      envFile = `.env.${envValue}`;
    } else {
      envFile = envValue;
    }
  }
}

// Resolve env file relative to current script directory
const envPath = path.resolve(__dirname, envFile);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment variables from ${envPath}`);
} else {
  // fallback: try .env in script directory
  const fallbackPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(fallbackPath)) {
    dotenv.config({ path: fallbackPath });
    console.log(
      `Could not find ${envPath}, loaded default .env from script directory`
    );
  } else {
    console.warn(
      `Warning: Could not find env file: ${envPath} or .env. Proceeding with process.env as-is.`
    );
  }
}

// AWS SDK (v3)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Check for required environment variables
const TABLE_NAME = process.env["DYNAMODB_TABLE"];
if (!TABLE_NAME) {
  console.error("Error: DYNAMODB_TABLE environment variable is not set.");
  process.exit(1);
}

// Determine if we're running locally based on LOCAL_AWS_ENDPOINT
const isLocal = !!process.env["LOCAL_AWS_ENDPOINT"];
const clientConfig = {};

if (isLocal) {
  clientConfig.endpoint = process.env["LOCAL_AWS_ENDPOINT"];
  clientConfig.region = process.env["AWS_REGION"] || "us-east-1";
  clientConfig.credentials = {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] || "test",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] || "test",
  };
} else {
  clientConfig.region = process.env["AWS_REGION"] || "us-east-1";
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

async function main() {
  console.log("🚀 Starting GSI4 backfill for albums...");
  console.log(`📋 Table: ${TABLE_NAME}`);
  console.log(`🌍 Environment: ${isLocal ? "Local" : "AWS"}`);
  console.log(`🔍 Mode: ${isDryRun ? "DRY RUN" : "LIVE UPDATE"}`);
  console.log("");

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let lastEvaluatedKey = undefined;

  do {
    try {
      // Scan for album records
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "begins_with(PK, :albumPrefix) AND SK = :metadata",
          ExpressionAttributeValues: {
            ":albumPrefix": "ALBUM#",
            ":metadata": "METADATA",
          },
          ExclusiveStartKey: lastEvaluatedKey,
          Limit: 25, // Process in small batches
        })
      );

      const albums = scanResult.Items || [];

      for (const album of albums) {
        try {
          // Check if GSI4 fields already exist
          if (album.GSI4PK && album.GSI4SK) {
            console.log(`⏭️  Skipping ${album.id} - GSI4 fields already exist`);
            skippedCount++;
            continue;
          }

          // Check if album has createdBy field
          if (!album.createdBy) {
            console.log(`⚠️  Skipping ${album.id} - missing createdBy field`);
            skippedCount++;
            continue;
          }

          const gsi4PK = "ALBUM_BY_CREATOR";
          const gsi4SK = `${album.createdBy}#${album.createdAt}#${album.id}`;

          console.log(`📝 Processing album: ${album.id}`);
          console.log(`   GSI4PK: ${gsi4PK}`);
          console.log(`   GSI4SK: ${gsi4SK}`);

          if (!isDryRun) {
            // Update the record with GSI4 fields
            await docClient.send(
              new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                  PK: album.PK,
                  SK: album.SK,
                },
                UpdateExpression: "SET GSI4PK = :gsi4pk, GSI4SK = :gsi4sk",
                ExpressionAttributeValues: {
                  ":gsi4pk": gsi4PK,
                  ":gsi4sk": gsi4SK,
                },
                ConditionExpression: "attribute_exists(PK)", // Ensure record still exists
              })
            );
          }

          updatedCount++;
          console.log(
            `✅ ${isDryRun ? "Would update" : "Updated"} album: ${album.id}`
          );
        } catch (error) {
          console.error(`❌ Error processing album ${album.id}:`, error);
          errorCount++;
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey;

      if (lastEvaluatedKey) {
        console.log(`📄 Processed batch, continuing...`);
      }
    } catch (error) {
      console.error("❌ Error during scan:", error);
      break;
    }
  } while (lastEvaluatedKey);

  console.log("");
  console.log("🏁 Migration completed!");
  console.log(
    `✅ ${isDryRun ? "Would update" : "Updated"}: ${updatedCount} albums`
  );
  console.log(`⏭️  Skipped: ${skippedCount} albums`);
  console.log(`❌ Errors: ${errorCount} albums`);

  if (isDryRun) {
    console.log("");
    console.log("🔄 Run without --dry-run to apply changes");
  }
}

// Run the migration
main().catch((error) => {
  console.error("💥 Migration failed:", error);
  process.exit(1);
});
