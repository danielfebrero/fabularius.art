import {
  SessionEvent,
  SessionTrackingConfig,
  UserSession,
} from "@/types/session";

/**
 * Simplified Session Tracker for Journey Tracking
 */
class SimpleSessionTracker {
  private config: SessionTrackingConfig;
  private currentSession: UserSession | null = null;
  private isTracking = false;
  private fingerprintId: string | null = null;

  constructor(config: Partial<SessionTrackingConfig> = {}) {
    this.config = {
      enableTracking: true,
      trackingLevel: "standard",
      privacyMode: false,
      sessionTimeout: 30,
      eventSampling: 1.0,
      excludedPages: [],
      excludedEvents: [],
      enableBehavioralTracking: true,
      enableCorrelation: true,
      correlationThreshold: 0.7,
      maxSessionEvents: 1000,
      enableRealTimeTracking: true,
      dataRetentionDays: 30,
      ...config,
    };

    if (typeof window !== "undefined") {
      this.initializeTracking();
    }
  }

  async initializeTracking(): Promise<void> {
    if (!this.config.enableTracking) return;

    try {
      // Simple fingerprint generation for demo
      this.fingerprintId = `fp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await this.createSession();
      this.startBasicTracking();
      this.isTracking = true;

      console.log(
        "SimpleSessionTracker: Initialized for session",
        this.currentSession?.id
      );
    } catch (error) {
      console.error("SimpleSessionTracker: Failed to initialize:", error);
    }
  }

  private async createSession(): Promise<void> {
    if (!this.fingerprintId) return;

    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fingerprintId: this.fingerprintId,
      startTime: new Date(),
      events: [],
      pageViews: 0,
      uniquePages: 1,
      bounceRate: 0,
      conversionEvents: [],
      deviceInfo: {
        type: this.getDeviceType(),
        os: navigator.platform,
        browser: this.getBrowserName(),
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      location: {},
      referralSource: {
        type: "direct",
      },
      isBot: false,
      riskScore: 0.1,
      qualityScore: 0.9,
    };

    // Track initial page view
    await this.trackEvent({
      type: "page_view",
      data: {
        url: window.location.href,
        pageTitle: document.title,
      },
    });
  }

  private async trackEvent(eventData: Partial<SessionEvent>): Promise<void> {
    if (!this.isTracking || !this.currentSession || !this.fingerprintId) return;

    const event: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.currentSession.id,
      fingerprintId: this.fingerprintId,
      timestamp: new Date(),
      type: eventData.type || "page_view",
      data: eventData.data || {},
      userAgent: navigator.userAgent,
      ipAddress: "0.0.0.0", // Would be set by server
      referrer: document.referrer,
    };

    this.currentSession.events.push(event);
    this.currentSession.pageViews++;

    // Send to backend (simplified)
    try {
      await fetch("/api/session/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: [event] }),
      });
    } catch (error) {
      console.error("Failed to send event:", error);
    }
  }

  private startBasicTracking(): void {
    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      this.trackEvent({
        type: "page_view",
        data: {
          url: window.location.href,
          metadata: {
            visibility: document.visibilityState,
          },
        },
      });
    });

    // Track page unload
    window.addEventListener("beforeunload", () => {
      this.trackEvent({
        type: "exit",
        data: {
          exitType: "navigate",
          duration: this.getSessionDuration(),
        },
      });
    });

    // Track clicks (simplified)
    document.addEventListener("click", () => {
      this.trackEvent({
        type: "click",
        data: {
          url: window.location.href,
        },
      });
    });
  }

  private getDeviceType(): "desktop" | "mobile" | "tablet" {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return "tablet";
    if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
    return "desktop";
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  private getSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Math.round(
      (Date.now() - this.currentSession.startTime.getTime()) / 1000
    );
  }

  // Public methods
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  setUserId(userId: string): void {
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = this.getSessionDuration();

    try {
      await fetch(`/api/session/${this.currentSession.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.currentSession.id,
          endTime: this.currentSession.endTime,
          duration: this.currentSession.duration,
        }),
      });
    } catch (error) {
      console.error("Failed to end session:", error);
    }

    this.currentSession = null;
    this.isTracking = false;
  }
}

// Export singleton
export const simpleSessionTracker = new SimpleSessionTracker();
export { SimpleSessionTracker };
