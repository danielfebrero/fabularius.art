import { APIGatewayProxyResult } from "aws-lambda";
import { ApiResponse } from "../types";

export class ResponseUtil {
  static success<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin":
          process.env["NODE_ENV"] === "development"
            ? "http://localhost:3000"
            : "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials":
          process.env["NODE_ENV"] === "development" ? "true" : "false",
      },
      body: JSON.stringify(response),
    };
  }

  static error(
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
        "Access-Control-Allow-Origin":
          process.env["NODE_ENV"] === "development"
            ? "http://localhost:3000"
            : "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials":
          process.env["NODE_ENV"] === "development" ? "true" : "false",
      },
      body: JSON.stringify(response),
    };
  }

  static notFound(
    message: string = "Resource not found"
  ): APIGatewayProxyResult {
    return this.error(message, 404);
  }

  static badRequest(message: string = "Bad request"): APIGatewayProxyResult {
    return this.error(message, 400);
  }

  static unauthorized(message: string = "Unauthorized"): APIGatewayProxyResult {
    return this.error(message, 401);
  }

  static forbidden(message: string = "Forbidden"): APIGatewayProxyResult {
    return this.error(message, 403);
  }

  static internalError(
    message: string = "Internal server error"
  ): APIGatewayProxyResult {
    return this.error(message, 500);
  }

  static created<T>(data: T): APIGatewayProxyResult {
    return this.success(data, 201);
  }

  static noContent(): APIGatewayProxyResult {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin":
          process.env["NODE_ENV"] === "development"
            ? "http://localhost:3000"
            : "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials":
          process.env["NODE_ENV"] === "development" ? "true" : "false",
      },
      body: "",
    };
  }
}
