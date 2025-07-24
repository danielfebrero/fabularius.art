import { fingerprintCollector } from "@/lib/fingerprint/collector";
import { simpleSessionTracker } from "@/lib/session/simpleSessionTracker";
import { journeyCorrelationService } from "@/lib/session/journeyCorrelation";
import type { FingerprintCollectionResponse } from "@/types/fingerprint";
import type { UserJourney, SessionCorrelation } from "@/types/session";

/**
 * Authentication enhancement with fingerprint integration
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "moderator";
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  fingerprintIds?: string[];
  riskProfile?: {
    level: "low" | "medium" | "high";
    factors: string[];
    lastAssessment: Date;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  fingerprintData?: any;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  securityAlert?: {
    type: "new_device" | "location_change" | "suspicious_activity";
    message: string;
    requiresVerification: boolean;
  };
  fingerprintAnalysis?: {
    isRecognized: boolean;
    confidence: number;
    riskScore: number;
    deviceMatch: boolean;
    locationMatch: boolean;
  };
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  fingerprintData?: any;
}

/**
 * Fingerprint-enhanced authentication service
 */
class FingerprintAuthService {
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private fingerprintCache = new Map<string, FingerprintCollectionResponse>();

  constructor() {
    // Initialize from storage
    this.loadFromStorage();
  }

