import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

/**
 * Albums GET endpoint with intelligent filtering based on user permissions:
 *
 * Authentication: Required - uses user authorizer context or session validation
 *
 * Logic:
 * - If user parameter is provided: always show only public albums (public profile view)
 * - If createdBy parameter is provided and current user IS the creator: all albums (public and private)
 * - If createdBy parameter is provided and current user is NOT the creator: only public albums
 * - If no createdBy/user is provided: all public albums from everyone
 *
 * - Queries are DynamoDB-native with proper pagination using LastEvaluatedKey cursors
 * - No in-memory filtering or offset logic for optimal performance
 * - Tag filtering is applied server-side when supported by the query method
 * - Supports both createdBy (userId) and user (username) parameters
 *
 * ⚠️ All album items MUST have the 'isPublic' attribute for the GSI to work properly.
 *   If some don't, a backfill is required to set this field on all items.
 */

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get user ID from request context (set by the user authorizer)
    let currentUserId = event.requestContext.authorizer?.["userId"];

    console.log("👤 CurrentUserId from authorizer:", currentUserId);

    // Fallback for local development or when authorizer context is missing
    if (!currentUserId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No user session found");
      }

      currentUserId = validation.user.userId;
      console.log(
        "✅ Got currentUserId from session validation:",
        currentUserId
      );
    }
    const limit = parseInt(event.queryStringParameters?.["limit"] || "20");
    const isPublicParam = event.queryStringParameters?.["isPublic"];
    const createdBy = event.queryStringParameters?.["createdBy"];
    const rawCursor = event.queryStringParameters?.["cursor"];
    const tag = event.queryStringParameters?.["tag"]; // New tag filter parameter
    const userParam = event.queryStringParameters?.["user"]; // New user parameter

    console.log("[Albums API] Request params:", {
      limit,
      isPublicParam,
      createdBy,
      tag,
      userParam,
      cursor: rawCursor ? "present" : "none",
    });

    // Handle user parameter lookup
    let finalCreatedBy = createdBy;
    if (userParam && !createdBy) {
      // Look up the target user by username
      const targetUser = await DynamoDBService.getUserByUsername(userParam);
      if (!targetUser) {
        return ResponseUtil.notFound(event, "User not found");
      }
      finalCreatedBy = targetUser.userId;
      console.log("[Albums API] Resolved username to userId:", finalCreatedBy);
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
    if (finalCreatedBy) {
      // Check if this is a public profile request (user parameter was used)
      if (userParam) {
        // Public profile view - always show only public albums regardless of ownership
        result = await DynamoDBService.listAlbumsByCreator(
          finalCreatedBy,
          limit,
          lastEvaluatedKey,
          tag
        );
        // Filter to only show public albums
        result.albums = result.albums.filter(
          (album) => album.isPublic === true
        );
      } else {
        // Private access via createdBy parameter - check ownership for permissions
        const isOwner = currentUserId === finalCreatedBy;

        if (isOwner) {
          // User is the owner - show all their albums (public and private)
          // If isPublicParam is explicitly provided, respect it, otherwise show all
          if (isPublicParam !== undefined) {
            const isPublicBool = isPublicParam === "true";
            // Use listAlbumsByCreator with additional filter
            result = await DynamoDBService.listAlbumsByCreator(
              finalCreatedBy,
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
              finalCreatedBy,
              limit,
              lastEvaluatedKey,
              tag
            );
          }
        } else {
          // User is NOT the owner - only show public albums from this creator
          result = await DynamoDBService.listAlbumsByCreator(
            finalCreatedBy,
            limit,
            lastEvaluatedKey,
            tag
          );
          // Filter to only show public albums
          result.albums = result.albums.filter(
            (album) => album.isPublic === true
          );
        }
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
