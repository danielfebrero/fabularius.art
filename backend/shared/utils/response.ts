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
  const headers: { [key: string]: string | boolean } = {
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": true,
  };

  if (origin) {
    for (const allowedOrigin of AllowedOrigins) {
      if (
        (typeof allowedOrigin === "string" && allowedOrigin === origin) ||
        (allowedOrigin instanceof RegExp && allowedOrigin.test(origin))
      ) {
        headers["Access-Control-Allow-Origin"] = origin;
        break;
      }
    }
  }

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
