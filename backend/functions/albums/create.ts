import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { ResponseUtil } from "../../shared/utils/response";
import { ParameterStoreService } from "../../shared/utils/parameters";
import { CreateAlbumRequest, AlbumEntity, Album } from "../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: CreateAlbumRequest = JSON.parse(event.body);

    if (!request.title || request.title.trim().length === 0) {
      return ResponseUtil.badRequest(event, "Album title is required");
    }

    const albumId = uuidv4();
    const now = new Date().toISOString();

    const albumEntity: AlbumEntity = {
      PK: `ALBUM#${albumId}`,
      SK: "METADATA",
      GSI1PK: "ALBUM",
      GSI1SK: `${now}#${albumId}`,
      EntityType: "Album",
      id: albumId,
      title: request.title.trim(),
      tags: request.tags,
      createdAt: now,
      updatedAt: now,
      mediaCount: 0,
      isPublic: request.isPublic ?? false,
    };

    await DynamoDBService.createAlbum(albumEntity);

    const album: Album = {
      id: albumEntity.id,
      title: albumEntity.title,
      createdAt: albumEntity.createdAt,
      updatedAt: albumEntity.updatedAt,
      mediaCount: albumEntity.mediaCount,
      isPublic: albumEntity.isPublic,
    };

    if (albumEntity.tags !== undefined) {
      album.tags = albumEntity.tags;
    }

    if (albumEntity.coverImageUrl !== undefined) {
      album.coverImageUrl = albumEntity.coverImageUrl;
    }

    // Trigger revalidation
    try {
      console.log("Fetching revalidation parameters from Parameter Store...");

      const [frontendUrl, revalidateSecret] = await Promise.all([
        ParameterStoreService.getFrontendUrl(),
        ParameterStoreService.getRevalidateSecret(),
      ]);

      const revalidateUrl = `${frontendUrl}/api/revalidate?secret=${revalidateSecret}&tag=albums`;
      console.log(
        "Triggering revalidation for URL:",
        revalidateUrl.replace(revalidateSecret, "***")
      );

      const revalidateResponse = await fetch(revalidateUrl, {
        method: "POST",
      });

      if (!revalidateResponse.ok) {
        const errorText = await revalidateResponse.text();
        console.error("Revalidation failed:", {
          status: revalidateResponse.status,
          statusText: revalidateResponse.statusText,
          body: errorText,
        });
      } else {
        const result = await revalidateResponse.json();
        console.log("Revalidation successful:", result);
      }
    } catch (revalidateError) {
      console.error("Error triggering revalidation:", revalidateError);
      // Do not block the response for revalidation failure
    }

    return ResponseUtil.created(event, album);
  } catch (error) {
    console.error("Error creating album:", error);
    return ResponseUtil.internalError(event, "Failed to create album");
  }
};
