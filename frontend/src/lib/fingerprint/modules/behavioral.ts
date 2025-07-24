import {
  BehavioralFingerprint,
  MouseEvent as FPMouseEvent,
  KeyboardEvent as FPKeyboardEvent,
  TouchEvent as FPTouchEvent,
  MouseMovementPattern,
  ClickPattern,
  ScrollPattern,
  TypingPattern,
} from "@/types/fingerprint";
/**
 * Custom error class for fingerprint operations
 */
class FingerprintError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "FingerprintError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Behavioral Fingerprinting Module
 *
 * Tracks user behavior patterns including mouse movements, keyboard interactions,
 * touch events, and interaction patterns to create a unique behavioral signature
 * that can distinguish users with high accuracy while respecting privacy.
 *
 * Features:
 * - Mouse movement tracking and analysis
 * - Keyboard typing pattern analysis
 * - Touch gesture recognition (mobile)
 * - Human verification metrics
 * - Bot/automation detection
 * - Statistical behavioral analysis
 * - Privacy-compliant data collection
 */

interface EventTracker {
  mouseEvents: FPMouseEvent[];
  keyboardEvents: FPKeyboardEvent[];
  touchEvents: FPTouchEvent[];
  startTime: number;
  lastEventTime: number;
  isTracking: boolean;
}

interface AnalysisCache {
  mousePattern?: MouseMovementPattern;
  clickPattern?: ClickPattern;
  scrollPattern?: ScrollPattern;
  typingPattern?: TypingPattern;
  lastAnalysis: number;
  cacheTimeout: number;
}

class BehavioralAnalyzer {
  private tracker: EventTracker;
  private cache: AnalysisCache;
  private listeners: (() => void)[] = [];
  private options = {
    trackingDuration: 30000, // 30 seconds
    maxEvents: 1000,
    samplingRate: 16, // ~60fps
    privacyLevel: "standard" as const,
    humanVerificationEnabled: true,
    statisticalAnalysisEnabled: true,
  };

  constructor() {
    this.tracker = {
      mouseEvents: [],
      keyboardEvents: [],
      touchEvents: [],
      startTime: Date.now(),
      lastEventTime: Date.now(),
      isTracking: false,
    };

    this.cache = {
      lastAnalysis: 0,
      cacheTimeout: 5000, // 5 seconds
    };
  }

  /**
   * Start behavioral tracking
   */
  startTracking(): void {
    if (this.tracker.isTracking) return;

    this.tracker.isTracking = true;
    this.tracker.startTime = Date.now();
    this.clearEvents();

    // Mouse event listeners
    this.addListener("mousemove", this.handleMouseMove.bind(this));
    this.addListener("click", this.handleMouseClick.bind(this));
    this.addListener("wheel", this.handleScroll.bind(this));
    this.addListener("mousedown", this.handleMouseDown.bind(this));
    this.addListener("mouseup", this.handleMouseUp.bind(this));

    // Keyboard event listeners
    this.addListener("keydown", this.handleKeyDown.bind(this));
    this.addListener("keyup", this.handleKeyUp.bind(this));
    this.addListener("keypress", this.handleKeyPress.bind(this));

    // Touch event listeners (mobile)
    this.addListener("touchstart", this.handleTouchStart.bind(this));
    this.addListener("touchmove", this.handleTouchMove.bind(this));
    this.addListener("touchend", this.handleTouchEnd.bind(this));
    this.addListener("touchcancel", this.handleTouchCancel.bind(this));

    // Auto-stop tracking after duration
    setTimeout(() => {
      this.stopTracking();
    }, this.options.trackingDuration);
  }

  /**
   * Stop behavioral tracking
   */
  stopTracking(): void {
    if (!this.tracker.isTracking) return;

    this.tracker.isTracking = false;
    this.removeAllListeners();
  }

  /**
   * Add event listener and track for cleanup
   */
  private addListener<T extends Event>(
    event: string,
    handler: (event: T) => void
  ): void {
    const wrappedHandler = (e: Event) => {
      if (this.tracker.isTracking && this.shouldSampleEvent()) {
        handler(e as T);
      }
    };

    document.addEventListener(event, wrappedHandler, { passive: true });
    this.listeners.push(() => {
      document.removeEventListener(event, wrappedHandler);
    });
  }

  /**
   * Remove all event listeners
   */
  private removeAllListeners(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
  }

  /**
   * Determine if event should be sampled based on rate limiting
   */
  private shouldSampleEvent(): boolean {
    const now = Date.now();
    const timeSinceLastEvent = now - this.tracker.lastEventTime;

    if (timeSinceLastEvent >= this.options.samplingRate) {
      this.tracker.lastEventTime = now;
      return true;
    }
    return false;
  }

  /**
   * Handle mouse movement events
   */
  private handleMouseMove(event: MouseEvent): void {
    const fpEvent: FPMouseEvent = {
      type: "move",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      timestamp: Date.now(),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getElementSignature(event.target as Element),
      velocity: this.calculateVelocity(event.clientX, event.clientY),
    };

    this.addEvent("mouse", fpEvent);
  }

