import {
  SessionEvent,
  UserSession,
  SessionMetrics,
  SessionTrackingConfig,
  CreateSessionRequest,
  TrackEventRequest,
  RealTimeSessionUpdate,
  SessionAlert,
} from "@/types/session";
import { fingerprintCollector } from "@/lib/fingerprint/collector";

class SessionTracker {
  private config: SessionTrackingConfig;
  private currentSession: UserSession | null = null;
  private sessionEvents: SessionEvent[] = [];
  private sessionStartTime: Date | null = null;
  private lastEventTime: Date | null = null;
  private eventBuffer: SessionEvent[] = [];
  private isTracking = false;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private fingerprintId: string | null = null;
  private userId: string | null = null;

  // Event listeners
  private eventListeners: Map<string, EventListener> = new Map();
  private observerCleanup: (() => void)[] = [];

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

  /**
   * Initialize session tracking
   */
  async initializeTracking(): Promise<void> {
    if (!this.config.enableTracking || this.isTracking) return;

    try {
      // Collect fingerprint first
      const fingerprint = await fingerprintCollector.collect();
      this.fingerprintId = fingerprint.data?.fingerprintId || "unknown";

      // Check if page should be excluded
      if (this.isPageExcluded()) {
        console.log("SessionTracker: Page excluded from tracking");
        return;
      }

      // Create new session
      await this.createSession();

      // Start event tracking
      this.startEventTracking();

      // Start session monitoring
      this.startSessionMonitoring();

      this.isTracking = true;
      console.log(
        "SessionTracker: Tracking initialized for session",
        this.currentSession?.id
      );
    } catch (error) {
      console.error("SessionTracker: Failed to initialize tracking:", error);
    }
  }

