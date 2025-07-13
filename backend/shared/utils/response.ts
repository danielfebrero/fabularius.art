import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { ApiResponse } from "../types";

const AllowedOrigins = [
  "http://localhost:3000",
  "https://fabularius.art",
  "https://www.fabularius.art",
  /^https:\/\/fabularius-art-frontend-.*-fabularius\.vercel\.app$/, // Vercel Preview
  "https://fabularius-art-frontend.vercel.app", // Vercel Production
];

const getCorsHeaders = (event: APIGatewayProxyEvent) => {
  const origin = event.headers["origin"] || event.headers["Origin"];
  console.log("CORS Debug - Origin:", origin);
  console.log("CORS Debug - All Headers:", JSON.stringify(event.headers));

  const headers: { [key: string]: string | boolean } = {
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": true,
  };

  let originMatched = false;
  if (origin) {
    for (const allowedOrigin of AllowedOrigins) {
      if (
        (typeof allowedOrigin === "string" && allowedOrigin === origin) ||
        (allowedOrigin instanceof RegExp && allowedOrigin.test(origin))
      ) {
        headers["Access-Control-Allow-Origin"] = origin;
        originMatched = true;
        console.log("CORS Debug - Origin matched:", allowedOrigin);
        break;
      }
    }
  }

  // If no origin matched, but we're in production, allow Vercel deployment
  if (!originMatched && origin) {
    if (origin.includes("vercel.app") || origin.includes("fabularius")) {
      headers["Access-Control-Allow-Origin"] = origin;
      console.log("CORS Debug - Fallback origin allowed:", origin);
    } else {
      console.log("CORS Debug - Origin not allowed:", origin);
    }
  }

  console.log("CORS Debug - Final headers:", headers);
  return headers;
};

export class ResponseUtil {
  static success<T>(
    event: APIGatewayProxyEvent,
    data: T,
    statusCode: number = 200
  ): APIGatewayProxyResult {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(event),
      },
      body: JSON.stringify(response),
    };
  }

  static error(
    event: APIGatewayProxyEvent,
    message: string,
    statusCode: number = 400
  ): APIGatewayProxyResult {
    const response: ApiResponse = {
      success: false,
      error: message,
    };

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(event),
      },
      body: JSON.stringify(response),
    };
  }

  static notFound(
    event: APIGatewayProxyEvent,
    message: string = "Resource not found"
  ): APIGatewayProxyResult {
    return this.error(event, message, 404);
  }

  static badRequest(
    event: APIGatewayProxyEvent,
    message: string = "Bad request"
  ): APIGatewayProxyResult {
    return this.error(event, message, 400);
  }

  static unauthorized(
    event: APIGatewayProxyEvent,
    message: string = "Unauthorized"
  ): APIGatewayProxyResult {
    return this.error(event, message, 401);
  }

  static forbidden(
    event: APIGatewayProxyEvent,
    message: string = "Forbidden"
  ): APIGatewayProxyResult {
    return this.error(event, message, 403);
  }

  static internalError(
    event: APIGatewayProxyEvent,
    message: string = "Internal server error"
  ): APIGatewayProxyResult {
    return this.error(event, message, 500);
  }

  static created<T>(
    event: APIGatewayProxyEvent,
    data: T
  ): APIGatewayProxyResult {
    return this.success(event, data, 201);
  }

  static noContent(event: APIGatewayProxyEvent): APIGatewayProxyResult {
    return {
      statusCode: 204,
      headers: getCorsHeaders(event),
      body: "",
    };
  }
}
