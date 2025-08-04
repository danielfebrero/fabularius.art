import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";

/**
 * Handler to get all public media
 * This function retrieves all public media items from DynamoDB
 * It is used for SSG purposes to pre-render media pages
 *
 * @param event - API Gateway event
 * @returns APIGatewayProxyResult with all public media
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get all public media directly from DynamoDB
    const allMedia = await DynamoDBService.getAllPublicMedia();

    return ResponseUtil.success(event, allMedia);
  } catch (error) {
    console.error("Error fetching all public media:", error);
    return ResponseUtil.internalError(event, "Failed to fetch media");
  }
};
