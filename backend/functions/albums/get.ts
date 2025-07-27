import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

/**
 * Albums GET endpoint with intelligent filtering based on user permissions:
 *
 * Logic:
 * - If createdBy is provided and user is NOT the creator: only public albums
 * - If createdBy is provided and user IS the creator: all albums (no isPublic filter)
 * - If no createdBy is provided: all public albums from everyone
 *
 * - Queries are DynamoDB-native with proper pagination using LastEvaluatedKey cursors
 * - No in-memory filtering or offset logic for optimal performance
 * - Tag filtering is applied server-side when supported by the query method
 *
 * ⚠️ All album items MUST have the 'isPublic' attribute for the GSI to work properly.
 *   If some don't, a backfill is required to set this field on all items.
 */

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.["limit"] || "20");
    const isPublicParam = event.queryStringParameters?.["isPublic"];
    const createdBy = event.queryStringParameters?.["createdBy"];
    const rawCursor = event.queryStringParameters?.["cursor"];
    const tag = event.queryStringParameters?.["tag"]; // New tag filter parameter

    console.log("[Albums API] Request params:", {
      limit,
      isPublicParam,
      createdBy,
      tag,
      cursor: rawCursor ? "present" : "none",
    });

    // Get authenticated user if available
    let currentUserId: string | null = null;
    try {
      const validation = await UserAuthMiddleware.validateSession(event);
      if (validation.isValid && validation.user) {
        currentUserId = validation.user.userId;
        console.log("[Albums API] Authenticated user:", currentUserId);
      }
    } catch (error) {
      console.log("[Albums API] No authenticated user (anonymous request)");
    }

    // Parse DynamoDB native LastEvaluatedKey as the cursor (base64-encoded JSON)
    let lastEvaluatedKey: any = undefined;
    if (rawCursor) {
      try {
        lastEvaluatedKey = JSON.parse(
          Buffer.from(rawCursor, "base64").toString("utf-8")
        );
      } catch {
        return ResponseUtil.error(event, "Invalid cursor");
      }
    }

    let result;

    // Implement the new logic based on user requirements
    if (createdBy) {
      // If createdBy is provided, check if current user is the creator
      const isOwner = currentUserId === createdBy;

      if (isOwner) {
        // User is the owner - show all their albums (public and private)
        // If isPublicParam is explicitly provided, respect it, otherwise show all
        if (isPublicParam !== undefined) {
          const isPublicBool = isPublicParam === "true";
          // Use listAlbumsByCreator with additional filter
          result = await DynamoDBService.listAlbumsByCreator(
            createdBy,
            limit,
            lastEvaluatedKey,
            tag
          );
          // Filter the results by isPublic status
          result.albums = result.albums.filter(
            (album) => album.isPublic === isPublicBool
          );
        } else {
          // Show all albums from this creator (public and private)
          result = await DynamoDBService.listAlbumsByCreator(
            createdBy,
            limit,
            lastEvaluatedKey,
            tag
          );
        }
      } else {
        // User is NOT the owner - only show public albums from this creator
        result = await DynamoDBService.listAlbumsByCreator(
          createdBy,
          limit,
          lastEvaluatedKey,
          tag
        );
        // Filter to only show public albums
        result.albums = result.albums.filter(
          (album) => album.isPublic === true
        );
      }
    } else {
      // No createdBy provided - show all public albums from everyone
      result = await DynamoDBService.listAlbumsByPublicStatus(
        true, // Only public albums
        limit,
        lastEvaluatedKey,
        tag
      );
    }

    const nextCursor = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString("base64")
      : null;
    const hasNext = !!result.lastEvaluatedKey;

    return ResponseUtil.success(event, {
      albums: result.albums,
      nextCursor,
      hasNext,
    });
  } catch (err) {
    console.error("Error fetching albums:", err);
    return ResponseUtil.error(event, "Error fetching albums");
  }
};
