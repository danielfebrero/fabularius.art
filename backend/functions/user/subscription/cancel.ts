import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

interface CancelSubscriptionResponse {
  message: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/subscription/cancel handler called");
  console.log("📋 Event method:", event.httpMethod);

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    console.log("⚡ Handling OPTIONS request");
    return ResponseUtil.noContent(event);
  }

  // Only allow POST method
  if (event.httpMethod !== "POST") {
    console.log("❌ Method not allowed:", event.httpMethod);
    return ResponseUtil.methodNotAllowed(event, "Only POST method allowed");
  }

  try {
    // Validate user session
    console.log("🔑 Validating user session...");
    const validation = await UserAuthMiddleware.validateSession(event);

    if (!validation.isValid || !validation.user) {
      console.log("❌ User session validation failed");
      return ResponseUtil.unauthorized(event, "Invalid session");
    }

    const user = validation.user;
    console.log(`✅ User session valid: ${user.userId}`);

    // Get full user entity to access subscription information
    console.log("📋 Fetching user subscription details...");
    const userEntity = await DynamoDBService.getUserById(user.userId);

    if (!userEntity) {
      console.log("❌ User entity not found");
      return ResponseUtil.unauthorized(event, "User not found");
    }

    // Check if user has an active subscription
    if (!userEntity.plan || userEntity.plan === "free") {
      console.log("❌ User has no active subscription");
      return ResponseUtil.badRequest(event, "No active subscription to cancel");
    }

    if (userEntity.subscriptionStatus === "canceled") {
      console.log("❌ Subscription already canceled");
      return ResponseUtil.badRequest(event, "Subscription is already canceled");
    }

    // TODO: In a real implementation, you would:
    // 1. Call Stripe API to cancel the subscription
    // 2. Handle webhook to update the database
    // For now, we'll simulate by updating the status

    console.log("💳 Canceling subscription...");

    // Update subscription status to canceled
    // Keep the plan active until the end of the billing period
    const updates = {
      subscriptionStatus: "canceled" as const,
      // Keep plan and planEndDate unchanged - user retains access until end of billing period
    };

    await DynamoDBService.updateUser(user.userId, updates);

    console.log("✅ Subscription canceled successfully");

    const response: CancelSubscriptionResponse = {
      message:
        "Subscription canceled successfully. You will retain access to your current plan until the end of your billing period.",
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Error canceling subscription:", error);
    return ResponseUtil.internalError(event, "Failed to cancel subscription");
  }
};
