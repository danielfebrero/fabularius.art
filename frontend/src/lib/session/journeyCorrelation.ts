import {
  UserJourney,
  SessionCorrelation,
  CrossSessionInsights,
  UserSession,
} from "@/types/session";

/**
 * Journey Correlation Service
 * Correlates sessions based on fingerprint similarity and behavioral patterns
 */
class JourneyCorrelationService {
  private correlationCache = new Map<string, SessionCorrelation[]>();
  private journeyCache = new Map<string, UserJourney>();

  /**
   * Correlate sessions for a fingerprint
   */
  async correlateSessionsForFingerprint(
    fingerprintId: string
  ): Promise<SessionCorrelation[]> {
    // Check cache first
    if (this.correlationCache.has(fingerprintId)) {
      return this.correlationCache.get(fingerprintId)!;
    }

    try {
      const response = await fetch("/api/session/correlate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprintIds: [fingerprintId],
          minConfidence: 0.7,
          maxResults: 50,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to correlate sessions: ${response.statusText}`);
      }

      const correlations: SessionCorrelation[] = await response.json();

      // Cache results
      this.correlationCache.set(fingerprintId, correlations);

      return correlations;
    } catch (error) {
      console.error("Journey correlation error:", error);
      return [];
    }
  }

  /**
   * Get user journey for a fingerprint
   */
  async getUserJourney(fingerprintId: string): Promise<UserJourney | null> {
    // Check cache first
    if (this.journeyCache.has(fingerprintId)) {
      return this.journeyCache.get(fingerprintId)!;
    }

    try {
      const response = await fetch(`/api/session/journey/${fingerprintId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No journey found
        }
        throw new Error(`Failed to get journey: ${response.statusText}`);
      }

      const journey: UserJourney = await response.json();

      // Cache result
      this.journeyCache.set(fingerprintId, journey);

      return journey;
    } catch (error) {
      console.error("Get journey error:", error);
      return null;
    }
  }

  /**
   * Create or update user journey
   */
  async updateUserJourney(session: UserSession): Promise<UserJourney> {
    try {
      const response = await fetch("/api/session/journey/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update journey: ${response.statusText}`);
      }

      const journey: UserJourney = await response.json();

      // Update cache
      this.journeyCache.set(session.fingerprintId, journey);

      return journey;
    } catch (error) {
      console.error("Update journey error:", error);
      throw error;
    }
  }

  /**
   * Calculate behavioral similarity between sessions
   */
  calculateBehavioralSimilarity(
    session1: UserSession,
    session2: UserSession
  ): number {
    let similarity = 0;
    let factors = 0;

    // Device similarity
    if (session1.deviceInfo.type === session2.deviceInfo.type) {
      similarity += 0.3;
    }
    if (session1.deviceInfo.os === session2.deviceInfo.os) {
      similarity += 0.2;
    }
    if (session1.deviceInfo.browser === session2.deviceInfo.browser) {
      similarity += 0.2;
    }
    factors += 0.7;

    // Timing patterns (simplified)
    const timeDiff = Math.abs(
      session1.startTime.getTime() - session2.startTime.getTime()
    );
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff < 1) {
      similarity += 0.2; // Same day
    } else if (daysDiff < 7) {
      similarity += 0.1; // Same week
    }
    factors += 0.2;

