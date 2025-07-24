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
