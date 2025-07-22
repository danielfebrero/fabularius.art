const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const path = require("path");
const dotenv = require("dotenv");

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env="));
const env = envArg ? envArg.split("=")[1] : "dev";

// Load environment variables from the parent directory
const envPath = path.resolve(__dirname, ".env." + env);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env." + env + " file", result.error);
  process.exit(1);
}

// Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

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

// Thumbnail configurations
const THUMBNAIL_CONFIGS = {
  cover: { width: 128, height: 128, quality: 80, suffix: "_thumb_cover" },
  small: { width: 240, height: 240, quality: 85, suffix: "_thumb_small" },
  medium: { width: 300, height: 300, quality: 90, suffix: "_thumb_medium" },
  large: { width: 365, height: 365, quality: 90, suffix: "_thumb_large" },
  xlarge: { width: 600, height: 600, quality: 95, suffix: "_thumb_xlarge" },
};

/**
 * Upload buffer to S3
 */
async function uploadBuffer(key, buffer, mimeType, metadata = {}) {
  const { PutObjectCommand } = require("@aws-sdk/client-s3");

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: metadata,
  });

  await s3Client.send(command);
}

/**
 * Generate all thumbnail sizes for an image
 */
async function generateThumbnails(originalKey, imageBuffer) {
  const originalPath = originalKey.split("/");
  const fileName = originalPath[originalPath.length - 1];
  const basePath = originalPath.slice(0, -1).join("/");

  if (!fileName) {
    throw new Error("Invalid file key: no filename found");
  }

  // Extract file name without extension
  const lastDotIndex = fileName.lastIndexOf(".");
  const fileNameWithoutExt =
    lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;

  const thumbnailUrls = {};

  for (const [configName, config] of Object.entries(THUMBNAIL_CONFIGS)) {
    try {
      // Generate thumbnail buffer
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(config.width, config.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: config.quality })
        .toBuffer();

      // Create thumbnail key
      const thumbnailKey =
        basePath +
        "/thumbnails/" +
        fileNameWithoutExt +
        config.suffix +
        ".webp";

      // Upload thumbnail to S3
      await uploadBuffer(thumbnailKey, thumbnailBuffer, "image/webp", {
        "original-key": originalKey,
        "thumbnail-config": JSON.stringify(config),
      });

      thumbnailUrls[configName] = thumbnailKey;
      console.log(
        "Generated " + configName + " thumbnail: " + thumbnailUrls[configName]
      );
    } catch (error) {
      console.error(
        "Failed to generate " +
          configName +
          " thumbnail for " +
          originalKey +
          ":",
        error
      );
      return null;
    }
  }

  return thumbnailUrls;
}

/**
 * Generate album cover thumbnails
 */
async function generateAlbumCoverThumbnails(albumId, imageBuffer) {
  const baseKey = "albums/" + albumId + "/cover/thumbnails/";
  const thumbnailUrls = {};

  for (const [configName, config] of Object.entries(THUMBNAIL_CONFIGS)) {
    try {
      // Generate thumbnail buffer
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(config.width, config.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: config.quality })
        .toBuffer();

      // Create thumbnail key using standardized suffix pattern for album covers
      const thumbnailKey = baseKey + "cover_thumb_" + configName + ".webp";

      // Upload thumbnail to S3
      await uploadBuffer(thumbnailKey, thumbnailBuffer, "image/webp", {
        "album-id": albumId,
        "thumbnail-size": configName,
        "thumbnail-config": JSON.stringify(config),
      });

      thumbnailUrls[configName] = thumbnailKey;
    } catch (error) {
      console.error(
        "Failed to generate " +
          configName +
          " album cover thumbnail for album " +
          albumId +
          ":",
        error
      );
      return null;
    }
  }

  return thumbnailUrls;
}

/**
 * Check if a file is an image that supports thumbnail generation
 */