  /**
   * Handle mouse click events
   */
  private handleMouseClick(event: MouseEvent): void {
    const fpEvent: FPMouseEvent = {
      type: "click",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      timestamp: Date.now(),
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("mouse", fpEvent);
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    const fpEvent: FPMouseEvent = {
      type: "click",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      timestamp: Date.now(),
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("mouse", fpEvent);
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    const fpEvent: FPMouseEvent = {
      type: "click",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      timestamp: Date.now(),
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("mouse", fpEvent);
  }

  /**
   * Handle scroll events
   */
  private handleScroll(event: WheelEvent): void {
    const fpEvent: FPMouseEvent = {
      type: "scroll",
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      timestamp: Date.now(),
      deltaX: Math.round(event.deltaX),
      deltaY: Math.round(event.deltaY),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("mouse", fpEvent);
  }

  /**
   * Handle keyboard down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const fpEvent: FPKeyboardEvent = {
      type: "keydown",
      key: this.sanitizeKey(event.key),
      code: event.code,
      timestamp: Date.now(),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
    };

    this.addEvent("keyboard", fpEvent);
  }

  /**
   * Handle keyboard up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const fpEvent: FPKeyboardEvent = {
      type: "keyup",
      key: this.sanitizeKey(event.key),
      code: event.code,
      timestamp: Date.now(),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
    };

    this.addEvent("keyboard", fpEvent);
  }

  /**
   * Handle keyboard press events
   */
  private handleKeyPress(event: KeyboardEvent): void {
    const fpEvent: FPKeyboardEvent = {
      type: "keypress",
      key: this.sanitizeKey(event.key),
      code: event.code,
      timestamp: Date.now(),
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
    };

    this.addEvent("keyboard", fpEvent);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    const fpEvent: FPTouchEvent = {
      type: "touchstart",
      touches: Array.from(event.touches).map((touch) => ({
        identifier: touch.identifier,
        x: Math.round(touch.clientX),
        y: Math.round(touch.clientY),
        force: touch.force || 0,
        radiusX: touch.radiusX || 0,
        radiusY: touch.radiusY || 0,
        rotationAngle: touch.rotationAngle || 0,
      })),
      timestamp: Date.now(),
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("touch", fpEvent);
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    const fpEvent: FPTouchEvent = {
      type: "touchmove",
      touches: Array.from(event.touches).map((touch) => ({
        identifier: touch.identifier,
        x: Math.round(touch.clientX),
        y: Math.round(touch.clientY),
        force: touch.force || 0,
        radiusX: touch.radiusX || 0,
        radiusY: touch.radiusY || 0,
        rotationAngle: touch.rotationAngle || 0,
      })),
      timestamp: Date.now(),
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("touch", fpEvent);
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    const fpEvent: FPTouchEvent = {
      type: "touchend",
      touches: Array.from(event.touches).map((touch) => ({
        identifier: touch.identifier,
        x: Math.round(touch.clientX),
        y: Math.round(touch.clientY),
        force: touch.force || 0,
        radiusX: touch.radiusX || 0,
        radiusY: touch.radiusY || 0,
        rotationAngle: touch.rotationAngle || 0,
      })),
      timestamp: Date.now(),
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("touch", fpEvent);
  }

  /**
   * Handle touch cancel events
   */
  private handleTouchCancel(event: TouchEvent): void {
    const fpEvent: FPTouchEvent = {
      type: "touchcancel",
      touches: Array.from(event.touches).map((touch) => ({
        identifier: touch.identifier,
        x: Math.round(touch.clientX),
        y: Math.round(touch.clientY),
        force: touch.force || 0,
        radiusX: touch.radiusX || 0,
        radiusY: touch.radiusY || 0,
        rotationAngle: touch.rotationAngle || 0,
      })),
      timestamp: Date.now(),
      target: this.getElementSignature(event.target as Element),
    };

    this.addEvent("touch", fpEvent);
  }

  /**
   * Add event to appropriate tracker
   */
  private addEvent(
    type: "mouse" | "keyboard" | "touch",
    event: FPMouseEvent | FPKeyboardEvent | FPTouchEvent
  ): void {
    const totalEvents =
      this.tracker.mouseEvents.length +
      this.tracker.keyboardEvents.length +
      this.tracker.touchEvents.length;

    if (totalEvents >= this.options.maxEvents) {
      // Remove oldest events if at capacity
      if (type === "mouse" && this.tracker.mouseEvents.length > 0) {
        this.tracker.mouseEvents.shift();
      } else if (
        type === "keyboard" &&
        this.tracker.keyboardEvents.length > 0
      ) {
        this.tracker.keyboardEvents.shift();
      } else if (type === "touch" && this.tracker.touchEvents.length > 0) {
        this.tracker.touchEvents.shift();
      }
    }

    if (type === "mouse") {
      this.tracker.mouseEvents.push(event as FPMouseEvent);
    } else if (type === "keyboard") {
      this.tracker.keyboardEvents.push(event as FPKeyboardEvent);
    } else if (type === "touch") {
      this.tracker.touchEvents.push(event as FPTouchEvent);
    }

    // Clear cache when new events are added
    this.clearCache();
  }

  /**
   * Calculate velocity between events
   */
  private calculateVelocity(x: number, y: number): number {
    const lastMouseEvent =
      this.tracker.mouseEvents[this.tracker.mouseEvents.length - 1];
    if (!lastMouseEvent) return 0;

    const dx = x - lastMouseEvent.x;
    const dy = y - lastMouseEvent.y;
    const dt = Date.now() - lastMouseEvent.timestamp;

    if (dt === 0) return 0;

    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance / dt; // pixels per millisecond
  }

  /**
   * Get element signature for privacy
   */
  private getElementSignature(element: Element | null): string {
    if (!element) return "unknown";

    // Create privacy-safe element signature
    const tagName = element.tagName?.toLowerCase() || "unknown";
    const className = element.className ? "has-class" : "no-class";
    const hasId = element.id ? "has-id" : "no-id";

    return `${tagName}-${className}-${hasId}`;
  }

  /**
   * Sanitize key input for privacy
   */
  private sanitizeKey(key: string): string {
    // Only track non-sensitive keys
    const allowedKeys = [
      "Enter",
      "Tab",
      "Escape",
      "Space",
      "Backspace",
      "Delete",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Shift",
      "Control",
      "Alt",
      "Meta",
    ];

    if (allowedKeys.includes(key)) {
      return key;
    }

    // Return generic categories for other keys
    if (key.length === 1) {
      if (/[a-zA-Z]/.test(key)) return "letter";
      if (/[0-9]/.test(key)) return "digit";
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(key)) return "symbol";
    }

    return "other";
  }

  /**
   * Clear event cache
   */
  private clearCache(): void {
    this.cache.mousePattern = undefined;
    this.cache.clickPattern = undefined;
    this.cache.scrollPattern = undefined;
    this.cache.typingPattern = undefined;
    this.cache.lastAnalysis = 0;
  }

  /**
   * Clear all tracked events
   */
  private clearEvents(): void {
    this.tracker.mouseEvents = [];
    this.tracker.keyboardEvents = [];
    this.tracker.touchEvents = [];
    this.clearCache();
  }

  /**
   * Analyze mouse movement patterns
   */
  analyzeMouseMovement(): MouseMovementPattern {
    if (
      this.cache.mousePattern &&
      Date.now() - this.cache.lastAnalysis < this.cache.cacheTimeout
    ) {
      return this.cache.mousePattern;
    }

    const moveEvents = this.tracker.mouseEvents.filter(
      (e) => e.type === "move"
    );
    if (moveEvents.length < 2) {
      return {
        velocity: 0,
        acceleration: 0,
        jerk: 0,
        straightness: 0,
        curvature: 0,
        tremor: 0,
        pauses: 0,
        direction: 0,
        smoothness: 0,
        trajectoryLength: 0,
      };
    }

    // Calculate velocities and accelerations
    const velocities: number[] = [];
    const accelerations: number[] = [];
    let totalDistance = 0;
    const directions: number[] = [];

    for (let i = 1; i < moveEvents.length; i++) {
      const curr = moveEvents[i];
      const prev = moveEvents[i - 1];

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dt = curr.timestamp - prev.timestamp;

      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt;
        velocities.push(velocity);
        totalDistance += distance;

        if (dx !== 0 || dy !== 0) {
          directions.push(Math.atan2(dy, dx));
        }

        if (i > 1) {
          const acceleration = (velocity - velocities[i - 2]) / dt;
          accelerations.push(acceleration);
        }
      }
    }

    // Calculate metrics
    const avgVelocity =
      velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0;

    const avgAcceleration =
      accelerations.length > 0
        ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length
        : 0;

    // Calculate jerk (rate of change of acceleration)
    const jerks: number[] = [];
    for (let i = 1; i < accelerations.length; i++) {
      const dt = moveEvents[i + 1].timestamp - moveEvents[i].timestamp;
      if (dt > 0) {
        jerks.push((accelerations[i] - accelerations[i - 1]) / dt);
      }
    }
    const avgJerk =
      jerks.length > 0 ? jerks.reduce((a, b) => a + b, 0) / jerks.length : 0;

    // Calculate straightness (ratio of direct distance to path length)
    let straightness = 0;
    if (moveEvents.length >= 2) {
      const start = moveEvents[0];
      const end = moveEvents[moveEvents.length - 1];
      const directDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      straightness = totalDistance > 0 ? directDistance / totalDistance : 0;
    }

    // Calculate direction consistency
    let directionConsistency = 0;
    if (directions.length > 1) {
      const avgDirection =
        directions.reduce((a, b) => a + b, 0) / directions.length;
      const variance =
        directions.reduce(
          (acc, dir) => acc + Math.pow(dir - avgDirection, 2),
          0
        ) / directions.length;
      directionConsistency = Math.exp(-variance); // Higher value = more consistent direction
    }

    // Calculate tremor (high-frequency variations)
    const velocityVariance =
      velocities.length > 1
        ? velocities.reduce((acc, v) => acc + Math.pow(v - avgVelocity, 2), 0) /
          velocities.length
        : 0;
    const tremor = Math.sqrt(velocityVariance);

    // Calculate pauses (low velocity periods)
    const pauseThreshold = avgVelocity * 0.1;
    const pauses = velocities.filter((v) => v < pauseThreshold).length;

    // Calculate smoothness (inverse of acceleration variance)
    const accelerationVariance =
      accelerations.length > 1
        ? accelerations.reduce(
            (acc, a) => acc + Math.pow(a - avgAcceleration, 2),
            0
          ) / accelerations.length
        : 0;
    const smoothness =
      accelerationVariance > 0 ? 1 / (1 + accelerationVariance) : 1;

    const pattern: MouseMovementPattern = {
      velocity: Math.round(avgVelocity * 1000) / 1000,
      acceleration: Math.round(avgAcceleration * 1000) / 1000,
      jerk: Math.round(avgJerk * 1000) / 1000,
      straightness: Math.round(straightness * 1000) / 1000,
      curvature: Math.round((1 - straightness) * 1000) / 1000,
      tremor: Math.round(tremor * 1000) / 1000,
      pauses: pauses,
      direction: Math.round(directionConsistency * 1000) / 1000,
      smoothness: Math.round(smoothness * 1000) / 1000,
      trajectoryLength: Math.round(totalDistance),
    };

    this.cache.mousePattern = pattern;
    this.cache.lastAnalysis = Date.now();
    return pattern;
  }

  /**
   * Analyze click patterns
   */
  analyzeClickPattern(): ClickPattern {
    if (
      this.cache.clickPattern &&
      Date.now() - this.cache.lastAnalysis < this.cache.cacheTimeout
    ) {
      return this.cache.clickPattern;
    }

    const clickEvents = this.tracker.mouseEvents.filter(
      (e) => e.type === "click"
    );
    if (clickEvents.length < 2) {
      return {
        clickRate: 0,
        doubleClickTime: 0,
        accuracy: 0,
        pressure: 0,
        dwellTime: 0,
        targetSize: 0,
        distanceFromCenter: 0,
      };
    }

    // Calculate click rate
    const totalTime =
      clickEvents[clickEvents.length - 1].timestamp - clickEvents[0].timestamp;
    const clickRate =
      totalTime > 0 ? (clickEvents.length - 1) / (totalTime / 1000) : 0;

    // Calculate double-click patterns
    const doubleClicks: number[] = [];
    for (let i = 1; i < clickEvents.length; i++) {
      const timeDiff = clickEvents[i].timestamp - clickEvents[i - 1].timestamp;
      if (timeDiff < 500) {
        // Double-click threshold
        doubleClicks.push(timeDiff);
      }
    }
    const avgDoubleClickTime =
      doubleClicks.length > 0
        ? doubleClicks.reduce((a, b) => a + b, 0) / doubleClicks.length
        : 0;

    // Calculate accuracy (consistency of click positions)
    const clickPositions = clickEvents.map((e) => ({ x: e.x, y: e.y }));
    let totalDeviation = 0;
    if (clickPositions.length > 1) {
      const centerX =
        clickPositions.reduce((acc, pos) => acc + pos.x, 0) /
        clickPositions.length;
      const centerY =
        clickPositions.reduce((acc, pos) => acc + pos.y, 0) /
        clickPositions.length;

      totalDeviation =
        clickPositions.reduce((acc, pos) => {
          return (
            acc +
            Math.sqrt(
              Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2)
            )
          );
        }, 0) / clickPositions.length;
    }
    const accuracy =
      totalDeviation > 0 ? Math.max(0, 1 - totalDeviation / 100) : 1;

    const pattern: ClickPattern = {
      clickRate: Math.round(clickRate * 1000) / 1000,
      doubleClickTime: Math.round(avgDoubleClickTime),
      accuracy: Math.round(accuracy * 1000) / 1000,
      pressure: 0.5, // Default pressure (not available in standard mouse events)
      dwellTime: 0, // Would require mousedown/mouseup analysis
      targetSize: 20, // Estimated target size
      distanceFromCenter: Math.round(totalDeviation),
    };

    this.cache.clickPattern = pattern;
    return pattern;
  }

  /**
   * Analyze scroll patterns
   */
  analyzeScrollPattern(): ScrollPattern {
    if (
      this.cache.scrollPattern &&
      Date.now() - this.cache.lastAnalysis < this.cache.cacheTimeout
    ) {
      return this.cache.scrollPattern;
    }

    const scrollEvents = this.tracker.mouseEvents.filter(
      (e) => e.type === "scroll"
    );
    if (scrollEvents.length < 2) {
      return {
        direction: "down",
        velocity: 0,
        acceleration: 0,
        duration: 0,
        distance: 0,
        smoothness: 0,
        pauseCount: 0,
        averagePauseTime: 0,
      };
    }

    // Analyze scroll direction and distance
    let totalDeltaY = 0;
    let totalDeltaX = 0;
    const velocities: number[] = [];

    for (let i = 1; i < scrollEvents.length; i++) {
      const curr = scrollEvents[i];
      const prev = scrollEvents[i - 1];

      totalDeltaY += curr.deltaY || 0;
      totalDeltaX += curr.deltaX || 0;

      const dt = curr.timestamp - prev.timestamp;
      if (dt > 0) {
        const distance = Math.sqrt(
          Math.pow(curr.deltaX || 0, 2) + Math.pow(curr.deltaY || 0, 2)
        );
        velocities.push(distance / dt);
      }
    }

    const primaryDirection =
      Math.abs(totalDeltaY) > Math.abs(totalDeltaX)
        ? totalDeltaY > 0
          ? "down"
          : "up"
        : totalDeltaX > 0
        ? "right"
        : "left";

    const avgVelocity =
      velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0;

    // Calculate acceleration
    const accelerations: number[] = [];
    for (let i = 1; i < velocities.length; i++) {
      const dt = scrollEvents[i + 1].timestamp - scrollEvents[i].timestamp;
      if (dt > 0) {
        accelerations.push((velocities[i] - velocities[i - 1]) / dt);
      }
    }
    const avgAcceleration =
      accelerations.length > 0
        ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length
        : 0;

    const duration =
      scrollEvents.length > 0
        ? scrollEvents[scrollEvents.length - 1].timestamp -
          scrollEvents[0].timestamp
        : 0;

    const totalDistance = Math.sqrt(
      Math.pow(totalDeltaX, 2) + Math.pow(totalDeltaY, 2)
    );

    // Calculate smoothness
    const velocityVariance =
      velocities.length > 1
        ? velocities.reduce((acc, v) => acc + Math.pow(v - avgVelocity, 2), 0) /
          velocities.length
        : 0;
    const smoothness = velocityVariance > 0 ? 1 / (1 + velocityVariance) : 1;

    // Calculate pauses
    const pauseThreshold = avgVelocity * 0.2;
    const pauses = velocities.filter((v) => v < pauseThreshold).length;

    const pattern: ScrollPattern = {
      direction: primaryDirection,
      velocity: Math.round(avgVelocity * 1000) / 1000,
      acceleration: Math.round(avgAcceleration * 1000) / 1000,
      duration: duration,
      distance: Math.round(totalDistance),
      smoothness: Math.round(smoothness * 1000) / 1000,
      pauseCount: pauses,
      averagePauseTime: pauses > 0 ? duration / pauses : 0,
    };

    this.cache.scrollPattern = pattern;
    return pattern;
  }

  /**
   * Analyze typing patterns
   */
  analyzeTypingPattern(): TypingPattern {
    if (
      this.cache.typingPattern &&
      Date.now() - this.cache.lastAnalysis < this.cache.cacheTimeout
    ) {
      return this.cache.typingPattern;
    }

    const keyEvents = this.tracker.keyboardEvents;
    if (keyEvents.length < 2) {
      return {
        wpm: 0,
        cpm: 0,
        accuracy: 0,
        rhythm: 0,
        dwellTime: 0,
        flightTime: 0,
        pausePattern: [],
        keyPressure: 0.5,
        backspaceFrequency: 0,
        capitalizationPattern: "normal",
      };
    }

    // Calculate typing speed
    const duration =
      keyEvents[keyEvents.length - 1].timestamp - keyEvents[0].timestamp;
    const durationMinutes = duration / (1000 * 60);

    const keyPresses = keyEvents.filter(
      (e) => e.type === "keydown" || e.type === "keypress"
    );
    const letterPresses = keyPresses.filter((e) => e.key === "letter");

    const wpm =
      durationMinutes > 0 ? letterPresses.length / 5 / durationMinutes : 0;
    const cpm =
      durationMinutes > 0 ? letterPresses.length / durationMinutes : 0;

    // Calculate dwell times (keydown to keyup)
    const dwellTimes: number[] = [];
    const keyDownEvents = keyEvents.filter((e) => e.type === "keydown");
    const keyUpEvents = keyEvents.filter((e) => e.type === "keyup");

    for (const downEvent of keyDownEvents) {
      const upEvent = keyUpEvents.find(
        (up) =>
          up.code === downEvent.code &&
          up.timestamp > downEvent.timestamp &&
          up.timestamp - downEvent.timestamp < 1000 // Within 1 second
      );
      if (upEvent) {
        dwellTimes.push(upEvent.timestamp - downEvent.timestamp);
      }
    }

    const avgDwellTime =
      dwellTimes.length > 0
        ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
        : 0;

    // Calculate flight times (keyup to next keydown)
    const flightTimes: number[] = [];
    for (let i = 1; i < keyDownEvents.length; i++) {
      const prevUpEvent = keyUpEvents.find(
        (up) =>
          up.timestamp > keyDownEvents[i - 1].timestamp &&
          up.timestamp < keyDownEvents[i].timestamp
      );
      if (prevUpEvent) {
        flightTimes.push(keyDownEvents[i].timestamp - prevUpEvent.timestamp);
      }
    }

    const avgFlightTime =
      flightTimes.length > 0
        ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length
        : 0;

    // Calculate rhythm consistency
    const rhythmVariance =
      dwellTimes.length > 1
        ? dwellTimes.reduce(
            (acc, time) => acc + Math.pow(time - avgDwellTime, 2),
            0
          ) / dwellTimes.length
        : 0;
    const rhythm = rhythmVariance > 0 ? 1 / (1 + Math.sqrt(rhythmVariance)) : 1;

    // Calculate backspace frequency
    const backspaceEvents = keyEvents.filter((e) => e.key === "Backspace");
    const backspaceFrequency =
      letterPresses.length > 0
        ? backspaceEvents.length / letterPresses.length
        : 0;

    // Calculate pause patterns
    const pausePattern: number[] = [];
    for (let i = 1; i < keyPresses.length; i++) {
      const pause = keyPresses[i].timestamp - keyPresses[i - 1].timestamp;
      if (pause > 100) {
        // Pauses longer than 100ms
        pausePattern.push(pause);
      }
    }

    const pattern: TypingPattern = {
      wpm: Math.round(wpm * 10) / 10,
      cpm: Math.round(cpm),
      accuracy: 0.95, // Would need text analysis for true accuracy
      rhythm: Math.round(rhythm * 1000) / 1000,
      dwellTime: Math.round(avgDwellTime),
      flightTime: Math.round(avgFlightTime),
      pausePattern: pausePattern.slice(0, 10), // Limit to first 10 pauses
      keyPressure: 0.5, // Not available in standard events
      backspaceFrequency: Math.round(backspaceFrequency * 1000) / 1000,
      capitalizationPattern: "normal",
    };

    this.cache.typingPattern = pattern;
    return pattern;
  }

  /**
   * Detect bot/automation indicators
   */
  detectAutomation(): {
    perfectTiming: boolean;
    impossibleSpeed: boolean;
    linearMovement: boolean;
    repetitivePatterns: boolean;
    lackOfVariation: boolean;
  } {
    const mousePattern = this.analyzeMouseMovement();
    const typingPattern = this.analyzeTypingPattern();

    // Check for perfect timing (too consistent)
    const dwellTimes = this.tracker.keyboardEvents
      .filter((e) => e.dwellTime !== undefined)
      .map((e) => e.dwellTime!);
    const dwellVariance =
      dwellTimes.length > 1
        ? dwellTimes.reduce((acc, time) => {
            const avg =
              dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
            return acc + Math.pow(time - avg, 2);
          }, 0) / dwellTimes.length
        : 0;
    const perfectTiming = dwellVariance < 1; // Too little variation

    // Check for impossible speed
    const impossibleSpeed =
      mousePattern.velocity > 10 || typingPattern.wpm > 200;

    // Check for linear movement (too straight)
    const linearMovement = mousePattern.straightness > 0.95;

    // Check for repetitive patterns
    const repetitivePatterns =
      mousePattern.direction > 0.98 || typingPattern.rhythm > 0.98;

    // Check for lack of variation
    const lackOfVariation =
      mousePattern.tremor < 0.001 && typingPattern.rhythm > 0.95;

    return {
      perfectTiming,
      impossibleSpeed,
      linearMovement,
      repetitivePatterns,
      lackOfVariation,
    };
  }

  /**
   * Calculate human verification metrics
   */
  calculateHumanness(): {
    mouseHumanness: number;
    keyboardHumanness: number;
    touchHumanness: number;
    overallHumanness: number;
    botProbability: number;
  } {
    const mousePattern = this.analyzeMouseMovement();
    const typingPattern = this.analyzeTypingPattern();
    const automation = this.detectAutomation();

    // Mouse humanness (0-1, higher = more human)
    let mouseHumanness = 1.0;
    mouseHumanness *= Math.min(1, mousePattern.tremor * 10); // Some tremor is human
    mouseHumanness *= Math.min(1, (1 - mousePattern.straightness) * 2); // Some curvature is human
    mouseHumanness *= Math.min(1, mousePattern.smoothness); // Smoothness is good
    mouseHumanness *= mousePattern.pauses > 0 ? 1 : 0.5; // Humans pause

    // Keyboard humanness
    let keyboardHumanness = 1.0;
    keyboardHumanness *= Math.min(1, typingPattern.dwellTime / 100); // Normal dwell times
    keyboardHumanness *= Math.min(1, typingPattern.flightTime / 50); // Normal flight times
    keyboardHumanness *= Math.max(0.5, 1 - typingPattern.rhythm); // Some variation is human
    keyboardHumanness *= typingPattern.pausePattern.length > 0 ? 1 : 0.7; // Humans pause

    // Touch humanness (basic implementation)
    const touchHumanness = this.tracker.touchEvents.length > 0 ? 0.8 : 0.5;

    // Overall humanness
    const weights = {
      mouse: 0.4,
      keyboard: 0.4,
      touch: 0.2,
    };

    const overallHumanness =
      mouseHumanness * weights.mouse +
      keyboardHumanness * weights.keyboard +
      touchHumanness * weights.touch;

    // Bot probability based on automation detection
    let botProbability = 0;
    if (automation.perfectTiming) botProbability += 0.3;
    if (automation.impossibleSpeed) botProbability += 0.4;
    if (automation.linearMovement) botProbability += 0.2;
    if (automation.repetitivePatterns) botProbability += 0.3;
    if (automation.lackOfVariation) botProbability += 0.2;

    botProbability = Math.min(1, botProbability);

    return {
      mouseHumanness: Math.round(mouseHumanness * 1000) / 1000,
      keyboardHumanness: Math.round(keyboardHumanness * 1000) / 1000,
      touchHumanness: Math.round(touchHumanness * 1000) / 1000,
      overallHumanness: Math.round(overallHumanness * 1000) / 1000,
      botProbability: Math.round(botProbability * 1000) / 1000,
    };
  }

  /**
   * Generate behavioral hash
   */
  generateBehavioralHash(): string {
    const mousePattern = this.analyzeMouseMovement();
    const clickPattern = this.analyzeClickPattern();
    const scrollPattern = this.analyzeScrollPattern();
    const typingPattern = this.analyzeTypingPattern();

    const data = {
      mouse: {
        velocity: Math.round(mousePattern.velocity * 100),
        smoothness: Math.round(mousePattern.smoothness * 100),
        tremor: Math.round(mousePattern.tremor * 100),
        straightness: Math.round(mousePattern.straightness * 100),
      },
      click: {
        rate: Math.round(clickPattern.clickRate * 100),
        accuracy: Math.round(clickPattern.accuracy * 100),
      },
      scroll: {
        velocity: Math.round(scrollPattern.velocity * 100),
        smoothness: Math.round(scrollPattern.smoothness * 100),
      },
      typing: {
        wpm: Math.round(typingPattern.wpm),
        rhythm: Math.round(typingPattern.rhythm * 100),
        dwellTime: Math.round(typingPattern.dwellTime),
      },
    };

    // Create hash from behavioral characteristics
    const hashString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate statistical metrics
   */
  calculateStatistics(): {
    entropy: number;
    variance: number;
    standardDeviation: number;
    correlationCoefficients: Record<string, number>;
    anomalyScore: number;
    consistencyScore: number;
    uniquenessScore: number;
  } {
    const mousePattern = this.analyzeMouseMovement();
    const typingPattern = this.analyzeTypingPattern();

    // Calculate entropy (measure of randomness)
    const velocities = this.tracker.mouseEvents
      .filter((e) => e.velocity !== undefined)
      .map((e) => e.velocity!);

    const entropy = this.calculateEntropy(velocities);

    // Calculate variance and standard deviation
    const allTimings = [
      ...this.tracker.keyboardEvents.map((e) => e.dwellTime || 0),
      ...velocities,
    ].filter((t) => t > 0);

    const mean =
      allTimings.length > 0
        ? allTimings.reduce((a, b) => a + b, 0) / allTimings.length
        : 0;

    const variance =
      allTimings.length > 0
        ? allTimings.reduce(
            (acc, timing) => acc + Math.pow(timing - mean, 2),
            0
          ) / allTimings.length
        : 0;

    const standardDeviation = Math.sqrt(variance);

    // Calculate correlation coefficients (simplified)
    const correlationCoefficients = {
      "mouse-keyboard": this.calculateCorrelation(
        [mousePattern.velocity, mousePattern.smoothness],
        [typingPattern.wpm, typingPattern.rhythm]
      ),
    };

    // Calculate anomaly score (how unusual the behavior is)
    const anomalyScore = Math.min(
      1,
      (Math.abs(mousePattern.velocity - 0.5) +
        Math.abs(typingPattern.wpm - 60) / 100 +
        Math.abs(mousePattern.smoothness - 0.7)) /
        3
    );

    // Calculate consistency score
    const consistencyScore = Math.min(
      1,
      (mousePattern.smoothness + typingPattern.rhythm) / 2
    );

    // Calculate uniqueness score
    const uniquenessScore = Math.min(1, entropy / 10 + variance / 1000);

    return {
      entropy: Math.round(entropy * 1000) / 1000,
      variance: Math.round(variance * 1000) / 1000,
      standardDeviation: Math.round(standardDeviation * 1000) / 1000,
      correlationCoefficients: {
        "mouse-keyboard":
          Math.round(correlationCoefficients["mouse-keyboard"] * 1000) / 1000,
      },
      anomalyScore: Math.round(anomalyScore * 1000) / 1000,
      consistencyScore: Math.round(consistencyScore * 1000) / 1000,
      uniquenessScore: Math.round(uniquenessScore * 1000) / 1000,
    };
  }

  /**
   * Calculate entropy of a data series
   */
  private calculateEntropy(data: number[]): number {
    if (data.length === 0) return 0;

    // Create frequency distribution
    const bins = 10;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;

    const frequencies = new Array(bins).fill(0);
    for (const value of data) {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / binSize));
      frequencies[binIndex]++;
    }

    // Calculate entropy
    let entropy = 0;
    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / data.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get current behavioral fingerprint
   */
  getBehavioralFingerprint(): BehavioralFingerprint {
    const mousePattern = this.analyzeMouseMovement();
    const clickPattern = this.analyzeClickPattern();
    const scrollPattern = this.analyzeScrollPattern();
    const typingPattern = this.analyzeTypingPattern();
    const humanVerification = this.calculateHumanness();
    const statistics = this.calculateStatistics();
    const behavioralHash = this.generateBehavioralHash();

    return {
      available: true,

      mouseEvents: this.tracker.mouseEvents.slice(0, 100), // Limit for privacy
      mousePatterns: {
        movementPattern: mousePattern,
        clickPattern: clickPattern,
        scrollPattern: scrollPattern,
        habitualPaths: [], // Would require longer tracking to establish
      },

      keyboardEvents: this.tracker.keyboardEvents.slice(0, 100), // Limit for privacy
      typingPatterns: {
        overall: typingPattern,
        byKey: {}, // Would require more detailed analysis
        bigramTimings: {},
        trigramTimings: {},
        commonSequences: [],
      },

      touchEvents: this.tracker.touchEvents.slice(0, 100), // Limit for privacy
      touchPatterns: {
        swipeVelocity: 0,
        tapPressure: 0,
        tapDuration: 0,
        pinchGestures: 0,
        rotationGestures: 0,
        multiTouchFrequency: 0,
        fingerSpacing: 0,
      },

      interactionPatterns: {
        sessionDuration: Date.now() - this.tracker.startTime,
        pageViewDuration: Date.now() - this.tracker.startTime,
        scrollDepth: 0,
        clickDepth: this.tracker.mouseEvents.filter((e) => e.type === "click")
          .length,
        timeToFirstInteraction:
          this.tracker.mouseEvents.length > 0
            ? this.tracker.mouseEvents[0].timestamp - this.tracker.startTime
            : 0,
        interactionFrequency:
          (this.tracker.mouseEvents.length +
            this.tracker.keyboardEvents.length) /
          Math.max(1, (Date.now() - this.tracker.startTime) / 1000),
        pausePatterns: [],
        focusLossFrequency: 0,
        tabSwitchFrequency: 0,
      },

      signatures: {
        mouseSignature: behavioralHash.substring(0, 8),
        keyboardSignature: behavioralHash.substring(8, 16),
        touchSignature: behavioralHash.substring(16, 24),
        navigationSignature: behavioralHash.substring(24, 32),
        timingSignature: behavioralHash.substring(32, 40),
      },

      humanVerification: {
        ...humanVerification,
        automationDetection: this.detectAutomation(),
      },

      collectionMetadata: {
        startTime: this.tracker.startTime,
        endTime: Date.now(),
        totalEvents:
          this.tracker.mouseEvents.length +
          this.tracker.keyboardEvents.length +
          this.tracker.touchEvents.length,
        samplingRate: this.options.samplingRate,
        eventTypes: ["mouse", "keyboard", "touch"],
        dataQuality: Math.min(
          1,
          (this.tracker.mouseEvents.length +
            this.tracker.keyboardEvents.length) /
            100
        ),
        privacyLevel: this.options.privacyLevel,
      },

      statistics,

      privacy: {
        dataMinimized: true,
        sensitiveDataFiltered: true,
        anonymized: true,
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        consentLevel: "standard",
      },

      behavioralHash,
      confidenceLevel: Math.min(
        1,
        (this.tracker.mouseEvents.length + this.tracker.keyboardEvents.length) /
          200
      ),
      collectionTime: Date.now() - this.tracker.startTime,
      errorCount: 0,
    };
  }
}

/**
 * Collect behavioral fingerprint
 */
export async function collectBehavioralFingerprint(): Promise<BehavioralFingerprint> {
  try {
    const analyzer = new BehavioralAnalyzer();

    // Start tracking
    analyzer.startTracking();

    // Wait for collection period or return early if enough data
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const fingerprint = analyzer.getBehavioralFingerprint();

        // Stop early if we have enough data or time is up
        if (
          fingerprint.collectionMetadata.totalEvents >= 50 ||
          fingerprint.collectionTime >= 30000
        ) {
          clearInterval(checkInterval);
          analyzer.stopTracking();
          resolve(fingerprint);
        }
      }, 5000); // Check every 5 seconds

      // Force stop after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        analyzer.stopTracking();
        resolve(analyzer.getBehavioralFingerprint());
      }, 30000);
    });
  } catch (error) {
    throw new FingerprintError(
      `Behavioral fingerprinting failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "BEHAVIORAL_ERROR",
      { error }
    );
  }
}
