const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

// Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;

if (!DYNAMODB_TABLE || !S3_BUCKET) {
  console.error(
    "Missing required environment variables: DYNAMODB_TABLE, S3_BUCKET"
  );
  process.exit(1);
}

// Initialize AWS clients
const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: AWS_REGION });

// Thumbnail size mapping
const THUMBNAIL_SIZES = ["cover", "small", "medium", "large", "xlarge"];

/**
 * Get relative path for storing in database
 */
function getRelativePath(key) {
  return key.startsWith("/") ? key : `/${key}`;
}

/**
 * Get all albums from DynamoDB
 */
async function getAllAlbums() {
  const albums = [];
  let lastEvaluatedKey;

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
    albums.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return albums;
}

/**
 * Check if an S3 object exists
 */
async function objectExists(key) {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
}

/**
 * Copy S3 object to new location
 */
async function copyObject(sourceKey, destinationKey) {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: `${S3_BUCKET}/${sourceKey}`,
      Key: destinationKey,
      MetadataDirective: "COPY",
    })
  );
}

/**
 * Delete S3 object
 */
async function deleteObject(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

/**
 * Get existing album cover thumbnails with old naming pattern
 */
async function getExistingAlbumThumbnails(albumId) {
  const baseKey = `albums/${albumId}/cover/thumbnails/`;
  const existingThumbnails = {};

  for (const size of THUMBNAIL_SIZES) {
    const oldKey = `${baseKey}${size}.jpg`;
    if (await objectExists(oldKey)) {
      existingThumbnails[size] = oldKey;
    }
  }

  return existingThumbnails;
}

/**
 * Migrate album thumbnails from old to new naming pattern
 */
async function migrateAlbumThumbnails(album) {
  const { id: albumId, thumbnailUrls } = album;

  console.log(`🔄 Processing album ${albumId}...`);

  try {
    // Get existing thumbnails with old naming pattern
    const existingThumbnails = await getExistingAlbumThumbnails(albumId);

    if (Object.keys(existingThumbnails).length === 0) {
      console.log(`  ℹ️  No old thumbnails found for album ${albumId}`);
      return { status: "skipped", reason: "no_old_thumbnails" };
    }

    console.log(
      `  📋 Found ${
        Object.keys(existingThumbnails).length
      } old thumbnails: ${Object.keys(existingThumbnails).join(", ")}`
    );

    const baseKey = `albums/${albumId}/cover/thumbnails/`;
    const newThumbnailUrls = {};
    const migratedSizes = [];

    // Copy each thumbnail to new naming pattern
    for (const [size, oldKey] of Object.entries(existingThumbnails)) {
      const newKey = `${baseKey}cover_thumb_${size}.jpg`;

      try {
        // Check if new thumbnail already exists
        if (await objectExists(newKey)) {
          console.log(`  ✓ New thumbnail already exists: ${newKey}`);
          newThumbnailUrls[size] = getRelativePath(newKey);
          continue;
        }

        // Copy old thumbnail to new location
        await copyObject(oldKey, newKey);
        console.log(`  ✅ Copied: ${oldKey} → ${newKey}`);

        newThumbnailUrls[size] = getRelativePath(newKey);
        migratedSizes.push(size);
      } catch (error) {
        console.error(`  ❌ Failed to copy ${oldKey} to ${newKey}:`, error);
        return { status: "error", reason: `copy_failed_${size}` };
      }
    }

    // Update database with new thumbnail URLs
    if (Object.keys(newThumbnailUrls).length > 0) {
      await docClient.send(
        new UpdateCommand({
          TableName: DYNAMODB_TABLE,
          Key: {
            PK: `ALBUM#${albumId}`,
            SK: "METADATA",
          },
          UpdateExpression:
            "SET thumbnailUrls = :thumbnailUrls, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":thumbnailUrls": newThumbnailUrls,
            ":updatedAt": new Date().toISOString(),
          },
        })
      );

      console.log(`  💾 Updated database with new thumbnail URLs`);
    }

    // Delete old thumbnails
    for (const [size, oldKey] of Object.entries(existingThumbnails)) {
      if (migratedSizes.includes(size)) {
        try {
          await deleteObject(oldKey);
          console.log(`  🗑️  Deleted old thumbnail: ${oldKey}`);
        } catch (error) {
          console.error(
            `  ⚠️  Failed to delete old thumbnail ${oldKey}:`,
            error
          );
          // Don't fail the migration if deletion fails
        }
      }
    }

    console.log(
      `  ✅ Successfully migrated ${migratedSizes.length} thumbnails for album ${albumId}`
    );
    return {
      status: "success",
      migratedSizes,
      newThumbnailUrls,
    };
  } catch (error) {
    console.error(`  ❌ Error migrating album ${albumId}:`, error);
    return { status: "error", reason: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateAlbumThumbnailNaming() {
  console.log("🚀 Starting album thumbnail naming migration...");
  console.log(`📋 DynamoDB Table: ${DYNAMODB_TABLE}`);
  console.log(`🪣 S3 Bucket: ${S3_BUCKET}`);
  console.log();

  try {
    // Get all albums
    console.log("📖 Fetching all albums...");
    const albums = await getAllAlbums();
    console.log(`📊 Found ${albums.length} albums`);
    console.log();

    if (albums.length === 0) {
      console.log("No albums found. Nothing to migrate.");
      return;
    }

    // Process each album
    const results = {
      total: albums.length,
      processed: 0,
      skipped: 0,
      success: 0,
      error: 0,
      errors: [],
      totalMigrated: 0,
    };

    for (const [index, album] of albums.entries()) {
      console.log(`[Album ${index + 1}/${albums.length}]`);

      const result = await migrateAlbumThumbnails(album);
      results.processed++;

      switch (result.status) {
        case "skipped":
          results.skipped++;
          break;
        case "success":
          results.success++;
          results.totalMigrated += result.migratedSizes?.length || 0;
          break;
        case "error":
          results.error++;
          results.errors.push({
            albumId: album.id,
            reason: result.reason,
          });
          break;
      }

      // Add small delay to avoid overwhelming AWS APIs
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Print summary
    console.log();
    console.log("📊 Migration Summary:");
    console.log(`   Total Albums: ${results.total}`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Success: ${results.success}`);
    console.log(`   Errors: ${results.error}`);
    console.log(`   Total Thumbnails Migrated: ${results.totalMigrated}`);

    if (results.errors.length > 0) {
      console.log();
      console.log("❌ Errors:");
      results.errors.forEach((error) => {
        console.log(`   - Album ${error.albumId}: ${error.reason}`);
      });
    }

    console.log();
    console.log("✅ Album thumbnail naming migration completed!");
  } catch (error) {
    console.error("💥 Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateAlbumThumbnailNaming().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  migrateAlbumThumbnailNaming,
  migrateAlbumThumbnails,
  getAllAlbums,
};
