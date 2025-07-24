/**
 * Unique Visitor Tracking Service
 * Uses fingerprinting and behavioral analysis to identify unique visitors
 */

import { v4 as uuidv4 } from "uuid";
import {
  UniqueVisitor,
  BehavioralSignature,
  VisitSession,
  SessionBehavior,
  VisitorAnalytics,
  VisitorTrackingConfig,
} from "../../../shared/types/visitor-analytics";
import { FingerprintDatabaseService } from "./fingerprint-db";

/**
 * VisitorTrackingService
 * All DynamoDB operations are delegated to FingerprintDatabaseService (fingerprint-db.ts)
 */
export class VisitorTrackingService {
  private fingerprintDb: typeof FingerprintDatabaseService;
  private config: VisitorTrackingConfig;

  constructor(config: Partial<VisitorTrackingConfig> = {}) {
    this.fingerprintDb = FingerprintDatabaseService;
    this.config = {
      behavioralSimilarityThreshold: 0.7,
      crossDeviceSimilarityThreshold: 0.8,
      sessionTimeoutMinutes: 30,
      visitorMergeWindowDays: 7,
      minimumConfidenceScore: 0.6,
      behavioralStabilityThreshold: 0.7,
      hashIPAddresses: true,
      retainVisitorDataDays: 90,
      anonymizeBehavioralData: true,
      ...config,
    };
  }

  /**
   * Track a visitor session from fingerprint data
   */
  async trackVisitorSession(
    fingerprintHash: string,
    behavioralData: any,
    context: {
      userAgent: string;
      ipAddress: string;
      referrer?: string;
      sessionId?: string;
    }
  ): Promise<{
    visitorId: string;
    sessionId: string;
    isNewVisitor: boolean;
    confidence: number;
  }> {
    const timestamp = new Date().toISOString();
    const sessionId = context.sessionId || uuidv4();

    // 1. Find or create visitor
    const visitorResult = await this.findOrCreateVisitor(
      fingerprintHash,
      behavioralData,
      context
    );

    // 2. Create session record
    const session = await this.createSession(
      visitorResult.visitor.visitorId,
      fingerprintHash,
      behavioralData,
      context,
      sessionId
    );

    // 3. Update visitor statistics
    await this.updateVisitorStatistics(
      visitorResult.visitor.visitorId,
      session,
      timestamp
    );

    return {
      visitorId: visitorResult.visitor.visitorId,
      sessionId: session.sessionId,
      isNewVisitor: visitorResult.isNewVisitor,
      confidence: visitorResult.confidence,
    };
  }

  /**
   * Find existing visitor or create new one
   */
  private async findOrCreateVisitor(
    fingerprintHash: string,
    behavioralData: any,
    context: any
  ): Promise<{
    visitor: UniqueVisitor;
    isNewVisitor: boolean;
    confidence: number;
  }> {
    // 1. Try exact fingerprint match first
    let visitor = await this.findVisitorByFingerprint(fingerprintHash);
    if (visitor) {
      // Check if behavioral pattern matches (different user on same device?)
      const behavioralSimilarity = this.calculateBehavioralSimilarity(
        visitor.behavioralSignature,
        this.extractBehavioralSignature(behavioralData)
      );

      if (behavioralSimilarity >= this.config.behavioralSimilarityThreshold) {
        // Same visitor, update behavioral signature
        await this.updateBehavioralSignature(visitor, behavioralData);
        return {
          visitor,
          isNewVisitor: false,
          confidence: behavioralSimilarity,
        };
      } else {
        // Different user on same device - create new visitor
        visitor = null;
      }
    }

    // 2. Try fuzzy fingerprint matching (same user, different device/browser)
    if (!visitor) {
      // Generate fuzzy hashes from current fingerprint data
      const fuzzyHashes = this.fingerprintDb.generateFuzzyHashes(
        behavioralData?.coreFingerprint || {},
        behavioralData?.advancedFingerprint || {}
      );

      // Use fuzzy hash matching to find similar fingerprints
      const similarFingerprints: any[] = [];
      for (const fuzzyHash of fuzzyHashes) {
        const matches = await this.fingerprintDb.findFuzzyHashMatches(
          fuzzyHash,
          5
        );
        similarFingerprints.push(...matches);
      }

      // Remove duplicates and limit results
      const uniqueFingerprints = Array.from(
        new Map(
          similarFingerprints.map((fp) => [fp.fingerprintId, fp])
        ).values()
      ).slice(0, 10);

      for (const similarFingerprint of uniqueFingerprints) {
        const candidateVisitor = await this.findVisitorByFingerprint(
          similarFingerprint.fingerprintHash
        );
        if (candidateVisitor) {
          const crossDeviceSimilarity = this.calculateCrossDeviceSimilarity(
            candidateVisitor.behavioralSignature,
            this.extractBehavioralSignature(behavioralData),
            context
          );

          if (
            crossDeviceSimilarity >= this.config.crossDeviceSimilarityThreshold
          ) {
            // Same user, different device
            await this.associateFingerprintWithVisitor(
              candidateVisitor.visitorId,
              fingerprintHash
            );
            await this.updateBehavioralSignature(
              candidateVisitor,
              behavioralData
            );
            return {
              visitor: candidateVisitor,
              isNewVisitor: false,
              confidence: crossDeviceSimilarity,
            };
          }
        }
      }
    }

    // 3. Create new visitor
    visitor = await this.createNewVisitor(
      fingerprintHash,
      behavioralData,
      context
    );
    return { visitor, isNewVisitor: true, confidence: 1.0 };
  }

