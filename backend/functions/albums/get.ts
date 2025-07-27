import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";

/**
 * Refactored to use DynamoDB isPublic-createdAt-index GSI only.
 * - Queries by isPublic partition key, sorted by createdAt.
 * - Paginates using DynamoDB-native cursor (LastEvaluatedKey).
 * - Removes all in-memory or offset logic.
 * - ⚠️ All album items MUST have the 'isPublic' attribute for this GSI to work.
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

    // If createdBy is specified, use the creator-specific query
    if (createdBy) {
      result = await DynamoDBService.listAlbumsByCreator(
        createdBy,
        limit,
        lastEvaluatedKey,
        tag
      );
    } else {
      // Fall back to the existing isPublic-based query
      // Enforce 'isPublic' parameter when not filtering by creator
      if (typeof isPublicParam === "undefined") {
        return ResponseUtil.error(
          event,
          "Missing required 'isPublic' query parameter (required when 'createdBy' is not specified)"
        );
      }
      const isPublicBool = isPublicParam === "true";

      result = await DynamoDBService.listAlbumsByPublicStatus(
        isPublicBool,
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
