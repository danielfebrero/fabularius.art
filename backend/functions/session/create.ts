import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { UserSession, CreateSessionRequest } from "@shared/types/session";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const SESSIONS_TABLE = process.env["SESSIONS_TABLE"] || "pornspot-sessions";

/**
 * Create a new user session
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "Request body is required",
        }),
      };
    }

    const request: CreateSessionRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.fingerprintId || !request.deviceInfo) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "fingerprintId and deviceInfo are required",
        }),
      };
    }

    // Extract IP from event
    const clientIP =
      event.requestContext.identity.sourceIp ||
      event.headers["X-Forwarded-For"]?.split(",")[0] ||
      "0.0.0.0";

    // Create session object
    const sessionId = uuidv4();
    const now = new Date();

    const session: UserSession = {
      id: sessionId,
      fingerprintId: request.fingerprintId,
      userId: request.userId || "",
      startTime: now,
      events: [],
      pageViews: 0,
      uniquePages: 0,
      bounceRate: 0,
      conversionEvents: [],
      deviceInfo: request.deviceInfo,
      location: request.location || {},
      referralSource: request.referralSource || { type: "direct" },
      isBot: false, // Will be determined by analysis
      riskScore: 0.1, // Initial low risk
      qualityScore: 0.9, // Initial high quality
    };

    // Store in DynamoDB
    await dynamoClient.send(
      new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: {
          ...session,
          pk: `SESSION#${sessionId}`,
          sk: `FINGERPRINT#${request.fingerprintId}`,
          gsi1pk: `FINGERPRINT#${request.fingerprintId}`,
          gsi1sk: now.toISOString(),
          ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days TTL
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          clientIP,
          userAgent: event.headers["User-Agent"] || "",
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: session,
      }),
    };
  } catch (error) {
    console.error("Create session error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};
