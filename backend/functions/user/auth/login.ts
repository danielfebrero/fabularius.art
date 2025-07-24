import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { UserUtil } from "@shared/utils/user";
import {
  UserLoginRequest,
  UserSessionEntity,
  UserLoginResponse,
} from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const SESSION_DURATION_DAYS = 30; // Users get longer sessions than admins
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const FINGERPRINTS_TABLE =
  process.env["FINGERPRINTS_TABLE"] || "dev-pornspot-fingerprints";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: UserLoginRequest = JSON.parse(event.body);

    if (!request.email || !request.password) {
      return ResponseUtil.badRequest(event, "Email and password are required");
    }

    // Validate email format
    if (!UserUtil.validateEmail(request.email)) {
      return ResponseUtil.badRequest(event, "Invalid email format");
    }

    const userEntity = await DynamoDBService.getUserByEmail(request.email);

    if (!userEntity) {
      // Add delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ResponseUtil.unauthorized(event, "Invalid email or password");
    }

    if (!userEntity.isActive) {
      return ResponseUtil.forbidden(event, "Account is disabled");
    }

    // Check if email is verified
    if (!userEntity.isEmailVerified) {
      const errorResponse = ResponseUtil.forbidden(event, "");
      return {
        statusCode: 403,
        headers: errorResponse.headers,
        body: JSON.stringify({
          success: false,
          error: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email address before logging in. Check your inbox for the verification email.",
        }),
      };
    }

    // Check if this is an email provider user with password
    if (userEntity.provider === "google" || !userEntity.passwordHash) {
      return ResponseUtil.badRequest(
        event,
        "This account uses OAuth authentication. Please sign in with Google."
      );
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      userEntity.passwordHash
    );

    if (!isPasswordValid) {
      return ResponseUtil.unauthorized(event, "Invalid email or password");
    }

    // Analyze fingerprint if provided
    let fingerprintAnalysis: UserLoginResponse["fingerprintAnalysis"];
    let securityAlert: UserLoginResponse["securityAlert"];

    if (request.fingerprintId && request.fingerprintData) {
      fingerprintAnalysis = await analyzeFingerprintForLogin(
        request.fingerprintId,
        userEntity,
        request.fingerprintData
      );

      // Check for security concerns
      if (fingerprintAnalysis.riskScore > 0.7) {
        securityAlert = {
          type: "suspicious_activity",
          message:
            "Unusual device or behavior pattern detected. Additional verification may be required.",
          requiresVerification: true,
        };
      } else if (
        !fingerprintAnalysis.deviceMatch &&
        userEntity.fingerprintIds &&
        userEntity.fingerprintIds.length > 0
      ) {
        securityAlert = {
          type: "new_device",
          message:
            "Login detected from a new device. Please verify this is you.",
          requiresVerification: false,
        };
      } else if (!fingerprintAnalysis.locationMatch) {
        securityAlert = {
          type: "location_change",
          message: "Login detected from a new location.",
          requiresVerification: false,
        };
      }

      // Add fingerprint to user's known fingerprints if it's trusted
      if (
        fingerprintAnalysis.riskScore < 0.5 &&
        fingerprintAnalysis.confidence > 0.7
      ) {
        await addFingerprintToUser(userEntity.userId, request.fingerprintId);
      }
    }

    // Update last login timestamp
    await UserUtil.updateLastLogin(userEntity.userId);

    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    const sessionEntity: UserSessionEntity = {
      PK: `SESSION#${sessionId}`,
      SK: "METADATA",
      GSI1PK: "USER_SESSION_EXPIRY",
      GSI1SK: `${expiresAt.toISOString()}#${sessionId}`,
      EntityType: "UserSession",
      sessionId,
      userId: userEntity.userId,
      userEmail: userEntity.email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString(),
      ttl: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp for TTL
    };

    await DynamoDBService.createUserSession(sessionEntity);

    const responseData = {
      user: UserUtil.sanitizeUserForResponse(userEntity),
      sessionId,
      fingerprintAnalysis,
      securityAlert,
    };

    const sessionCookie = UserAuthMiddleware.createSessionCookie(
      sessionId,
      expiresAt.toISOString()
    );

    const successResponse = ResponseUtil.success(event, responseData);
    successResponse.headers = {
      ...successResponse.headers,
      "Set-Cookie": sessionCookie,
    };

    return successResponse;
  } catch (error) {
    console.error("User login error:", error);
    return ResponseUtil.internalError(event, "Login failed");
  }
};

/**
 * Analyze fingerprint for login security
 */
async function analyzeFingerprintForLogin(
  fingerprintId: string,
  user: any,
  fingerprintData: any
): Promise<NonNullable<UserLoginResponse["fingerprintAnalysis"]>> {
  try {
    // Check if fingerprint is recognized for this user
    const isRecognized = user.fingerprintIds?.includes(fingerprintId) || false;

    // Get fingerprint similarity data
    let confidence = isRecognized ? 0.9 : 0.3;
    let riskScore = isRecognized ? 0.1 : 0.5;
    let deviceMatch = isRecognized;
    const locationMatch = true; // Default to true, would be enhanced with geo data

    // Query existing fingerprints for similarity analysis
    if (!isRecognized && user.fingerprintIds?.length > 0) {
      const similarityResults = await analyzeExistingFingerprints(
        fingerprintId,
        user.fingerprintIds,
        fingerprintData
      );

      if (similarityResults.maxSimilarity > 0.8) {
        confidence = 0.7;
        riskScore = 0.3;
        deviceMatch = true;
      } else if (similarityResults.maxSimilarity > 0.6) {
        confidence = 0.5;
        riskScore = 0.4;
      }
    }

    // Analyze device characteristics
    if (fingerprintData) {
      const deviceAnalysis = analyzeDeviceCharacteristics(fingerprintData);
      riskScore = Math.max(riskScore, deviceAnalysis.riskScore);

      if (deviceAnalysis.isSuspicious) {
        confidence = Math.min(confidence, 0.4);
        riskScore = Math.max(riskScore, 0.7);
      }
    }

    return {
      isRecognized,
      confidence,
      riskScore,
      deviceMatch,
      locationMatch,
    };
  } catch (error) {
    console.error("Fingerprint analysis error:", error);
    return {
      isRecognized: false,
      confidence: 0.1,
      riskScore: 0.8,
      deviceMatch: false,
      locationMatch: false,
    };
  }
}