function isImageFile(mimeType) {
  return (
    mimeType?.startsWith("image/") &&
    [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(mimeType.toLowerCase())
  );
}

/**
 * Extract S3 key from URL
 */
function extractKeyFromUrl(url) {
  if (!url) {
    return null;
  }

  // If the URL is relative, remove the leading slash.
  if (url.startsWith("/")) {
    return url.substring(1);
  }

  // Otherwise, parse it as a full URL.
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

/**
 * Get all media items from DynamoDB
 */
async function getAllMediaItems() {
  const mediaItems = [];
  let lastEvaluatedKey;

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
    mediaItems.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return mediaItems;
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
 * Update media item with thumbnail URLs
 */
async function updateMediaThumbnails(unused_albumId, mediaId, thumbnailUrls) {
  // In the new schema, media is stored independently
  await docClient.send(
    new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: "MEDIA#" + mediaId,
        SK: "METADATA",
      },
      UpdateExpression:
        "SET thumbnailUrl = :thumbnailUrl, thumbnailUrls = :thumbnailUrls, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":thumbnailUrl": thumbnailUrls.small,
        ":thumbnailUrls": thumbnailUrls,
        ":status": "uploaded",
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

/**
 * Update album with thumbnail URLs
 */
async function updateAlbumThumbnails(albumId, thumbnailUrls) {
  await docClient.send(
    new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        PK: "ALBUM#" + albumId,
        SK: "METADATA",
      },
      UpdateExpression:
        "SET thumbnailUrls = :thumbnailUrls, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":thumbnailUrls": thumbnailUrls,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

/**
 * Download file from S3
 */
async function downloadFromS3(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error("No body in S3 response");
    }

    // Convert stream to buffer
    const chunks = [];
    const stream = response.Body;

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Failed to download " + key + ":", error);
    return null;
  }
}

/**
 * Process a single media item
 */
async function processMediaItem(mediaItem) {
  const { id, url, mimeType, thumbnailUrl, filename } = mediaItem;

  // Skip if thumbnail already exists
  if (thumbnailUrl) {
    console.log("✓ Media " + id + " already has thumbnail");
    return { status: "skipped", reason: "already_has_thumbnail" };
  }

  // Skip if not an image
  if (!isImageFile(mimeType)) {
    console.log("- Media " + id + " is not an image (" + mimeType + ")");
    return { status: "skipped", reason: "not_image" };
  }

  try {
    console.log("🔄 Processing media " + id + "...");

    // Extract S3 key from URL or use filename
    const s3Key = extractKeyFromUrl(url) || filename;
    if (!s3Key) {
      console.error("❌ Could not determine S3 key for media " + id);
      return { status: "error", reason: "invalid_key" };
    }

    // Download original image
    const imageBuffer = await downloadFromS3(s3Key);
    if (!imageBuffer) {
      console.error("❌ Failed to download media " + id);
      return { status: "error", reason: "download_failed" };
    }

    // Generate thumbnails (all sizes)
    const thumbnailUrls = await generateThumbnails(s3Key, imageBuffer);
    if (!thumbnailUrls) {
      console.error("❌ Failed to generate thumbnails for media " + id);
      return { status: "error", reason: "thumbnail_generation_failed" };
    }

    // Update database - no albumId needed in new schema
    await updateMediaThumbnails(null, id, thumbnailUrls);

    console.log(
      "✅ Generated thumbnails for media " + id + ":",
      Object.keys(thumbnailUrls).join(", ")
    );
    return { status: "success", thumbnailUrls };
  } catch (error) {
    console.error("❌ Error processing media " + id + ":", error);
    return { status: "error", reason: error.message };
  }
}

/**
 * Process a single album cover
 */
async function processAlbumCover(album) {
  const { id, coverImageUrl, thumbnailUrls } = album;

  // Skip if no cover image
  if (!coverImageUrl) {
    console.log("- Album " + id + " has no cover image");
    return { status: "skipped", reason: "no_cover_image" };
  }

  // Skip if thumbnails already exist
  if (thumbnailUrls && Object.keys(thumbnailUrls).length > 0) {
    console.log("✓ Album " + id + " already has thumbnails");
    return { status: "skipped", reason: "already_has_thumbnails" };
  }

  try {
    console.log("🔄 Processing album cover " + id + "...");

    // Extract S3 key from URL
    const s3Key = extractKeyFromUrl(coverImageUrl);
    if (!s3Key) {
      console.error("❌ Could not determine S3 key for album " + id);
      return { status: "error", reason: "invalid_key" };
    }

    // Download cover image
    const imageBuffer = await downloadFromS3(s3Key);
    if (!imageBuffer) {
      console.error("❌ Failed to download cover image for album " + id);
      return { status: "error", reason: "download_failed" };
    }

    // Generate album cover thumbnails
    const generatedThumbnailUrls = await generateAlbumCoverThumbnails(
      id,
      imageBuffer
    );
    if (!generatedThumbnailUrls) {
      console.error("❌ Failed to generate thumbnails for album " + id);
      return { status: "error", reason: "thumbnail_generation_failed" };
    }

    // Update database
    await updateAlbumThumbnails(id, generatedThumbnailUrls);

    console.log(
      "✅ Generated thumbnails for album " + id + ":",
      Object.keys(generatedThumbnailUrls).join(", ")
    );
    return { status: "success", thumbnailUrls: generatedThumbnailUrls };
  } catch (error) {
    console.error("❌ Error processing album " + id + ":", error);
    return { status: "error", reason: error.message };
  }
}

/**
 * Main repair function
 */
async function repairThumbnails() {
  console.log("🚀 Starting thumbnail repair process...");
  console.log("📋 DynamoDB Table: " + DYNAMODB_TABLE);
  console.log("🪣 S3 Bucket: " + S3_BUCKET);
  console.log(
    "🌐 CloudFront Domain: " + (CLOUDFRONT_DOMAIN || "Not configured")
  );
  console.log();

  try {
    // Get all media items and albums
    console.log("📖 Fetching all media items...");
    const mediaItems = await getAllMediaItems();
    console.log("📊 Found " + mediaItems.length + " media items");

    console.log("📖 Fetching all albums...");
    const albums = await getAllAlbums();
    console.log("📊 Found " + albums.length + " albums");
    console.log();

    if (mediaItems.length === 0 && albums.length === 0) {
      console.log("No media items or albums found. Nothing to repair.");
      return;
    }

    // Process media items
    const mediaResults = {
      total: mediaItems.length,
      processed: 0,
      skipped: 0,
      success: 0,
      error: 0,
      errors: [],
    };

    if (mediaItems.length > 0) {
      console.log("🔧 Processing media items...");
      for (const [index, mediaItem] of mediaItems.entries()) {
        console.log(
          "[Media " + (index + 1) + "/" + mediaItems.length + "]",
          ""
        );

        const result = await processMediaItem(mediaItem);
        mediaResults.processed++;

        switch (result.status) {
          case "skipped":
            mediaResults.skipped++;
            break;
          case "success":
            mediaResults.success++;
            break;
          case "error":
            mediaResults.error++;
            mediaResults.errors.push({
              mediaId: mediaItem.id,
              reason: result.reason,
            });
            break;
        }

        // Add small delay to avoid overwhelming AWS APIs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Process album covers
    const albumResults = {
      total: albums.length,
      processed: 0,
      skipped: 0,
      success: 0,
      error: 0,
      errors: [],
    };

    if (albums.length > 0) {
      console.log();
      console.log("🎨 Processing album covers...");
      for (const [index, album] of albums.entries()) {
        console.log("[Album " + (index + 1) + "/" + albums.length + "]", "");

        const result = await processAlbumCover(album);
        albumResults.processed++;

        switch (result.status) {
          case "skipped":
            albumResults.skipped++;
            break;
          case "success":
            albumResults.success++;
            break;
          case "error":
            albumResults.error++;
            albumResults.errors.push({
              albumId: album.id,
              reason: result.reason,
            });
            break;
        }

        // Add small delay to avoid overwhelming AWS APIs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Print summary
    console.log();
    console.log("📊 Repair Summary:");
    console.log("   Media Items:");
    console.log("     Total: " + mediaResults.total);
    console.log("     Processed: " + mediaResults.processed);
    console.log("     Skipped: " + mediaResults.skipped);
    console.log("     Success: " + mediaResults.success);
    console.log("     Errors: " + mediaResults.error);

    console.log("   Albums:");
    console.log("     Total: " + albumResults.total);
    console.log("     Processed: " + albumResults.processed);
    console.log("     Skipped: " + albumResults.skipped);
    console.log("     Success: " + albumResults.success);
    console.log("     Errors: " + albumResults.error);

    const totalErrors = mediaResults.errors.concat(
      albumResults.errors.map((error) => ({ ...error, type: "album" }))
    );

    if (totalErrors.length > 0) {
      console.log();
      console.log("❌ Errors:");
      mediaResults.errors.forEach((error) => {
        console.log("   - Media " + error.mediaId + ": " + error.reason);
      });
      albumResults.errors.forEach((error) => {
        console.log("   - Album " + error.albumId + ": " + error.reason);
      });
    }

    console.log();
    console.log("✅ Thumbnail repair process completed!");
  } catch (error) {
    console.error("💥 Fatal error during repair process:", error);
    process.exit(1);
  }
}

// Run the repair if this script is executed directly
if (require.main === module) {
  repairThumbnails().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = {
  repairThumbnails,
  processAlbumCover,
  generateAlbumCoverThumbnails,
  getAllAlbums,
  updateAlbumThumbnails,
};
