/**
 * Visitor Analytics Types
 * Advanced unique visitor tracking using fingerprinting and behavioral analysis
 */

export interface UniqueVisitor {
  visitorId: string; // Generated UUID for this unique visitor
  createdAt: string; // ISO timestamp of first detection
  lastSeenAt: string; // ISO timestamp of last activity

  // Device associations
  associatedFingerprints: string[]; // Array of fingerprint hashes linked to this visitor
  primaryFingerprintHash: string; // Main fingerprint (most stable/recent)

  // Behavioral profile for differentiation
  behavioralSignature: BehavioralSignature;

  // Visit statistics
  visitCount: number; // Number of distinct visits
  totalSessionTime: number; // Cumulative session time in seconds

  // Time window tracking
  hourlyVisits: Record<string, number>; // "YYYY-MM-DD-HH" -> visit count
  dailyVisits: Record<string, number>; // "YYYY-MM-DD" -> visit count

  // Confidence and quality metrics
  confidenceScore: number; // 0-1, how confident we are this is a unique visitor
  lastBehavioralUpdate: string; // When behavioral signature was last updated
}

export interface BehavioralSignature {
  // Typing patterns (stable across sessions)
  typingWPM: number;
  typingRhythm: number;
  keyboardLanguage: string;

  // Mouse/interaction patterns
  mouseVelocityAvg: number;
  clickPatternSignature: string;
  scrollBehaviorSignature: string;

  // Navigation patterns
  sessionDurationAvg: number;
  interactionFrequency: number;

  // Device usage patterns
  preferredResolution: string;
  timeZonePattern: string;
  activeHours: number[]; // Hours of day when active (0-23)

  // Stability indicators
  signatureStability: number; // How consistent the signature is
  lastCalculated: string;
}

export interface VisitSession {
  sessionId: string;
  visitorId: string;
  fingerprintHash: string;

  startTime: string;
  endTime?: string;
  duration?: number; // seconds

  pageViews: number;
  interactions: number;

  // Behavioral data for this session
  sessionBehavior: SessionBehavior;

  // Context
  userAgent: string;
  ipAddress: string; // Hashed for privacy
  referrer?: string;

  timeWindow: {
    hour: string; // "YYYY-MM-DD-HH"
    day: string; // "YYYY-MM-DD"
  };
}

export interface SessionBehavior {
  mouseMovements: number;
  clicks: number;
  scrollEvents: number;
  keystrokes: number;

  averageMouseVelocity: number;
  typingSpeed: number;
  interactionPauses: number[];

  behavioralHash: string; // Quick signature for this session
}

export interface VisitorAnalytics {
  timeWindow: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
    type: "hour" | "day" | "week" | "month";
  };

  uniqueVisitors: number;
  totalSessions: number;
  averageSessionDuration: number;

  // Visitor breakdown
  newVisitors: number;
  returningVisitors: number;

  // Device/browser breakdown
  deviceTypes: Record<string, number>;
  browserTypes: Record<string, number>;

  // Behavioral insights
  mostActiveHours: Record<string, number>; // Hour -> visitor count
  averageTypingSpeed: number;
  averageInteractionRate: number;

  // Quality metrics
  averageConfidenceScore: number;
  uncertainVisitors: number; // Low confidence visitors
}

export interface VisitorMergeCandidate {
  visitorId1: string;
  visitorId2: string;
  similarityScore: number;
  mergeReasons: string[];
  confidence: number;
  suggestedAction: "merge" | "keep_separate" | "investigate";
}

export interface VisitorTrackingConfig {
  // Behavioral similarity thresholds
  behavioralSimilarityThreshold: number; // 0-1, for same device different users
  crossDeviceSimilarityThreshold: number; // 0-1, for same user different devices

  // Time windows
  sessionTimeoutMinutes: number; // When to end a session
  visitorMergeWindowDays: number; // How far back to look for merge candidates

  // Quality control
  minimumConfidenceScore: number; // Below this, mark as uncertain
  behavioralStabilityThreshold: number; // When to trust behavioral signature

  // Privacy settings
  hashIPAddresses: boolean;
  retainVisitorDataDays: number;
  anonymizeBehavioralData: boolean;
}
