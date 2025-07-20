import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";

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
    // Use AWS SDK v3 for DynamoDB query
    const {
      DynamoDBClient,
      QueryCommand,
    } = require("@aws-sdk/client-dynamodb");
    const { unmarshall } = require("@aws-sdk/util-dynamodb");
    const client = new DynamoDBClient({
      region: process.env["AWS_REGION"] || "eu-west-1",
    });

    const limit = parseInt(event.queryStringParameters?.["limit"] || "20");
    const isPublicParam = event.queryStringParameters?.["isPublic"];
    const rawCursor = event.queryStringParameters?.["cursor"];
    const TABLE_NAME = process.env["DYNAMODB_TABLE"];
    const GSI_NAME = "isPublic-createdAt-index";

    // Enforce 'isPublic' parameter: required for GSI
    if (typeof isPublicParam === "undefined") {
      return ResponseUtil.error(
        event,
        "Missing required 'isPublic' query parameter"
      );
    }
    const isPublicBool = isPublicParam === "true";

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

    // ⚠️ Possible data migration need:
    // All album records must have 'isPublic' set. If some items lack it, a data backfill is necessary.

    const params = {
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: "#isPublic = :isPublic",
      ExpressionAttributeNames: {
        "#isPublic": "isPublic",
      },
      ExpressionAttributeValues: {
        ":isPublic": { BOOL: isPublicBool },
      },
      Limit: limit,
      ScanIndexForward: false,
      ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
    };

    const command = new QueryCommand(params);
    const result = await client.send(command);

    const albums = (result.Items || []).map((item: any) => unmarshall(item));
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : null;
    const hasNext = !!result.LastEvaluatedKey;

    return ResponseUtil.success(event, {
      albums,
      nextCursor,
      hasNext,
    });
  } catch (err) {
    console.error("Error fetching albums:", err);
    return ResponseUtil.error(event, "Error fetching albums");
  }
};
