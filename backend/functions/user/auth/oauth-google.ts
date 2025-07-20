import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import { ResponseUtil } from "@shared/utils/response";
import { OAuthUserUtil } from "@shared/utils/oauth-user";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ParameterStoreService } from "@shared/utils/parameters";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import {
  GoogleTokenResponse,
  GoogleOAuthUserInfo,
  UserSessionEntity,
} from "@shared/types";

const SESSION_DURATION_DAYS = 30;

// Google OAuth configuration from environment variables
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];

// Validate required environment variables (GOOGLE_CLIENT_SECRET will be validated in handler)
if (!GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}

/**
 * Google OAuth callback handler
 * Handles the OAuth flow after user grants permission in Google
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }
  console.log("Google OAuth callback handler started");
  console.log("Query parameters:", event.queryStringParameters);

  try {
    // Fetch Google client secret and frontend URL from Parameter Store
    const [GOOGLE_CLIENT_SECRET, frontendUrl] = await Promise.all([
      ParameterStoreService.getGoogleClientSecret(),
      ParameterStoreService.getFrontendUrl(),
    ]);

    // Use frontend URL for redirect URI (matching what was used to initiate OAuth)
    const redirectUri = `${frontendUrl}/auth/oauth/callback`;
    console.log("Using redirect URI:", redirectUri);

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Parse POST body data
    let postData: any = {};
    try {
      if (event.body) {
        // Handle both JSON and URL-encoded form data
        if (
          event.headers["content-type"]?.includes("application/json") ||
          event.headers["Content-Type"]?.includes("application/json")
        ) {
          postData = JSON.parse(event.body);
        } else {
          // Parse URL-encoded form data
          const params = new URLSearchParams(event.body);
          postData = Object.fromEntries(params.entries());
        }
      }
    } catch (parseError) {
      console.error("Failed to parse POST body:", parseError);
    }

    // Extract OAuth parameters from POST data
    const code = postData["code"];
    const state = postData["state"];
    const error = postData["error"];

    // Handle OAuth errors from Google
    if (error) {
      console.error("OAuth error from Google:", error);
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        error === "access_denied"
          ? "User cancelled Google authentication"
          : "OAuth authentication failed"
      )}`;

      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    // Validate required parameters
    if (!code) {
      console.error("Missing authorization code in OAuth callback");
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        "Missing authorization code"
      )}`;
      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    // Validate state parameter for CSRF protection
    if (!state) {
      console.error("Missing state parameter in OAuth callback");
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        "Invalid request state"
      )}`;
      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    console.log("Exchanging authorization code for tokens");

    // Exchange authorization code for tokens
    let tokenResponse: GoogleTokenResponse;
    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.id_token) {
        throw new Error("Missing required tokens in Google response");
      }

      tokenResponse = {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        expires_in: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        token_type: tokens.token_type || "Bearer",
        scope: tokens.scope || "",
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      };
    } catch (tokenError) {
      console.error(
        "Failed to exchange authorization code for tokens:",
        tokenError
      );
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        "Failed to authenticate with Google"
      )}`;
      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    console.log("Verifying Google ID token");

    // Verify and decode the ID token
    let googleUserInfo: GoogleOAuthUserInfo;
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokenResponse.id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new Error("Invalid Google ID token payload");
      }

      // Verify email is verified in Google
      if (!payload.email_verified) {
        throw new Error("Google email not verified");
      }

      googleUserInfo = {
        googleId: payload.sub,
        email: payload.email,
        ...(payload.given_name && { firstName: payload.given_name }),
        ...(payload.family_name && { lastName: payload.family_name }),
        ...(payload.picture && { profilePicture: payload.picture }),
      };
    } catch (verifyError) {
      console.error("Failed to verify Google ID token:", verifyError);
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        "Invalid authentication token"
      )}`;
      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    console.log("Google user info verified:", {
      googleId: googleUserInfo.googleId,
      email: googleUserInfo.email,
      firstName: googleUserInfo.firstName,
      lastName: googleUserInfo.lastName,
    });

    // Create or link Google user account
    let userId: string;
    let isNewUser: boolean;
    try {
      const result = await OAuthUserUtil.createOrLinkGoogleUser(
        googleUserInfo.googleId,
        googleUserInfo.email,
        googleUserInfo.firstName,
        googleUserInfo.lastName
      );

      userId = result.userId;
      isNewUser = result.isNewUser;
    } catch (userError: any) {
      console.error("Failed to create or link Google user:", userError);
      const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
        userError.message || "Failed to create user account"
      )}`;
      return ResponseUtil.redirect(event, errorRedirectUrl);
    }

    console.log("User account processed:", { userId, isNewUser });

    // Update last login timestamp
    await OAuthUserUtil.updateLastLogin(userId);

    // Create user session
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
      userId,
      userEmail: googleUserInfo.email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString(),
      ttl: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp for TTL
    };

    await DynamoDBService.createUserSession(sessionEntity);

    console.log("Session created successfully:", sessionId);

    // Create session cookie
    const sessionCookie = UserAuthMiddleware.createSessionCookie(
      sessionId,
      expiresAt.toISOString()
    );

    // Redirect to frontend success page
    const successRedirectUrl = `${frontendUrl}/auth/success${
      isNewUser ? "?new_user=true" : ""
    }`;

    const response = ResponseUtil.redirect(event, successRedirectUrl);
    response.headers = {
      ...response.headers,
      "Set-Cookie": sessionCookie,
    };

    console.log(
      "OAuth flow completed successfully, redirecting to:",
      successRedirectUrl
    );

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const frontendUrl = await ParameterStoreService.getFrontendUrl();
    const errorRedirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
      "Authentication failed"
    )}`;
    return ResponseUtil.redirect(event, errorRedirectUrl);
  }
};

/**
 * Helper function to get detailed user profile from Google People API
 * This is optional and can provide additional profile information
 */
export const getGoogleUserProfile = async (
  accessToken: string
): Promise<any> => {
  try {
    const people = google.people({ version: "v1" });

    const response = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses,photos,phoneNumbers,addresses",
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch Google user profile:", error);
    return null;
  }
};

/**
 * Helper function to validate Google access token
 */
export const validateGoogleAccessToken = async (
  accessToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      return false;
    }

    const tokenInfo = await response.json();

    // Verify the token is for our application
    return tokenInfo.audience === GOOGLE_CLIENT_ID;
  } catch (error) {
    console.error("Failed to validate Google access token:", error);
    return false;
  }
};
