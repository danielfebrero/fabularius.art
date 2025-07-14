import { S3Event, S3EventRecord } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { ThumbnailService } from "../../shared/utils/thumbnail";
import { Readable } from "stream";

const isLocal = process.env["AWS_SAM_LOCAL"] === "true";

let s3Config = {};
if (isLocal) {
  s3Config = {
    endpoint: "http://pornspot-local-aws:4566",
    region: process.env["AWS_REGION"] || "us-east-1",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
    forcePathStyle: true,
  };
}

const s3Client = new S3Client(s3Config);

export const handler = async (event: S3Event): Promise<void> => {
  console.log("Processing S3 upload event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      await processUploadRecord(record);
    } catch (error) {
      console.error("Error processing record:", record, error);
      // Continue processing other records
    }
  }
};

async function processUploadRecord(record: S3EventRecord): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log(`Processing uploaded file: ${key}`);

  // Skip if this is already a thumbnail
  if (key.includes("/thumbnails/")) {
    console.log("Skipping thumbnail file");
    return;
  }

  // Extract album ID and media ID from the key
  const keyParts = key.split("/");
  if (
    keyParts.length < 4 ||
    keyParts[0] !== "albums" ||
    keyParts[2] !== "media"
  ) {
    console.log("Invalid key format, skipping:", key);
    return;
  }

  const albumId = keyParts[1];

  if (!albumId) {
    console.log("No album ID found in key:", key);
    return;
  }

  // Find the media record by filename
  const mediaResult = await DynamoDBService.listAlbumMedia(albumId, 100);
  const mediaItem = mediaResult.media.find((m) => m.filename === key);

  if (!mediaItem || !mediaItem.id) {
    console.log("Media record not found for key:", key);
    return;
  }

  // Get the file from S3
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(getObjectCommand);
  if (!response.Body) {
    console.log("No body in S3 response");
    return;
  }

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  const stream = response.Body as Readable;

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);

  // Check if it's an image and generate thumbnails
  if (ThumbnailService.isImageFile(mediaItem.mimeType)) {
    console.log("Generating thumbnails for:", key);

    try {
      const thumbnailUrls = await ThumbnailService.generateThumbnails(
        key,
        buffer
      );

      if (thumbnailUrls && Object.keys(thumbnailUrls).length > 0) {
        // Update the media record with thumbnail URLs
        await DynamoDBService.updateMedia(albumId, mediaItem.id!, {
          thumbnailUrl:
            thumbnailUrls["small"] || Object.values(thumbnailUrls)[0], // Default to small or first available
          thumbnailUrls,
          status: "uploaded",
          updatedAt: new Date().toISOString(),
        });

        console.log(
          "Updated media record with thumbnail URLs:",
          Object.keys(thumbnailUrls).join(", ")
        );
      } else {
        // Just update status if thumbnail generation failed
        await DynamoDBService.updateMedia(albumId, mediaItem.id!, {
          status: "uploaded",
          updatedAt: new Date().toISOString(),
        });

        console.log("Thumbnail generation failed, updated status only");
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);

      // Update status even if thumbnail generation failed
      await DynamoDBService.updateMedia(albumId, mediaItem.id!, {
        status: "uploaded",
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    console.log("Not an image file, updating status only");

    // For non-image files, just update the status
    await DynamoDBService.updateMedia(albumId, mediaItem.id!, {
      status: "uploaded",
      updatedAt: new Date().toISOString(),
    });
  }
}
