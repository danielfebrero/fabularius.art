/**
 * backfill-isPublic.js
 *
 * Scans the DynamoDB 'Albums' table for items missing the 'isPublic' attribute,
 * and updates those items by setting 'isPublic: true'.
 *
 * Only items lacking 'isPublic' are updated for efficiency.
 * Prints a summary at the end (number of items updated and skipped).
 *
 * Usage:
 *   node backfill-isPublic.js --env=prod
 *
 * ENV variables required:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - DYNAMODB_TABLE (name of the Albums table)
 * You may also use a local AWS profile if configured.
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

// Parse --env=VALUE from process.argv
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

const TABLE_NAME = process.env["DYNAMODB_TABLE"];
if (!TABLE_NAME) {
  console.error("Error: DYNAMODB_TABLE environment variable is not set.");
  process.exit(1);
}

const REGION = process.env["AWS_REGION"] || "us-east-1";
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const PAGE_SIZE = 25;

async function backfillIsPublic() {
  let ExclusiveStartKey = undefined;
  let updatedCount = 0;
  let skippedCount = 0;
  console.log(
    `Scanning DynamoDB table '${TABLE_NAME}' for albums missing 'isPublic'...`
  );

  do {
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: "attribute_not_exists(isPublic)",
      Limit: PAGE_SIZE,
      ExclusiveStartKey,
    };

    const scanCmd = new ScanCommand(scanParams);
    const scanRes = await docClient.send(scanCmd);

    const items = scanRes.Items || [];
    skippedCount += (scanRes.ScannedCount || 0) - items.length;

    for (const item of items) {
      if (!item["id"]) {
        console.warn(
          'Warning: Encountered item without an "id"; skipping.',
          item
        );
        continue;
      }
      try {
        const updateCmd = new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: "ALBUM#" + item["id"], SK: "METADATA" },
          UpdateExpression: "SET isPublic = :true",
          ExpressionAttributeValues: { ":true": true },
          ConditionExpression: "attribute_not_exists(isPublic)",
        });
        await docClient.send(updateCmd);
        updatedCount++;
        console.log(`Updated album id=${item["id"]}: set isPublic=true`);
      } catch (err) {
        if (err && err.name === "ConditionalCheckFailedException") {
          // Item was updated since scan; skip.
          console.warn(
            `Album id=${item["id"]} was updated since scan; skipping.`
          );
          skippedCount++;
        } else {
          console.error(`Failed to update album id=${item["id"]}:`, err);
        }
      }
    }

    ExclusiveStartKey = scanRes.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  console.log("\n--- Backfill Complete ---");
  console.log(`Albums updated: ${updatedCount}`);
  console.log(`Albums skipped: ${skippedCount}`);
}

backfillIsPublic().catch((err) => {
  console.error("Fatal error during backfill:", err);
  process.exit(1);
});
