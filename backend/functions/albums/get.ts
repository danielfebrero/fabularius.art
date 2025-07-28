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
 * - If no user is provided: all public albums from everyone
 *
 * - Queries are DynamoDB-native with proper pagination using LastEvaluatedKey cursors
 * - No in-memory filtering or offset logic for optimal performance
 * - Tag filtering is applied server-side when supported by the query method
 * - Supports user (username) parameter for profile views
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
    console.log(
      "🔍 Event authorizer:",
      JSON.stringify(event.requestContext.authorizer, null, 2)
    );

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
    const rawCursor = event.queryStringParameters?.["cursor"];
    const tag = event.queryStringParameters?.["tag"]; // Tag filter parameter
    const userParam = event.queryStringParameters?.["user"]; // User parameter for username lookup

    console.log("[Albums API] Request params:", {
      limit,
      isPublicParam,
      tag,
      userParam,
      cursor: rawCursor ? "present" : "none",
    });

    // Handle user parameter lookup
    let finalCreatedBy = undefined;
    if (userParam) {
      console.log("[Albums API] Looking up user by username:", userParam);
      // Look up the target user by username
      const targetUser = await DynamoDBService.getUserByUsername(userParam);
      console.log(
        "[Albums API] Target user lookup result:",
        targetUser
          ? { userId: targetUser.userId, username: targetUser.username }
          : null
      );

      if (!targetUser) {
        console.log("[Albums API] User not found for username:", userParam);
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
      console.log("[Albums API] Using finalCreatedBy:", finalCreatedBy);

      // Public profile view - always show only public albums
      console.log(
        "[Albums API] Public profile view - fetching albums by creator"
      );
      result = await DynamoDBService.listAlbumsByCreator(
        finalCreatedBy,
        limit,
        lastEvaluatedKey,
        tag
      );
      console.log(
        "[Albums API] Raw albums from DB:",
        result.albums?.length || 0
      );

      // Filter to only show public albums
      result.albums = result.albums.filter((album) => album.isPublic === true);
      console.log(
        "[Albums API] Public albums after filtering:",
        result.albums?.length || 0
      );
    } else {
      // No user provided - show all public albums from everyone
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
