import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Media } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get user ID from request context (set by the user authorizer)
    let userId = event.requestContext.authorizer?.["userId"];

    console.log("👤 UserId from authorizer:", userId);

    // Fallback for local development or when authorizer context is missing
    if (!userId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No user session found");
      }

      userId = validation.user.userId;
      console.log("✅ Got userId from session validation:", userId);
    }

    // Parse pagination parameters
    const limit = parseInt(event.queryStringParameters?.["limit"] || "50");
    const cursor = event.queryStringParameters?.["cursor"];

    let lastEvaluatedKey;
    if (cursor) {
      try {
        lastEvaluatedKey = JSON.parse(Buffer.from(cursor, "base64").toString());
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid cursor");
      }
    }

    // Get user's media
    const { media, nextKey } = await DynamoDBService.getUserMedia(
      userId,
      limit,
      lastEvaluatedKey
    );

    const mediaResponse: Media[] = media.map((item) => {
      const response: Media = {
        id: item.id,
        filename: item.filename,
        originalFilename: item.originalFilename,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

      if (item.width !== undefined) {
        response.width = item.width;
      }

      if (item.height !== undefined) {
        response.height = item.height;
      }

      if (item.thumbnailUrl !== undefined) {
        response.thumbnailUrl = item.thumbnailUrl;
      }

      if (item.thumbnailUrls !== undefined) {
        response.thumbnailUrls = item.thumbnailUrls;
      }

      if (item.metadata !== undefined) {
        response.metadata = item.metadata;
      }

      if (item.createdBy !== undefined) {
        response.createdBy = item.createdBy;
      }

      if (item.createdByType !== undefined) {
        response.createdByType = item.createdByType;
      }

      return response;
    });

    const response = {
      media: mediaResponse,
      pagination: {
        hasNext: !!nextKey,
        cursor: nextKey
          ? Buffer.from(JSON.stringify(nextKey)).toString("base64")
          : null,
      },
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error fetching user media:", error);
    return ResponseUtil.internalError(event, "Failed to fetch user media");
  }
};
