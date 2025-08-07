import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { ResponseUtil } from "@shared/utils/response";
import { OAuthUserUtil } from "@shared/utils/oauth-user";
import { ParameterStoreService } from "@shared/utils/parameters";
import { SessionUtil } from "@shared/utils/session";
import { GoogleTokenResponse, GoogleOAuthUserInfo } from "@shared/types";

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

    // Parse request body (JSON from frontend API call)
    let requestBody: any = {};
    try {
      if (event.body) {
        requestBody = JSON.parse(event.body);
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return ResponseUtil.badRequest(event, "Invalid request body");
    }

    // Extract OAuth parameters from request body
    const code = requestBody.code;
    const state = requestBody.state;
    const error = requestBody.error;

    // Handle OAuth errors from Google
    if (error) {
      console.error("OAuth error from Google:", error);
      return ResponseUtil.badRequest(
        event,
        error === "access_denied"
          ? "User cancelled Google authentication"
          : "OAuth authentication failed"
      );
    }

    // Validate required parameters
    if (!code) {
      console.error("Missing authorization code in OAuth callback");
      return ResponseUtil.badRequest(event, "Missing authorization code");
    }

    // Validate state parameter for CSRF protection
    if (!state) {
      console.error("Missing state parameter in OAuth callback");
      return ResponseUtil.badRequest(event, "Invalid request state");
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
      return ResponseUtil.badRequest(
        event,
        "Failed to authenticate with Google"
      );
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
        ...(payload.picture && { profilePicture: payload.picture }),
      };
    } catch (verifyError) {
      console.error("Failed to verify Google ID token:", verifyError);
      return ResponseUtil.badRequest(event, "Invalid authentication token");
    }

    console.log("Google user info verified:", {
      googleId: googleUserInfo.googleId,
      email: googleUserInfo.email,
    });

    // Create or link Google user account
    let userId: string;
    let isNewUser: boolean;
    try {
      const result = await OAuthUserUtil.createOrLinkGoogleUser(
        googleUserInfo.googleId,
        googleUserInfo.email
      );

      userId = result.userId;
      isNewUser = result.isNewUser;
    } catch (userError: any) {
      console.error("Failed to create or link Google user:", userError);
      return ResponseUtil.badRequest(
        event,
        userError.message || "Failed to create user account"
      );
    }

    console.log("User account processed:", { userId, isNewUser });

    // Create user session with auto sign-in (OAuth user's last login is updated in updateLastLogin)
    const sessionResult = await SessionUtil.createUserSession({
      userId,
      userEmail: googleUserInfo.email,
      updateLastLogin: true,
    });

    console.log("OAuth session created successfully:", sessionResult.sessionId);

    // Return success response with user data and redirect URL
    const response = ResponseUtil.success(event, {
      user: {
        userId,
        email: googleUserInfo.email,
        isEmailVerified: true,
      },
      redirectUrl: `/auth/success${isNewUser ? "?new_user=true" : ""}`,
    });

    response.headers = {
      ...response.headers,
      "Set-Cookie": sessionResult.sessionCookie,
    };

    console.log("OAuth flow completed successfully");

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return ResponseUtil.badRequest(event, "Authentication failed");
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