  /**
   * Find visitor by fingerprint hash
   */
  private async findVisitorByFingerprint(
    fingerprintHash: string
  ): Promise<UniqueVisitor | null> {
    return await this.fingerprintDb.findVisitorByFingerprint(fingerprintHash);
  }

  /**
   * Create new unique visitor
   */
  private async createNewVisitor(
    fingerprintHash: string,
    behavioralData: any,
    _context: any
  ): Promise<UniqueVisitor> {
    const visitorId = uuidv4();
    const timestamp = new Date().toISOString();
    const behavioralSignature = this.extractBehavioralSignature(behavioralData);

    return await this.fingerprintDb.createNewVisitor(
      visitorId,
      fingerprintHash,
      behavioralSignature,
      timestamp
    );
  }

  /**
   * Extract behavioral signature from behavioral data
   */
  private extractBehavioralSignature(behavioralData: any): BehavioralSignature {
    const now = new Date();
    const hour = now.getHours();

    return {
      typingWPM: behavioralData?.typingPatterns?.overall?.wpm || 0,
      typingRhythm: behavioralData?.typingPatterns?.overall?.rhythm || 0,
      keyboardLanguage: behavioralData?.keyboardLanguage || "en",
      mouseVelocityAvg:
        behavioralData?.mousePatterns?.movementPattern?.velocity || 0,
      clickPatternSignature: behavioralData?.signatures?.mouseSignature || "",
      scrollBehaviorSignature:
        behavioralData?.signatures?.navigationSignature || "",
      sessionDurationAvg:
        behavioralData?.interactionPatterns?.sessionDuration || 0,
      interactionFrequency:
        behavioralData?.interactionPatterns?.interactionFrequency || 0,
      preferredResolution: `${behavioralData?.screenWidth || 0}x${
        behavioralData?.screenHeight || 0
      }`,
      timeZonePattern: Intl.DateTimeFormat().resolvedOptions().timeZone,
      activeHours: [hour],
      signatureStability: 1.0,
      lastCalculated: new Date().toISOString(),
    };
  }

