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
  userId?: string; // If user is authenticated
  startTime: Date;
  endTime?: Date;
  duration?: number;
  events: SessionEvent[];
  pageViews: number;
  uniquePages: number;
  bounceRate: number;
  conversionEvents: string[];
  deviceInfo: {
    type: "desktop" | "mobile" | "tablet";
    os: string;
    browser: string;
    screenResolution: string;
    viewport: { width: number; height: number };
  };
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: { lat: number; lon: number };
  };
  referralSource: {
    type: "direct" | "search" | "social" | "email" | "ads" | "referral";
    source?: string;
    campaign?: string;
    medium?: string;
    term?: string;
  };
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
    timeOfDay: number[]; // Hour preferences 0-23
    dayOfWeek: number[]; // Day preferences 0-6
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

export interface JourneyAnalytics {
  totalJourneys: number;
  activeJourneys: number;
  averageJourneyLength: number;
  topPathways: {
    path: string[];
    count: number;
    conversionRate: number;
  }[];
  dropOffPoints: {
    page: string;
    dropOffRate: number;
    commonNextPages: string[];
  }[];
  conversionFunnels: {
    name: string;
    stages: {
      name: string;
      count: number;
      conversionRate: number;
    }[];
  }[];
  cohortAnalysis: {
    period: string;
    newUsers: number;
    returningUsers: number;
    retentionRate: number;
  }[];
  segmentPerformance: {
    segment: string;
    userCount: number;
    averageValue: number;
    conversionRate: number;
    churnRate: number;
  }[];
}

export interface SessionTrackingConfig {
  enableTracking: boolean;
  trackingLevel: "basic" | "standard" | "detailed";
  privacyMode: boolean;
  sessionTimeout: number; // Minutes
  eventSampling: number; // 0-1, percentage of events to track
  excludedPages: string[];
  excludedEvents: string[];
  enableBehavioralTracking: boolean;
  enableCorrelation: boolean;
  correlationThreshold: number; // 0-1, minimum confidence for correlation
  maxSessionEvents: number;
  enableRealTimeTracking: boolean;
  dataRetentionDays: number;
}

export interface SessionMetrics {
  sessionId: string;
  duration: number;
  pageViews: number;
  uniquePages: number;
  bounceRate: number;
  engagementTime: number;
  scrollDepth: number;
  clickRate: number;
  formInteractions: number;
  mediaViews: number;
  conversionEvents: number;
  exitRate: number;
  timeToFirstInteraction: number;
  averageTimeOnPage: number;
  navigationPattern: "linear" | "exploratory" | "goal_oriented" | "chaotic";
  qualityIndicators: {
    humanLikeBehavior: number;
    naturalMouseMovement: number;
    consistentTiming: number;
    deviceStability: number;
  };
}

export interface CrossSessionInsights {
  fingerprintId: string;
  userPattern: {
    visitFrequency: "daily" | "weekly" | "monthly" | "irregular";
    preferredTimeSlots: string[];
    sessionDurationTrend: "increasing" | "decreasing" | "stable";
    pageDepthTrend: "increasing" | "decreasing" | "stable";
    deviceConsistency: number; // 0-1
    locationConsistency: number; // 0-1
  };
  behavioralEvolution: {
    mouseMovementChange: number;
    typingPatternChange: number;
    navigationStyleChange: number;
    preferenceShift: string[];
  };
  anomalies: {
    timestamp: Date;
    type:
      | "device_change"
      | "location_change"
      | "behavior_change"
      | "suspicious_activity";
    severity: "low" | "medium" | "high";
    description: string;
    confidence: number;
  }[];
  riskAssessment: {
    overallRisk: "low" | "medium" | "high";
    fraudRisk: number;
    botRisk: number;
    accountSharingRisk: number;
    vpnUsage: boolean;
    proxyUsage: boolean;
  };
}

// Real-time tracking interfaces
export interface RealTimeSessionUpdate {
  sessionId: string;
  fingerprintId: string;
  event: SessionEvent;
  metrics: Partial<SessionMetrics>;
  correlations?: SessionCorrelation[];
  insights?: Partial<CrossSessionInsights>;
}

export interface SessionAlert {
  id: string;
  sessionId: string;
  fingerprintId: string;
  type:
    | "fraud_risk"
    | "bot_detected"
    | "unusual_behavior"
    | "correlation_found"
    | "high_value_user";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  requiresAction: boolean;
}

// API interfaces
export interface CreateSessionRequest {
  fingerprintId: string;
  userId?: string;
  deviceInfo: UserSession["deviceInfo"];
  location?: UserSession["location"];
  referralSource?: UserSession["referralSource"];
  userAgent: string;
  ipAddress: string;
}

export interface TrackEventRequest {
  sessionId: string;
  fingerprintId: string;
  event: Omit<SessionEvent, "id" | "timestamp">;
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

export interface CorrelateSessionsRequest {
  fingerprintIds: string[];
  correlationTypes?: SessionCorrelation["correlationType"][];
  minConfidence?: number;
  maxResults?: number;
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