  /**
   * Enhanced login with fingerprint analysis
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Collect current fingerprint
      const fingerprintResponse = await fingerprintCollector.collect();
      const currentFingerprintId =
        fingerprintResponse.data?.fingerprintId || "unknown";

      // Perform traditional authentication
      const authResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          fingerprintId: currentFingerprintId,
          fingerprintData: fingerprintResponse.data,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        return {
          success: false,
          error: error.message || "Login failed",
        };
      }

      const response: LoginResponse = await authResponse.json();

      if (response.success && response.user && response.token) {
        // Store authentication data
        this.currentUser = response.user;
        this.authToken = response.token;
        this.saveToStorage();

        // Link fingerprint to user session
        simpleSessionTracker.setUserId(response.user.id);

        // Analyze user journey and correlations
        const fingerprintAnalysis = await this.analyzeFingerprintForUser(
          currentFingerprintId,
          response.user
        );

        response.fingerprintAnalysis = fingerprintAnalysis;

        // Check for security alerts
        if (fingerprintAnalysis.riskScore > 0.7) {
          response.securityAlert = {
            type: "suspicious_activity",
            message: "Unusual device or behavior detected",
            requiresVerification: true,
          };
        } else if (!fingerprintAnalysis.deviceMatch) {
          response.securityAlert = {
            type: "new_device",
            message: "Login from new device detected",
            requiresVerification: false,
          };
        }

        // Log successful authentication
        await this.logAuthenticationEvent("login_success", {
          userId: response.user.id,
          fingerprintId: currentFingerprintId,
          riskScore: fingerprintAnalysis.riskScore,
          deviceMatch: fingerprintAnalysis.deviceMatch,
          locationMatch: fingerprintAnalysis.locationMatch,
        });
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error during login",
      };
    }
  }

  /**
   * Enhanced registration with fingerprint capture
   */
  async register(request: RegisterRequest): Promise<LoginResponse> {
    try {
      // Collect fingerprint for new user
      const fingerprintResponse = await fingerprintCollector.collect();
      const fingerprintId =
        fingerprintResponse.data?.fingerprintId || "unknown";

      const authResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          fingerprintId,
          fingerprintData: fingerprintResponse.data,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        return {
          success: false,
          error: error.message || "Registration failed",
        };
      }

      const response: LoginResponse = await authResponse.json();

      if (response.success && response.user && response.token) {
        this.currentUser = response.user;
        this.authToken = response.token;
        this.saveToStorage();

        // Initialize session for new user
        simpleSessionTracker.setUserId(response.user.id);

        // Log registration
        await this.logAuthenticationEvent("register_success", {
          userId: response.user.id,
          fingerprintId,
        });
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error during registration",
      };
    }
  }

  /**
   * Logout with session cleanup
   */
  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clean up local state
      this.currentUser = null;
      this.authToken = null;
      this.clearStorage();

      // End current session
      await simpleSessionTracker.endSession();
    }
  }

  /**
   * Verify fingerprint for additional security
   */
  async verifyFingerprint(): Promise<{
    verified: boolean;
    confidence: number;
    riskScore: number;
  }> {
    try {
      if (!this.currentUser) {
        throw new Error("No authenticated user");
      }

      const fingerprintResponse = await fingerprintCollector.collect();
      const currentFingerprintId =
        fingerprintResponse.data?.fingerprintId || "unknown";

      const response = await fetch("/api/auth/verify-fingerprint", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.currentUser.id,
          fingerprintId: currentFingerprintId,
          fingerprintData: fingerprintResponse.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Fingerprint verification failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Fingerprint verification error:", error);
      return {
        verified: false,
        confidence: 0,
        riskScore: 1,
      };
    }
  }

  /**
   * Analyze fingerprint data for authenticated user
   */
  private async analyzeFingerprintForUser(
    fingerprintId: string,
    user: AuthUser
  ): Promise<NonNullable<LoginResponse["fingerprintAnalysis"]>> {
    try {
      // Check if fingerprint is already associated with user
      const isRecognized =
        user.fingerprintIds?.includes(fingerprintId) || false;

      // Get user journey data
      const journey = await journeyCorrelationService.getUserJourney(
        fingerprintId
      );

      // Calculate confidence and risk scores
      let confidence = 0.5;
      let riskScore = 0.2;
      let deviceMatch = false;
      let locationMatch = true; // Default to true if no location data

      if (journey) {
        // Analyze journey patterns
        const insights =
          await journeyCorrelationService.analyzeCrossSessionInsights(
            fingerprintId
          );

        if (insights) {
          confidence =
            insights.riskAssessment.overallRisk === "low"
              ? 0.9
              : insights.riskAssessment.overallRisk === "medium"
              ? 0.6
              : 0.3;
          riskScore = insights.riskAssessment.fraudRisk;
          deviceMatch = insights.userPattern.deviceConsistency > 0.8;
          locationMatch = insights.userPattern.locationConsistency > 0.7;
        }
      }

      // If fingerprint is recognized, increase confidence
      if (isRecognized) {
        confidence = Math.max(confidence, 0.8);
        riskScore = Math.min(riskScore, 0.3);
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
   * Log authentication events for security monitoring
   */
  private async logAuthenticationEvent(
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await fetch("/api/auth/log-event", {
        method: "POST",
        headers: {
          Authorization: this.authToken ? `Bearer ${this.authToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
          userAgent: navigator.userAgent,
          ipAddress: "0.0.0.0", // Will be set by server
        }),
      });
    } catch (error) {
      console.error("Failed to log authentication event:", error);
    }
  }

  /**
   * Check if current session is still valid
   */
  async validateSession(): Promise<boolean> {
    if (!this.authToken || !this.currentUser) {
      return false;
    }

    try {
      const response = await fetch("/api/auth/validate", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      this.logout();
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.currentUser && this.authToken);
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Link additional fingerprint to current user
   */
  async linkFingerprintToUser(): Promise<boolean> {
    if (!this.currentUser || !this.authToken) {
      return false;
    }

    try {
      const fingerprintResponse = await fingerprintCollector.collect();
      const fingerprintId =
        fingerprintResponse.data?.fingerprintId || "unknown";

      const response = await fetch("/api/auth/link-fingerprint", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.currentUser.id,
          fingerprintId,
          fingerprintData: fingerprintResponse.data,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to link fingerprint:", error);
      return false;
    }
  }

  /**
   * Load authentication state from storage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const userStr = localStorage.getItem("auth_user");
      const token = localStorage.getItem("auth_token");

      if (userStr && token) {
        this.currentUser = JSON.parse(userStr);
        this.authToken = token;
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication state to storage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      if (this.currentUser && this.authToken) {
        localStorage.setItem("auth_user", JSON.stringify(this.currentUser));
        localStorage.setItem("auth_token", this.authToken);
      }
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  }

  /**
   * Clear authentication state from storage
   */
  private clearStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } catch (error) {
      console.error("Failed to clear auth state:", error);
    }
  }
}

// Export singleton instance
export const fingerprintAuth = new FingerprintAuthService();
export { FingerprintAuthService };
