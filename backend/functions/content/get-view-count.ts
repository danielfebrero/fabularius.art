import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get view count function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Parse request body for bulk view count fetch
    let targets: Array<{
      targetType: "album" | "media";
      targetId: string;
    }> = [];

    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        targets = body.targets || [];
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid JSON body");
      }
    }

    // Validate targets
    if (!Array.isArray(targets) || targets.length === 0) {
      return ResponseUtil.badRequest(
        event,
        "targets array is required and must not be empty"
      );
    }

    // Limit the number of targets to prevent abuse
    if (targets.length > 100) {
      return ResponseUtil.badRequest(
        event,
        "Cannot request view counts for more than 100 items at once"
      );
    }

    // Validate each target
    for (const target of targets) {
      if (!target.targetType || !target.targetId) {
        return ResponseUtil.badRequest(
          event,
          "Each target must have targetType and targetId"
        );
      }

      if (!["album", "media"].includes(target.targetType)) {
        return ResponseUtil.badRequest(
          event,
          "targetType must be 'album' or 'media'"
        );
      }
    }

    console.log(
      `📊 Fetching view counts for ${targets.length} targets:`,
      targets.map((t) => `${t.targetType}:${t.targetId}`).join(", ")
    );

    // Fetch view counts for all targets
    const viewCounts = await Promise.all(
      targets.map(async (target) => {
        try {
          let viewCount = 0;

          if (target.targetType === "album") {
            const album = await DynamoDBService.getAlbum(target.targetId);
            viewCount = album?.viewCount || 0;
          } else if (target.targetType === "media") {
            const media = await DynamoDBService.getMedia(target.targetId);
            viewCount = media?.viewCount || 0;
          }

          return {
            targetType: target.targetType,
            targetId: target.targetId,
            viewCount,
          };
        } catch (error) {
          console.warn(
            `⚠️ Failed to get view count for ${target.targetType}:${target.targetId}:`,
            error
          );
          // Return 0 for failed lookups instead of failing the entire request
          return {
            targetType: target.targetType,
            targetId: target.targetId,
            viewCount: 0,
          };
        }
      })
    );

    console.log(
      `✅ Successfully fetched view counts for ${viewCounts.length} targets`
    );

    return ResponseUtil.success(event, {
      viewCounts,
    });
  } catch (error) {
    console.error("❌ Error in get-view-count function:", error);
    return ResponseUtil.error(
      event,
      error instanceof Error ? error.message : "Failed to get view counts"
    );
  }
};
