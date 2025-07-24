// Backend session types (subset of frontend types for backend use)

export interface CreateSessionRequest {
  fingerprintId: string;
  userId?: string;
  deviceInfo: {
    type: "desktop" | "mobile" | "tablet";
    os: string;
    browser: string;
    screenResolution: string;
    viewport: { width: number; height: number };
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: { lat: number; lon: number };
  };
  referralSource?: {
    type: "direct" | "search" | "social" | "email" | "ads" | "referral";
    source?: string;
    campaign?: string;
    medium?: string;
    term?: string;
  };
  userAgent: string;
  ipAddress: string;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  fingerprintId: string;
  timestamp: Date;
  type:
    | "page_view"
    | "click"
    | "scroll"
    | "form_interaction"
    | "media_view"
    | "download"
    | "exit";
  data: {
    url?: string;
    pageTitle?: string;
    element?: string;
    position?: { x: number; y: number };
    scrollDepth?: number;
    formFields?: string[];
    mediaId?: string;
    mediaType?: "image" | "video" | "audio";
    downloadUrl?: string;
    exitType?: "close" | "navigate" | "timeout";
    duration?: number;
    metadata?: Record<string, any>;
  };
  userAgent: string;
  ipAddress: string;
  referrer?: string;
}

export interface UserSession {
  id: string;
  fingerprintId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  events: SessionEvent[];
  pageViews: number;
  uniquePages: number;
  bounceRate: number;
  conversionEvents: string[];
  deviceInfo: CreateSessionRequest["deviceInfo"];
  location: CreateSessionRequest["location"];
  referralSource: CreateSessionRequest["referralSource"];
  isBot: boolean;
  riskScore: number;
  qualityScore: number;
}

export interface UserJourney {
  id: string;
  fingerprintId: string;
  userId?: string;
  sessions: UserSession[];
  firstSeen: Date;
  lastSeen: Date;
  totalSessions: number;
  totalDuration: number;
  totalPageViews: number;
  averageSessionDuration: number;
  returnVisitor: boolean;
  loyaltyScore: number;
  engagementScore: number;
  conversionFunnel: {
    stage: string;
    timestamp: Date;
    sessionId: string;
    value?: number;
  }[];
  preferences: {
    preferredPages: string[];
    timeOfDay: number[];
    dayOfWeek: number[];
    devicePreference: "desktop" | "mobile" | "tablet";
    contentTypes: string[];
  };
  segments: string[];
  predictedValue: number;
  churnRisk: number;
}

export interface SessionCorrelation {
  primaryFingerprintId: string;
  relatedFingerprintIds: string[];
  confidenceScore: number;
  correlationFactors: {
    behavioral: number;
    temporal: number;
    device: number;
    network: number;
    location: number;
  };
  correlationType: "same_user" | "same_device" | "same_network" | "suspicious";
  firstCorrelated: Date;
  lastCorrelated: Date;
  sessionCount: number;
  riskFlags: string[];
}

export interface CorrelateSessionsRequest {
  fingerprintIds: string[];
  correlationTypes?: SessionCorrelation["correlationType"][];
  minConfidence?: number;
  maxResults?: number;
}

export interface GetJourneyRequest {
  fingerprintId: string;
  userId?: string;
  includeCorrelations?: boolean;
  includeInsights?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SessionQueryFilters {
  fingerprintIds?: string[];
  userIds?: string[];
  sessionIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  deviceTypes?: string[];
  countries?: string[];
  riskScoreRange?: {
    min: number;
    max: number;
  };
  sessionDurationRange?: {
    min: number;
    max: number;
  };
  isBot?: boolean;
  hasConversions?: boolean;
  returnVisitor?: boolean;
}