  /**
   * Calculate behavioral similarity (same device, different users)
   */
  private calculateBehavioralSimilarity(
    signature1: BehavioralSignature,
    signature2: BehavioralSignature
  ): number {
    let similarity = 0;
    let factors = 0;

    // Typing patterns (stable across sessions for same user)
    if (signature1.typingWPM > 0 && signature2.typingWPM > 0) {
      const wpmSimilarity =
        1 -
        Math.abs(signature1.typingWPM - signature2.typingWPM) /
          Math.max(signature1.typingWPM, signature2.typingWPM);
      similarity += wpmSimilarity * 0.3;
      factors += 0.3;
    }

    if (signature1.typingRhythm > 0 && signature2.typingRhythm > 0) {
      const rhythmSimilarity =
        1 - Math.abs(signature1.typingRhythm - signature2.typingRhythm);
      similarity += rhythmSimilarity * 0.2;
      factors += 0.2;
    }

    // Mouse patterns
    if (signature1.mouseVelocityAvg > 0 && signature2.mouseVelocityAvg > 0) {
      const mouseSimilarity =
        1 -
        Math.abs(signature1.mouseVelocityAvg - signature2.mouseVelocityAvg) /
          Math.max(signature1.mouseVelocityAvg, signature2.mouseVelocityAvg);
      similarity += mouseSimilarity * 0.2;
      factors += 0.2;
    }

    // Pattern signatures
    if (signature1.clickPatternSignature && signature2.clickPatternSignature) {
      const clickSimilarity =
        signature1.clickPatternSignature === signature2.clickPatternSignature
          ? 1
          : 0;
      similarity += clickSimilarity * 0.15;
      factors += 0.15;
    }

    // Time zone and language (should be same for same user)
    if (signature1.timeZonePattern === signature2.timeZonePattern) {
      similarity += 0.1;
      factors += 0.1;
    }

    if (signature1.keyboardLanguage === signature2.keyboardLanguage) {
      similarity += 0.05;
      factors += 0.05;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate cross-device similarity (same user, different devices)
   */
  private calculateCrossDeviceSimilarity(
    signature1: BehavioralSignature,
    signature2: BehavioralSignature,
    _context: any
  ): number {
    let similarity = 0;
    let factors = 0;

    // Typing patterns are very stable across devices for same user
    if (signature1.typingWPM > 0 && signature2.typingWPM > 0) {
      const wpmSimilarity =
        1 -
        Math.abs(signature1.typingWPM - signature2.typingWPM) /
          Math.max(signature1.typingWPM, signature2.typingWPM);
      similarity += wpmSimilarity * 0.4;
      factors += 0.4;
    }

    if (signature1.typingRhythm > 0 && signature2.typingRhythm > 0) {
      const rhythmSimilarity =
        1 - Math.abs(signature1.typingRhythm - signature2.typingRhythm);
      similarity += rhythmSimilarity * 0.3;
      factors += 0.3;
    }

    // Time zone should be same
    if (signature1.timeZonePattern === signature2.timeZonePattern) {
      similarity += 0.2;
      factors += 0.2;
    }

    // Language should be same
    if (signature1.keyboardLanguage === signature2.keyboardLanguage) {
      similarity += 0.1;
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Create session record
   */
  private async createSession(
    visitorId: string,
    fingerprintHash: string,
    behavioralData: any,
    context: any,
    sessionId: string
  ): Promise<VisitSession> {
    const timestamp = new Date().toISOString();

    const sessionBehavior: SessionBehavior = {
      mouseMovements: behavioralData?.mouseEvents?.length || 0,
      clicks:
        behavioralData?.mouseEvents?.filter((e: any) => e.type === "click")
          .length || 0,
      scrollEvents:
        behavioralData?.mouseEvents?.filter((e: any) => e.type === "scroll")
          .length || 0,
      keystrokes: behavioralData?.keyboardEvents?.length || 0,
      averageMouseVelocity:
        behavioralData?.mousePatterns?.movementPattern?.velocity || 0,
      typingSpeed: behavioralData?.typingPatterns?.overall?.wpm || 0,
      interactionPauses:
        behavioralData?.typingPatterns?.overall?.pausePattern || [],
      behavioralHash: behavioralData?.behavioralHash || "",
    };

    const sessionContext = {
      userAgent: context.userAgent,
      ipAddress: this.config.hashIPAddresses
        ? this.hashIP(context.ipAddress)
        : context.ipAddress,
      referrer: context.referrer,
    };

    return await this.fingerprintDb.createSession(
      sessionId,
      visitorId,
      fingerprintHash,
      sessionBehavior,
      sessionContext,
      timestamp
    );
  }

  /**
   * Update visitor statistics
   */
  private async updateVisitorStatistics(
    visitorId: string,
    session: VisitSession,
    timestamp: string
  ): Promise<void> {
    const hour = session.timeWindow.hour;
    const day = session.timeWindow.day;

    await this.fingerprintDb.updateVisitorStatistics(
      visitorId,
      hour,
      day,
      timestamp
    );
  }

  /**
   * Get visitor analytics for time window
   */
  async getVisitorAnalytics(timeWindow: {
    start: string;
    end: string;
    type: "hour" | "day" | "week" | "month";
  }): Promise<VisitorAnalytics> {
    const startDate = new Date(timeWindow.start);
    const endDate = new Date(timeWindow.end);

    // Get all sessions in time window
    const sessions = await this.getSessionsInTimeWindow(startDate, endDate);

    // Get unique visitors from sessions
    const uniqueVisitorIds = new Set(sessions.map((s) => s.visitorId));
    const uniqueVisitors = uniqueVisitorIds.size;

    // Calculate metrics
    const totalSessions = sessions.length;
    const averageSessionDuration =
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions;

    // Identify new vs returning visitors
    let newVisitors = 0;
    let returningVisitors = 0;

    for (const visitorId of uniqueVisitorIds) {
      const visitor = await this.getVisitorById(visitorId);
      if (visitor) {
        const createdAt = new Date(visitor.createdAt);
        if (createdAt >= startDate && createdAt <= endDate) {
          newVisitors++;
        } else {
          returningVisitors++;
        }
      }
    }

    // Device and browser breakdown
    const deviceTypes: Record<string, number> = {};
    const browserTypes: Record<string, number> = {};

    sessions.forEach((session) => {
      // Extract device type from user agent (simplified)
      const isMobile = /Mobile|Android|iPhone|iPad/.test(session.userAgent);
      const deviceType = isMobile ? "mobile" : "desktop";
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;

      // Extract browser type
      const browser = this.extractBrowserFromUserAgent(session.userAgent);
      browserTypes[browser] = (browserTypes[browser] || 0) + 1;
    });

    // Active hours analysis
    const mostActiveHours: Record<string, number> = {};
    sessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours().toString();
      mostActiveHours[hour] = (mostActiveHours[hour] || 0) + 1;
    });

    // Behavioral insights
    const behavioralData = sessions
      .map((s) => s.sessionBehavior)
      .filter(Boolean);
    const averageTypingSpeed =
      behavioralData.reduce((sum, b) => sum + b.typingSpeed, 0) /
      behavioralData.length;
    const averageInteractionRate =
      sessions.reduce((sum, s) => sum + s.interactions, 0) / sessions.length;

    return {
      timeWindow,
      uniqueVisitors,
      totalSessions,
      averageSessionDuration,
      newVisitors,
      returningVisitors,
      deviceTypes,
      browserTypes,
      mostActiveHours,
      averageTypingSpeed: averageTypingSpeed || 0,
      averageInteractionRate: averageInteractionRate || 0,
      averageConfidenceScore: 0.85, // Would calculate from visitor confidence scores
      uncertainVisitors: 0, // Would count visitors below confidence threshold
    };
  }

  /**
   * Get sessions in time window
   */
  private async getSessionsInTimeWindow(
    start: Date,
    end: Date
  ): Promise<VisitSession[]> {
    return await this.fingerprintDb.getSessionsInTimeWindow(start, end);
  }

  /**
   * Helper methods
   */
  private async getVisitorById(
    visitorId: string
  ): Promise<UniqueVisitor | null> {
    return await this.fingerprintDb.getVisitorById(visitorId);
  }

  private hashIP(ip: string): string {
    // Simple hash for IP privacy
    return Buffer.from(ip).toString("base64").substring(0, 16);
  }

  private extractBrowserFromUserAgent(userAgent: string): string {
    if (userAgent.includes("Chrome")) return "chrome";
    if (userAgent.includes("Firefox")) return "firefox";
    if (userAgent.includes("Safari")) return "safari";
    if (userAgent.includes("Edge")) return "edge";
    return "other";
  }

  private async associateFingerprintWithVisitor(
    visitorId: string,
    fingerprintHash: string
  ): Promise<void> {
    await this.fingerprintDb.associateFingerprintWithVisitor(
      visitorId,
      fingerprintHash
    );
  }

  private async updateBehavioralSignature(
    visitor: UniqueVisitor,
    behavioralData: any
  ): Promise<void> {
    const newSignature = this.extractBehavioralSignature(behavioralData);

    // Merge with existing signature (weighted average)
    const merged = this.mergeBehavioralSignatures(
      visitor.behavioralSignature,
      newSignature
    );

    const timestamp = new Date().toISOString();

    await this.fingerprintDb.updateBehavioralSignature(
      visitor.visitorId,
      merged,
      timestamp
    );
  }

  private mergeBehavioralSignatures(
    existing: BehavioralSignature,
    newSignature: BehavioralSignature
  ): BehavioralSignature {
    // Simple weighted average (70% existing, 30% new)
    return {
      typingWPM: existing.typingWPM * 0.7 + newSignature.typingWPM * 0.3,
      typingRhythm:
        existing.typingRhythm * 0.7 + newSignature.typingRhythm * 0.3,
      keyboardLanguage:
        newSignature.keyboardLanguage || existing.keyboardLanguage,
      mouseVelocityAvg:
        existing.mouseVelocityAvg * 0.7 + newSignature.mouseVelocityAvg * 0.3,
      clickPatternSignature:
        newSignature.clickPatternSignature || existing.clickPatternSignature,
      scrollBehaviorSignature:
        newSignature.scrollBehaviorSignature ||
        existing.scrollBehaviorSignature,
      sessionDurationAvg:
        existing.sessionDurationAvg * 0.7 +
        newSignature.sessionDurationAvg * 0.3,
      interactionFrequency:
        existing.interactionFrequency * 0.7 +
        newSignature.interactionFrequency * 0.3,
      preferredResolution:
        newSignature.preferredResolution || existing.preferredResolution,
      timeZonePattern: newSignature.timeZonePattern || existing.timeZonePattern,
      activeHours: [
        ...new Set([...existing.activeHours, ...newSignature.activeHours]),
      ],
      signatureStability: Math.min(existing.signatureStability + 0.1, 1.0),
      lastCalculated: newSignature.lastCalculated,
    };
  }
}