/**
 * Analyze existing fingerprints for similarity
 */
async function analyzeExistingFingerprints(
  _currentFingerprintId: string,
  userFingerprintIds: string[],
  currentFingerprintData: any
): Promise<{ maxSimilarity: number; matchedFingerprintId?: string }> {
  try {
    let maxSimilarity = 0;
    let matchedFingerprintId: string | undefined = undefined;

    // Compare with each existing fingerprint
    for (const existingFingerprintId of userFingerprintIds) {
      try {
        // Get existing fingerprint data
        const existingResult = await dynamoClient.send(
          new GetCommand({
            TableName: FINGERPRINTS_TABLE,
            Key: { pk: `FINGERPRINT#${existingFingerprintId}`, sk: "DATA" },
          })
        );

        if (existingResult.Item) {
          const similarity = calculateFingerprintSimilarity(
            currentFingerprintData,
            existingResult.Item["data"]
          );

          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            matchedFingerprintId = existingFingerprintId;
          }
        }
      } catch (error) {
        console.error(
          `Error comparing with fingerprint ${existingFingerprintId}:`,
          error
        );
      }
    }

    const result: { maxSimilarity: number; matchedFingerprintId?: string } = {
      maxSimilarity,
    };

    if (matchedFingerprintId !== undefined) {
      result.matchedFingerprintId = matchedFingerprintId;
    }

    return result;
  } catch (error) {
    console.error("Error analyzing existing fingerprints:", error);
    return { maxSimilarity: 0 };
  }
}

/**
 * Calculate similarity between two fingerprints
 */
function calculateFingerprintSimilarity(fp1: any, fp2: any): number {
  if (!fp1 || !fp2) return 0;

  let matches = 0;
  let total = 0;

  // Compare core fingerprint components
  const components = ["canvas", "webgl", "audio", "fonts", "css", "timing"];

  for (const component of components) {
    if (fp1[component] && fp2[component]) {
      total++;

      // Simple hash comparison (in production, use more sophisticated comparison)
      if (
        typeof fp1[component] === "object" &&
        typeof fp2[component] === "object"
      ) {
        const hash1 = JSON.stringify(fp1[component]);
        const hash2 = JSON.stringify(fp2[component]);
        if (hash1 === hash2) matches++;
      } else if (fp1[component] === fp2[component]) {
        matches++;
      }
    }
  }

  return total > 0 ? matches / total : 0;
}

/**
 * Analyze device characteristics for suspicious activity
 */
function analyzeDeviceCharacteristics(fingerprintData: any): {
  riskScore: number;
  isSuspicious: boolean;
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Check for automation tools
  if (
    fingerprintData.plugins?.some(
      (p: any) =>
        p.name?.toLowerCase().includes("selenium") ||
        p.name?.toLowerCase().includes("webdriver") ||
        p.name?.toLowerCase().includes("phantom")
    )
  ) {
    factors.push("automation_detected");
    riskScore += 0.5;
  }

  // Check for suspicious user agent
  if (
    fingerprintData.userAgent?.includes("HeadlessChrome") ||
    fingerprintData.userAgent?.includes("PhantomJS")
  ) {
    factors.push("headless_browser");
    riskScore += 0.4;
  }

  // Check for VPN/Proxy indicators
  if (
    fingerprintData.webrtc?.detectedVPN ||
    fingerprintData.network?.hasProxy
  ) {
    factors.push("vpn_proxy_detected");
    riskScore += 0.3;
  }

  // Check for inconsistent data
  if (
    fingerprintData.screen?.width < 100 ||
    fingerprintData.screen?.height < 100
  ) {
    factors.push("invalid_screen_size");
    riskScore += 0.2;
  }

  const isSuspicious = riskScore > 0.4;

  return {
    riskScore: Math.min(riskScore, 1),
    isSuspicious,
    factors,
  };
}

/**
 * Add fingerprint to user's known fingerprints
 */
async function addFingerprintToUser(
  userId: string,
  fingerprintId: string
): Promise<void> {
  try {
    // Get current user data first
    const userEntity = await DynamoDBService.getUserById(userId);
    if (!userEntity) {
      console.error("User not found for fingerprint update");
      return;
    }

    // Add fingerprint to existing array or create new array
    const currentFingerprints = userEntity.fingerprintIds || [];
    if (!currentFingerprints.includes(fingerprintId)) {
      currentFingerprints.push(fingerprintId);

      await DynamoDBService.updateUser(userId, {
        fingerprintIds: currentFingerprints,
      });
    }
  } catch (error) {
    console.error("Error adding fingerprint to user:", error);
  }
}
