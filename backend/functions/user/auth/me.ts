import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { PlanUtil } from "@shared/utils/plan";
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/me handler called");
  console.log("📋 Full event:", JSON.stringify(event, null, 2));

  if (event.httpMethod === "OPTIONS") {
    console.log("⚡ Handling OPTIONS request");
    return ResponseUtil.noContent(event);
  }

  try {
    // Log IS_OFFLINE for local/prod mode debugging
    console.log("[ME] IS_OFFLINE:", process.env["IS_OFFLINE"]);
    // Surface all possible debugging info for session/cookie bug on /user/me
    const cookieHeader =
      event.headers["Cookie"] || event.headers["cookie"] || "";
    console.log("[ME] Incoming Cookie header:", cookieHeader);

    console.log("🔑 Checking authorizer context...");
    console.log(
      "📊 Request context:",
      JSON.stringify(event.requestContext, null, 2)
    );
    if (event.requestContext && event.requestContext.authorizer) {
      console.log(
        "[ME] Authorizer context:",
        JSON.stringify(event.requestContext.authorizer, null, 2)
      );
    } else {
      console.log("[ME] Authorizer context missing or empty.");
    }

    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      console.log(
        "❌ No userId found in authorizer context. Cookie was:",
        cookieHeader
      );
      return authResult;
    }

    const userId = authResult.userId!;
    console.log("✅ Authenticated user:", userId);

    console.log("🔍 Getting user from database...");
    const userEntity = await DynamoDBService.getUserById(userId);
    console.log(
      "👤 User entity:",
      userEntity ? `Found (${userEntity.email})` : "Not found"
    );

    if (!userEntity) {
      console.log("❌ User not found in database");
      return ResponseUtil.notFound(event, "User not found");
    }

    // Return enhanced user info with plan information
    const user = await PlanUtil.enhanceUser(userEntity);
    console.log("✅ Returning enhanced user data:", user);

    return ResponseUtil.success(event, { user });
  } catch (error) {
    console.error("💥 Get user info error:", error);
    console.error(
      "💥 Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return ResponseUtil.internalError(event, "Failed to get user info");
  }
};