  /**
   * Create a new session
   */
  private async createSession(): Promise<void> {
    if (!this.fingerprintId) return;

    const deviceInfo = this.getDeviceInfo();
    const location = await this.getLocationInfo();
    const referralSource = this.getReferralSource();

    const sessionRequest: CreateSessionRequest = {
      fingerprintId: this.fingerprintId,
      userId: this.userId || undefined,
      deviceInfo,
      location,
      referralSource,
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP(),
    };

    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionRequest),
      });

      if (response.ok) {
        this.currentSession = await response.json();
        this.sessionStartTime = new Date();
        this.lastEventTime = new Date();

        // Track initial page view
        await this.trackEvent({
          type: "page_view",
          data: {
            url: window.location.href,
            pageTitle: document.title,
            metadata: {
              referrer: document.referrer,
            },
          },
        });
      } else {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }
    } catch (error) {
      console.error("SessionTracker: Error creating session:", error);
    }
  }

  /**
   * Track an event
   */
  async trackEvent(
    eventData: Omit<
      SessionEvent,
      | "id"
      | "sessionId"
      | "fingerprintId"
      | "timestamp"
      | "userAgent"
      | "ipAddress"
    >
  ): Promise<void> {
    if (!this.isTracking || !this.currentSession || !this.fingerprintId) return;

    // Check if event type is excluded
    if (this.config.excludedEvents.includes(eventData.type)) return;

    // Apply event sampling
    if (Math.random() > this.config.eventSampling) return;

    const event: Omit<SessionEvent, "id"> = {
      sessionId: this.currentSession.id,
      fingerprintId: this.fingerprintId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP(),
      ...eventData,
    };

    this.sessionEvents.push(event as SessionEvent);
    this.lastEventTime = new Date();

    // Buffer events for batch sending
    this.eventBuffer.push(event as SessionEvent);

    // Send events if buffer is full or real-time tracking is enabled
    if (this.eventBuffer.length >= 10 || this.config.enableRealTimeTracking) {
      await this.flushEventBuffer();
    }

    // Update session timeout
    this.resetSessionTimeout();
  }

  /**
   * Start event tracking listeners
   */
  private startEventTracking(): void {
    // Page visibility tracking
    this.addEventListeners();

    // Performance and navigation tracking
    this.trackPageLoad();

    // User interaction tracking
    this.trackUserInteractions();

    // Scroll tracking
    this.trackScrollBehavior();

    // Form interaction tracking
    this.trackFormInteractions();

    // Media tracking
    this.trackMediaInteractions();

    // Exit tracking
    this.trackPageExit();
  }

  /**
   * Add event listeners
   */
  private addEventListeners(): void {
    // Page visibility
    const visibilityListener = () => {
      this.trackEvent({
        type: "page_view",
        data: {
          url: window.location.href,
          pageTitle: document.title,
          metadata: {
            visibility: document.visibilityState,
          },
        },
      });
    };
    document.addEventListener("visibilitychange", visibilityListener);
    this.eventListeners.set("visibilitychange", visibilityListener);

    // Navigation
    const beforeUnloadListener = () => {
      this.trackEvent({
        type: "exit",
        data: {
          exitType: "navigate",
          duration: this.getSessionDuration(),
        },
      });
      this.flushEventBuffer(true); // Synchronous flush
    };
    window.addEventListener("beforeunload", beforeUnloadListener);
    this.eventListeners.set("beforeunload", beforeUnloadListener);

    // Window focus/blur
    const focusListener = () => {
      this.trackEvent({
        type: "page_view",
        data: {
          url: window.location.href,
          metadata: { focused: true },
        },
      });
    };
    const blurListener = () => {
      this.trackEvent({
        type: "page_view",
        data: {
          url: window.location.href,
          metadata: { focused: false },
        },
      });
    };
    window.addEventListener("focus", focusListener);
    window.addEventListener("blur", blurListener);
    this.eventListeners.set("focus", focusListener);
    this.eventListeners.set("blur", blurListener);
  }

  /**
   * Track user interactions
   */
  private trackUserInteractions(): void {
    if (!this.config.enableBehavioralTracking) return;

    // Click tracking
    const clickListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = event.target as HTMLElement;
      this.trackEvent({
        type: "click",
        data: {
          element: this.getElementPath(target),
          position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
          metadata: {
            tagName: target.tagName,
            className: target.className,
            id: target.id,
            href: target.getAttribute("href"),
          },
        },
      });
    };
    document.addEventListener("click", clickListener);
    this.eventListeners.set("click", clickListener);

    // Mouse movement tracking (sampled)
    let mouseTrackingTimeout: NodeJS.Timeout;
    const mouseMoveListener = (event: MouseEvent) => {
      clearTimeout(mouseTrackingTimeout);
      mouseTrackingTimeout = setTimeout(() => {
        if (Math.random() < 0.1) {
          // Sample 10% of mouse movements
          this.trackEvent({
            type: "scroll", // Reuse scroll type for mouse movement
            data: {
              position: { x: event.clientX, y: event.clientY },
              metadata: { type: "mouse_move" },
            },
          });
        }
      }, 100);
    };
    document.addEventListener("mousemove", mouseMoveListener);
    this.eventListeners.set("mousemove", mouseMoveListener as EventListener);
  }

  /**
   * Track scroll behavior
   */
  private trackScrollBehavior(): void {
    let scrollTimeout: NodeJS.Timeout;
    const scrollListener = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDepth = this.getScrollDepth();
        this.trackEvent({
          type: "scroll",
          data: {
            scrollDepth,
            position: { x: window.scrollX, y: window.scrollY },
          },
        });
      }, 250);
    };
    window.addEventListener("scroll", scrollListener);
    this.eventListeners.set("scroll", scrollListener);
  }

  /**
   * Track form interactions
   */
  private trackFormInteractions(): void {
    const formListener = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formFields = Array.from(form.elements)
        .filter(
          (element): element is HTMLInputElement =>
            element instanceof HTMLInputElement
        )
        .map((input) => input.type);

      this.trackEvent({
        type: "form_interaction",
        data: {
          formFields,
          metadata: {
            action: form.action,
            method: form.method,
            fieldCount: formFields.length,
          },
        },
      });
    };
    document.addEventListener("submit", formListener);
    this.eventListeners.set("submit", formListener);
  }

  /**
   * Track media interactions
   */
  private trackMediaInteractions(): void {
    const mediaSelector = "img, video, audio";

    // Use intersection observer for media views
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const media = entry.target as HTMLMediaElement;
              this.trackEvent({
                type: "media_view",
                data: {
                  mediaType: media.tagName.toLowerCase() as
                    | "image"
                    | "video"
                    | "audio",
                  mediaId: media.id || media.src,
                  metadata: {
                    src: media.src,
                    alt: media.getAttribute("alt"),
                    width: media.clientWidth,
                    height: media.clientHeight,
                  },
                },
              });
            }
          });
        },
        { threshold: 0.5 }
      );

      document.querySelectorAll(mediaSelector).forEach((media) => {
        observer.observe(media);
      });

      this.observerCleanup.push(() => observer.disconnect());
    }
  }

  /**
   * Track page load performance
   */
  private trackPageLoad(): void {
    if ("performance" in window && "getEntriesByType" in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackEvent({
            type: "page_view",
            data: {
              url: window.location.href,
              pageTitle: document.title,
              metadata: {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded:
                  navigation.domContentLoadedEventEnd -
                  navigation.domContentLoadedEventStart,
                firstPaint: this.getFirstPaint(),
                networkType: this.getNetworkType(),
              },
            },
          });
        }
      }, 1000);
    }
  }

  /**
   * Track page exit
   */
  private trackPageExit(): void {
    // This is handled in beforeunload listener
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    // Reset session timeout
    this.resetSessionTimeout();

    // Start heartbeat for real-time updates
    if (this.config.enableRealTimeTracking) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 30000); // 30 seconds
    }
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.endSession("timeout");
    }, this.config.sessionTimeout * 60 * 1000);
  }

  /**
   * Send heartbeat
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.currentSession) return;

    const metrics = this.calculateSessionMetrics();
    const update: RealTimeSessionUpdate = {
      sessionId: this.currentSession.id,
      fingerprintId: this.fingerprintId!,
      event: {
        id: "",
        sessionId: this.currentSession.id,
        fingerprintId: this.fingerprintId!,
        timestamp: new Date(),
        type: "page_view",
        data: {
          url: window.location.href,
          metadata: { heartbeat: true },
        },
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP(),
      },
      metrics,
    };

    try {
      await fetch("/api/session/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch (error) {
      console.error("SessionTracker: Heartbeat failed:", error);
    }
  }

  /**
   * End current session
   */
  async endSession(
    reason: "timeout" | "manual" | "navigate" = "manual"
  ): Promise<void> {
    if (!this.currentSession) return;

    await this.trackEvent({
      type: "exit",
      data: {
        exitType: reason === "manual" ? "close" : reason,
        duration: this.getSessionDuration(),
      },
    });

    // Flush remaining events
    await this.flushEventBuffer(true);

    // Clean up
    this.cleanup();

    // Update session end time on server
    try {
      await fetch(`/api/session/${this.currentSession.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endTime: new Date(),
          reason,
          metrics: this.calculateSessionMetrics(),
        }),
      });
    } catch (error) {
      console.error("SessionTracker: Error ending session:", error);
    }

    this.currentSession = null;
    this.isTracking = false;
  }

  /**
   * Flush event buffer
   */
  private async flushEventBuffer(synchronous = false): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    const request: TrackEventRequest = {
      sessionId: this.currentSession!.id,
      fingerprintId: this.fingerprintId!,
      event: events[0], // Send first event, batch processing on server
    };

    try {
      if (synchronous && "sendBeacon" in navigator) {
        navigator.sendBeacon("/api/session/events", JSON.stringify({ events }));
      } else {
        await fetch("/api/session/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
        });
      }
    } catch (error) {
      console.error("SessionTracker: Error sending events:", error);
      // Re-add events to buffer on failure
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Calculate session metrics
   */
  private calculateSessionMetrics(): SessionMetrics {
    if (!this.currentSession || !this.sessionStartTime) {
      throw new Error("No active session");
    }

    const duration = Date.now() - this.sessionStartTime.getTime();
    const pageViews = this.sessionEvents.filter(
      (e) => e.type === "page_view"
    ).length;
    const uniquePages = new Set(
      this.sessionEvents
        .filter((e) => e.type === "page_view")
        .map((e) => e.data.url)
    ).size;

    return {
      sessionId: this.currentSession.id,
      duration: Math.round(duration / 1000), // seconds
      pageViews,
      uniquePages,
      bounceRate: pageViews <= 1 ? 1 : 0,
      engagementTime: this.calculateEngagementTime(),
      scrollDepth: this.getMaxScrollDepth(),
      clickRate:
        (this.sessionEvents.filter((e) => e.type === "click").length /
          duration) *
        60000, // clicks per minute
      formInteractions: this.sessionEvents.filter(
        (e) => e.type === "form_interaction"
      ).length,
      mediaViews: this.sessionEvents.filter((e) => e.type === "media_view")
        .length,
      conversionEvents: this.sessionEvents.filter(
        (e) => e.data.metadata?.conversion
      ).length,
      exitRate: 0, // Will be calculated on server
      timeToFirstInteraction: this.calculateTimeToFirstInteraction(),
      averageTimeOnPage: duration / Math.max(pageViews, 1),
      navigationPattern: this.analyzeNavigationPattern(),
      qualityIndicators: {
        humanLikeBehavior: this.calculateHumanLikeBehavior(),
        naturalMouseMovement: this.calculateMouseMovementNaturalness(),
        consistentTiming: this.calculateTimingConsistency(),
        deviceStability: this.calculateDeviceStability(),
      },
    };
  }

  // Utility methods
  private isPageExcluded(): boolean {
    return this.config.excludedPages.some((pattern) =>
      window.location.pathname.match(new RegExp(pattern))
    );
  }

  private getDeviceInfo() {
    return {
      type: this.getDeviceType(),
      os: this.getOperatingSystem(),
      browser: this.getBrowserName(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private getDeviceType(): "desktop" | "mobile" | "tablet" {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet";
    if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent
      )
    )
      return "mobile";
    return "desktop";
  }

  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  private async getLocationInfo() {
    // This would typically use a geolocation service
    return undefined;
  }

  private getReferralSource() {
    const referrer = document.referrer;
    if (!referrer) return { type: "direct" as const };

    if (referrer.includes("google."))
      return { type: "search" as const, source: "google" };
    if (referrer.includes("facebook.") || referrer.includes("twitter."))
      return { type: "social" as const, source: referrer };

    return { type: "referral" as const, source: referrer };
  }

  private async getClientIP(): Promise<string> {
    // This would typically be handled by the server
    return "0.0.0.0";
  }

  private getElementPath(element: HTMLElement): string {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      if (current.className)
        selector += `.${current.className.split(" ").join(".")}`;
      path.unshift(selector);
      current = current.parentElement!;
    }

    return path.join(" > ");
  }

  private getScrollDepth(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const windowHeight = window.innerHeight;
    return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
  }

  private getMaxScrollDepth(): number {
    return this.sessionEvents
      .filter((e) => e.type === "scroll")
      .reduce((max, event) => Math.max(max, event.data.scrollDepth || 0), 0);
  }

  private getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000);
  }

  private getFirstPaint(): number {
    if ("getEntriesByType" in performance) {
      const paintEntries = performance.getEntriesByType("paint");
      const firstPaint = paintEntries.find(
        (entry) => entry.name === "first-paint"
      );
      return firstPaint ? firstPaint.startTime : 0;
    }
    return 0;
  }

  private getNetworkType(): string {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || "unknown";
    }
    return "unknown";
  }

  private calculateEngagementTime(): number {
    // Calculate time spent actively engaging with content
    const engagementEvents = this.sessionEvents.filter((e) =>
      ["click", "scroll", "form_interaction"].includes(e.type)
    );

    if (engagementEvents.length < 2) return 0;

    let engagementTime = 0;
    for (let i = 1; i < engagementEvents.length; i++) {
      const timeDiff =
        engagementEvents[i].timestamp.getTime() -
        engagementEvents[i - 1].timestamp.getTime();
      if (timeDiff < 30000) {
        // Less than 30 seconds between interactions
        engagementTime += timeDiff;
      }
    }

    return Math.round(engagementTime / 1000);
  }

  private calculateTimeToFirstInteraction(): number {
    if (!this.sessionStartTime) return 0;

    const firstInteraction = this.sessionEvents.find((e) =>
      ["click", "scroll", "form_interaction"].includes(e.type)
    );

    if (!firstInteraction) return 0;

    return Math.round(
      (firstInteraction.timestamp.getTime() - this.sessionStartTime.getTime()) /
        1000
    );
  }

  private analyzeNavigationPattern():
    | "linear"
    | "exploratory"
    | "goal_oriented"
    | "chaotic" {
    const pageViews = this.sessionEvents.filter((e) => e.type === "page_view");
    if (pageViews.length <= 2) return "linear";

    const uniquePages = new Set(pageViews.map((e) => e.data.url)).size;
    const pageDepth = pageViews.length;

    if (uniquePages / pageDepth > 0.8) return "exploratory";
    if (pageDepth > 5 && uniquePages / pageDepth < 0.5) return "goal_oriented";
    if (uniquePages / pageDepth < 0.3) return "chaotic";

    return "linear";
  }

  private calculateHumanLikeBehavior(): number {
    // Analyze patterns that indicate human vs bot behavior
    const clicks = this.sessionEvents.filter((e) => e.type === "click");
    const scrolls = this.sessionEvents.filter((e) => e.type === "scroll");

    let score = 0.5; // Base score

    // Human-like click patterns
    if (clicks.length > 0) {
      const clickIntervals = clicks
        .slice(1)
        .map(
          (click, i) =>
            click.timestamp.getTime() - clicks[i].timestamp.getTime()
        );
      const avgInterval =
        clickIntervals.reduce((a, b) => a + b, 0) / clickIntervals.length;

      if (avgInterval > 500 && avgInterval < 10000) score += 0.2; // Reasonable click speed
      if (new Set(clickIntervals).size > clickIntervals.length * 0.7)
        score += 0.1; // Variable timing
    }

    // Scroll behavior
    if (scrolls.length > 2) score += 0.2;

    return Math.min(1, score);
  }

  private calculateMouseMovementNaturalness(): number {
    // This would analyze mouse movement patterns for naturalness
    // For now, return a default score
    return 0.8;
  }

  private calculateTimingConsistency(): number {
    // Analyze timing consistency between events
    const events = this.sessionEvents.filter((e) => e.type !== "page_view");
    if (events.length < 3) return 0.5;

    const intervals = events
      .slice(1)
      .map(
        (event, i) => event.timestamp.getTime() - events[i].timestamp.getTime()
      );

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower coefficient of variation indicates more consistent timing
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private calculateDeviceStability(): number {
    // Check for device/browser consistency throughout session
    // For now, return a high score assuming stable device
    return 0.9;
  }

  /**
   * Clean up event listeners and timers
   */
  private cleanup(): void {
    // Clear timers
    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      if (
        event === "scroll" ||
        event === "click" ||
        event === "mousemove" ||
        event === "submit"
      ) {
        document.removeEventListener(event, listener);
      } else {
        window.removeEventListener(event, listener);
      }
    });
    this.eventListeners.clear();

    // Clean up observers
    this.observerCleanup.forEach((cleanup) => cleanup());
    this.observerCleanup = [];
  }

  /**
   * Set user ID for authenticated sessions
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
    if (this.currentSession) {
      this.currentSession.userId = userId || undefined;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): SessionMetrics | null {
    if (!this.currentSession) return null;
    return this.calculateSessionMetrics();
  }

  /**
   * Update tracking configuration
   */
  updateConfig(newConfig: Partial<SessionTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (!newConfig.enableTracking && this.isTracking) {
      this.endSession("manual");
    } else if (newConfig.enableTracking && !this.isTracking) {
      this.initializeTracking();
    }
  }
}

// Create singleton instance
export const sessionTracker = new SessionTracker();

// Export for manual control
export { SessionTracker };