    // Location similarity (if available)
    if (session1.location.country && session2.location.country) {
      if (session1.location.country === session2.location.country) {
        similarity += 0.1;
      }
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Analyze cross-session insights
   */
  async analyzeCrossSessionInsights(
    fingerprintId: string
  ): Promise<CrossSessionInsights | null> {
    try {
      const journey = await this.getUserJourney(fingerprintId);
      if (!journey || journey.sessions.length < 2) {
        return null;
      }

      const insights: CrossSessionInsights = {
        fingerprintId,
        userPattern: this.analyzeUserPattern(journey),
        behavioralEvolution: this.analyzeBehavioralEvolution(journey),
        anomalies: this.detectAnomalies(journey),
        riskAssessment: this.assessRisk(journey),
      };

      return insights;
    } catch (error) {
      console.error("Cross-session insights error:", error);
      return null;
    }
  }

  /**
   * Analyze user patterns
   */
  private analyzeUserPattern(
    journey: UserJourney
  ): CrossSessionInsights["userPattern"] {
    const sessions = journey.sessions;
    const sessionIntervals: number[] = [];

    // Calculate session intervals
    for (let i = 1; i < sessions.length; i++) {
      const interval =
        sessions[i].startTime.getTime() - sessions[i - 1].startTime.getTime();
      sessionIntervals.push(interval);
    }

    // Determine visit frequency
    let visitFrequency: "daily" | "weekly" | "monthly" | "irregular" =
      "irregular";
    if (sessionIntervals.length > 0) {
      const avgInterval =
        sessionIntervals.reduce((a, b) => a + b, 0) / sessionIntervals.length;
      const days = avgInterval / (1000 * 60 * 60 * 24);

      if (days <= 1.5) visitFrequency = "daily";
      else if (days <= 8) visitFrequency = "weekly";
      else if (days <= 32) visitFrequency = "monthly";
    }

    // Analyze preferred time slots
    const hourCounts = new Array(24).fill(0);
    sessions.forEach((session) => {
      const hour = session.startTime.getHours();
      hourCounts[hour]++;
    });

    const preferredTimeSlots: string[] = [];
    hourCounts.forEach((count, hour) => {
      if (count > sessions.length * 0.2) {
        // More than 20% of sessions
        preferredTimeSlots.push(`${hour}:00-${hour + 1}:00`);
      }
    });

    // Session duration trend
    let sessionDurationTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (sessions.length >= 3) {
      const recentAvg =
        sessions.slice(-3).reduce((sum, s) => sum + (s.duration || 0), 0) / 3;
      const earlierAvg =
        sessions.slice(0, 3).reduce((sum, s) => sum + (s.duration || 0), 0) / 3;

      if (recentAvg > earlierAvg * 1.2) sessionDurationTrend = "increasing";
      else if (recentAvg < earlierAvg * 0.8)
        sessionDurationTrend = "decreasing";
    }

    // Device consistency
    const deviceTypes = new Set(sessions.map((s) => s.deviceInfo.type));
    const deviceConsistency =
      1 - (deviceTypes.size - 1) / Math.max(sessions.length - 1, 1);

    // Location consistency (simplified)
    const countries = new Set(
      sessions.map((s) => s.location.country).filter((c) => c)
    );
    const locationConsistency =
      countries.size <= 1
        ? 1
        : 1 - (countries.size - 1) / Math.max(sessions.length - 1, 1);

    return {
      visitFrequency,
      preferredTimeSlots,
      sessionDurationTrend,
      pageDepthTrend: "stable", // Simplified
      deviceConsistency,
      locationConsistency,
    };
  }

  /**
   * Analyze behavioral evolution
   */
  private analyzeBehavioralEvolution(
    journey: UserJourney
  ): CrossSessionInsights["behavioralEvolution"] {
    return {
      mouseMovementChange: 0, // Would require behavioral data
      typingPatternChange: 0, // Would require behavioral data
      navigationStyleChange: 0, // Would require detailed navigation analysis
      preferenceShift: [], // Would require content preference analysis
    };
  }

  /**
   * Detect anomalies in user journey
   */
  private detectAnomalies(
    journey: UserJourney
  ): CrossSessionInsights["anomalies"] {
    const anomalies: CrossSessionInsights["anomalies"] = [];
    const sessions = journey.sessions;

    // Device change detection
    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1];
      const curr = sessions[i];

      if (prev.deviceInfo.type !== curr.deviceInfo.type) {
        anomalies.push({
          timestamp: curr.startTime,
          type: "device_change",
          severity: "medium",
          description: `Device type changed from ${prev.deviceInfo.type} to ${curr.deviceInfo.type}`,
          confidence: 0.8,
        });
      }

      if (
        prev.location.country &&
        curr.location.country &&
        prev.location.country !== curr.location.country
      ) {
        anomalies.push({
          timestamp: curr.startTime,
          type: "location_change",
          severity: "high",
          description: `Location changed from ${prev.location.country} to ${curr.location.country}`,
          confidence: 0.9,
        });
      }
    }

    return anomalies;
  }

  /**
   * Assess security risks
   */
  private assessRisk(
    journey: UserJourney
  ): CrossSessionInsights["riskAssessment"] {
    let riskScore = 0;
    const sessions = journey.sessions;

    // Check for suspicious patterns
    const hasVPN = sessions.some((s) => s.riskScore > 0.5);
    const hasLocationJumps =
      sessions.length > 1 &&
      new Set(sessions.map((s) => s.location.country).filter((c) => c)).size >
        2;
    const hasDeviceChanges =
      new Set(sessions.map((s) => s.deviceInfo.type)).size > 2;

    if (hasVPN) riskScore += 0.3;
    if (hasLocationJumps) riskScore += 0.4;
    if (hasDeviceChanges) riskScore += 0.2;

    let overallRisk: "low" | "medium" | "high" = "low";
    if (riskScore > 0.6) overallRisk = "high";
    else if (riskScore > 0.3) overallRisk = "medium";

    return {
      overallRisk,
      fraudRisk: Math.min(riskScore, 1),
      botRisk: sessions.some((s) => s.isBot) ? 0.8 : 0.1,
      accountSharingRisk: hasDeviceChanges ? 0.6 : 0.1,
      vpnUsage: hasVPN,
      proxyUsage: false, // Would need proxy detection
    };
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.correlationCache.clear();
    this.journeyCache.clear();
  }

  /**
   * Get correlation statistics
   */
  getCorrelationStats(): { cacheSize: number; journeyCount: number } {
    return {
      cacheSize: this.correlationCache.size,
      journeyCount: this.journeyCache.size,
    };
  }
}

// Export singleton
export const journeyCorrelationService = new JourneyCorrelationService();
export { JourneyCorrelationService };
