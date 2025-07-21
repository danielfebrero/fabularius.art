/**
 * Admin Analytics Time Series Query Endpoint
 *
 * Endpoint: /admin/analytics/query
 * Method: GET
 *
 * Query Parameters:
 * - entity_type     (string, required): Type of the entity (e.g., "album", "user")
 * - entity_id       (string, required): ID of the entity
 * - metric_name     (string, required): Name of the metric (e.g., "album_view_count")
 * - interval_type   (string, required): Interval type ("hour", "day", etc.)
 * - from            (string, required): Inclusive ISO8601 start (window)
 * - to              (string, required): Exclusive ISO8601 end (window)
 *
 * Response: 200 OK
 * {
 *   "series": [
 *     {
 *       "window_start": "2025-07-21T00:00:00.000Z",
 *       "window_end":   "2025-07-21T01:00:00.000Z",
 *       "value":        123,
 *       "meta":         { ... }
 *     },
 *     ...
 *   ]
 * }
 *
 * Notes for Extension:
 * - To support additional metrics/entities/intervals, extend the aggregation logic (see metrics/README.md).
 * - The endpoint is schema-driven; new metrics/entities just require consistent PK/SK and attribute usage.
 * - Meta shape is metric-specific, serialized as JSON.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Table name config
const ANALYTICS_SNAPSHOTS_TABLE =
  process.env["ANALYTICS_SNAPSHOTS_TABLE"] || "AnalyticsSnapshots";

// DynamoDB client (uses local if AWS_SAM_LOCAL is set)
const isLocal = process.env["AWS_SAM_LOCAL"] === "true";
const clientConfig: any = {};
if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig));

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const params = event.queryStringParameters || {};

    // Validate required parameters
    const { entity_type, entity_id, metric_name, interval_type, from, to } =
      params;

    if (
      !entity_type ||
      !entity_id ||
      !metric_name ||
      !interval_type ||
      !from ||
      !to
    ) {
      return ResponseUtil.badRequest(
        event,
        "Missing required query parameters. Required: entity_type, entity_id, metric_name, interval_type, from, to"
      );
    }

    // Build PK and SK prefix
    const PK = `ENTITY#${entity_type}#${entity_id}#METRIC#${metric_name}`;
    const SK_prefix = `INTERVAL#${interval_type}#`;

    // Compose from/to for SK range (timestamp portion is ISO8601)
    // SK = INTERVAL#{interval_type}#{timestamp}
    // So between INTERVAL#interval_type#from and INTERVAL#interval_type#to (inclusive/exclusive)
    const SK_from = `${SK_prefix}${from}`;
    const SK_to = `${SK_prefix}${to}`;

    // Query DynamoDB for all matching snapshots
    const command = new QueryCommand({
      TableName: ANALYTICS_SNAPSHOTS_TABLE,
      KeyConditionExpression: "PK = :pk AND SK BETWEEN :sk_from AND :sk_to",
      ExpressionAttributeValues: {
        ":pk": PK,
        ":sk_from": SK_from,
        ":sk_to": SK_to,
      },
      ProjectionExpression: "value,window_start,window_end,meta",
      ScanIndexForward: true, // Ascending by SK/timestamp
    });

    const data = await ddb.send(command);

    const series =
      data.Items?.map((item) => ({
        window_start: item["window_start"],
        window_end: item["window_end"],
        value:
          typeof item["value"] === "number"
            ? item["value"]
            : Number(item["value"] ?? 0),
        meta:
          typeof item["meta"] === "string"
            ? safeParseJson(item["meta"])
            : item["meta"] ?? {},
      })) || [];

    return ResponseUtil.success(event, { series });
  } catch (error) {
    console.error("Error in /admin/analytics/query:", error);
    return ResponseUtil.internalError(event, "Failed to query analytics data.");
  }
};

/**
 * Safe JSON.parse with fallback to empty object.
 */
function safeParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
