/**
 * Plugin and Extension Detection Module
 *
 * Comprehensive browser plugin and extension detection for device identification:
 * - Navigator plugins enumeration and analysis
 * - MIME types support detection and categorization
 * - Browser extension detection (ad blockers, password managers, VPNs)
 * - Automation tool detection (Selenium, Puppeteer, Playwright)
 * - Developer tools presence and state detection
 * - Browser modification and override detection
 * - Security feature analysis
 * - Fingerprint resistance mechanism detection
 */

import type { PluginFingerprint } from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface ExtensionSignature {
  name: string;
  signatures: string[];
  type: "adBlocker" | "passwordManager" | "vpn" | "developer" | "custom";
}

interface AutomationIndicator {
  property: string;
  value: any;
  source: "window" | "navigator" | "document";
}

/**
 * Advanced plugin and extension fingerprinting with comprehensive detection
 */
export class PluginExtensionFingerprinting {
  private plugins: PluginFingerprint["plugins"] = {
    navigator: [],
    count: 0,
    enabledPlugins: [],
    disabledPlugins: [],
  };

  private mimeTypes: PluginFingerprint["mimeTypes"] = {
    supported: [],
    count: 0,
    categories: {},
  };

  private readonly EXTENSION_SIGNATURES: ExtensionSignature[] = [
    // Ad Blockers
    {
      name: "uBlock Origin",
      signatures: ["ublock", "ublock-origin", "adblock"],
      type: "adBlocker",
    },
    {
      name: "AdBlock Plus",
      signatures: ["adblockplus", "abp"],
      type: "adBlocker",
    },
    {
      name: "Ghostery",
      signatures: ["ghostery"],
      type: "adBlocker",
    },
    // Password Managers
    {
      name: "1Password",
      signatures: ["onepassword", "1password"],
      type: "passwordManager",
    },
    {
      name: "LastPass",
      signatures: ["lastpass"],
      type: "passwordManager",
    },
    {
      name: "Bitwarden",
      signatures: ["bitwarden"],
      type: "passwordManager",
    },
    // VPN Extensions
    {
      name: "NordVPN",
      signatures: ["nordvpn"],
      type: "vpn",
    },
    {
      name: "ExpressVPN",
      signatures: ["expressvpn"],
      type: "vpn",
    },
    // Developer Tools
    {
      name: "React Developer Tools",
      signatures: ["react-developer-tools", "__REACT_DEVTOOLS"],
      type: "developer",
    },
    {
      name: "Vue.js devtools",
      signatures: ["vue-devtools", "__VUE_DEVTOOLS"],
      type: "developer",
    },
    {
      name: "Redux DevTools",
      signatures: ["redux-devtools"],
      type: "developer",
    },
  ];

  private readonly AUTOMATION_INDICATORS: AutomationIndicator[] = [
    // Selenium
    { property: "webdriver", value: true, source: "navigator" },
    { property: "__webdriver_script_fn", value: undefined, source: "document" },
    { property: "__selenium_unwrapped", value: undefined, source: "window" },
    { property: "__webdriver_unwrapped", value: undefined, source: "window" },
    { property: "_selenium", value: undefined, source: "window" },
    { property: "callSelenium", value: undefined, source: "window" },
    { property: "_Selenium_IDE_Recorder", value: undefined, source: "window" },

    // Puppeteer
    {
      property: "__puppeteer_evaluation_script__",
      value: undefined,
      source: "window",
    },
    { property: "__puppeteer", value: undefined, source: "window" },

    // Playwright
    { property: "__playwright", value: undefined, source: "window" },
    { property: "__pw_playwright", value: undefined, source: "window" },

    // General automation
    { property: "phantom", value: undefined, source: "window" },
    { property: "_phantom", value: undefined, source: "window" },
    { property: "callPhantom", value: undefined, source: "window" },
    { property: "spawn", value: undefined, source: "window" },
    { property: "emit", value: undefined, source: "window" },
    { property: "Buffer", value: undefined, source: "window" },
  ];

  /**
   * Collect comprehensive plugin and extension fingerprint
   */
  async collectFingerprint(): Promise<PluginFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Enumerate navigator plugins
      const pluginResult = await this.enumeratePlugins();
      errorCount += pluginResult.errorCount;

      // Enumerate MIME types
      const mimeTypesResult = await this.enumerateMimeTypes();
      errorCount += mimeTypesResult.errorCount;

      // Detect browser extensions
      const extensionResult = await this.detectExtensions();
      errorCount += extensionResult.errorCount;

      // Detect automation tools
      const automationResult = await this.detectAutomation();
      errorCount += automationResult.errorCount;

      // Detect developer tools
      const devToolsResult = await this.detectDeveloperTools();
      errorCount += devToolsResult.errorCount;

      // Detect browser modifications
      const modificationsResult = await this.detectModifications();
      errorCount += modificationsResult.errorCount;

      // Analyze security features
      const securityResult = await this.analyzeSecurityFeatures();
      errorCount += securityResult.errorCount;

      // Test browser features
      const browserFeaturesResult = await this.testBrowserFeatures();
      errorCount += browserFeaturesResult.errorCount;

      // Detect fingerprint resistance
      const resistanceResult = await this.detectFingerprintResistance();
      errorCount += resistanceResult.errorCount;

      // Calculate fingerprint hashes
      const fingerprints = await this.calculateFingerprints();

      const collectionTime = performance.now() - startTime;
      const confidenceLevel = this.calculateConfidenceLevel();

      return {
        available: true,
        plugins: this.plugins,
        mimeTypes: this.mimeTypes,
        extensions: extensionResult.data,
        automation: automationResult.data,
        developerTools: devToolsResult.data,
        modifications: modificationsResult.data,
        security: securityResult.data,
        browserFeatures: browserFeaturesResult.data,
        fingerprintResistance: resistanceResult.data,
        fingerprints,
        confidenceLevel,
        collectionTime,
        errorCount,
      };
    } catch (error) {
      errorCount++;
      return this.createUnavailableFingerprint(startTime, errorCount);
    }
  }

  /**
   * Enumerate navigator plugins
   */
  private async enumeratePlugins(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!navigator.plugins) {
        return { errorCount: 1 };
      }

      this.plugins.count = navigator.plugins.length;
      this.plugins.navigator = [];

      for (let i = 0; i < navigator.plugins.length; i++) {
        try {
          const plugin = navigator.plugins[i];
          const mimeTypes: Array<{
            type: string;
            description: string;
            suffixes: string;
          }> = [];

          // Enumerate plugin MIME types
          for (let j = 0; j < plugin.length; j++) {
            const mimeType = plugin[j];
            mimeTypes.push({
              type: mimeType.type,
              description: mimeType.description,
              suffixes: mimeType.suffixes,
            });
          }

          this.plugins.navigator.push({
            name: plugin.name,
            description: plugin.description,
            filename: plugin.filename,
            version: (plugin as any).version || "",
            mimeTypes,
          });

          // Track enabled/disabled status
          if (plugin.name) {
            this.plugins.enabledPlugins.push(plugin.name);
          }
        } catch (error) {
          errorCount++;
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Enumerate MIME types
   */
  private async enumerateMimeTypes(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!navigator.mimeTypes) {
        return { errorCount: 1 };
      }

      this.mimeTypes.count = navigator.mimeTypes.length;
      this.mimeTypes.supported = [];
      this.mimeTypes.categories = {};

      for (let i = 0; i < navigator.mimeTypes.length; i++) {
        try {
          const mimeType = navigator.mimeTypes[i];

          this.mimeTypes.supported.push({
            type: mimeType.type,
            description: mimeType.description,
            suffixes: mimeType.suffixes,
            enabledPlugin: mimeType.enabledPlugin?.name || "",
          });

          // Categorize MIME types
          const category = this.categorizeMimeType(mimeType.type);
          this.mimeTypes.categories[category] =
            (this.mimeTypes.categories[category] || 0) + 1;
        } catch (error) {
          errorCount++;
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Categorize MIME type
   */
  private categorizeMimeType(type: string): string {
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("text/")) return "text";
    if (type.startsWith("application/")) {
      if (type.includes("pdf")) return "pdf";
      if (type.includes("flash") || type.includes("shockwave")) return "flash";
      if (type.includes("java")) return "java";
      return "application";
    }
    return "other";
  }

  /**
   * Detect browser extensions
   */
  private async detectExtensions(): Promise<{
    data: PluginFingerprint["extensions"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["extensions"] = {
      detected: [],
      adBlocker: false,
      passwordManager: false,
      vpnExtension: false,
      developerExtensions: false,
      customExtensions: [],
    };

    try {
      // Test for extension signatures in DOM and global objects
      for (const extension of this.EXTENSION_SIGNATURES) {
        try {
          const detected = await this.testExtensionSignatures(extension);
          if (detected) {
            data.detected.push(extension.name);

            switch (extension.type) {
              case "adBlocker":
                data.adBlocker = true;
                break;
              case "passwordManager":
                data.passwordManager = true;
                break;
              case "vpn":
                data.vpnExtension = true;
                break;
              case "developer":
                data.developerExtensions = true;
                break;
              case "custom":
                data.customExtensions.push(extension.name);
                break;
            }
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Additional ad blocker detection
      data.adBlocker = data.adBlocker || (await this.detectAdBlocker());
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Test extension signatures
   */
  private async testExtensionSignatures(
    extension: ExtensionSignature
  ): Promise<boolean> {
    try {
      // Test global window properties
      for (const signature of extension.signatures) {
        if ((window as any)[signature]) {
          return true;
        }

        // Test document properties
        if ((document as any)[signature]) {
          return true;
        }

        // Test in DOM elements
        if (
          document.querySelector(`[class*="${signature}"]`) ||
          document.querySelector(`[id*="${signature}"]`)
        ) {
          return true;
        }
      }

      // Special detection for React DevTools
      if (extension.name === "React Developer Tools") {
        return !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      }

      // Special detection for Vue DevTools
      if (extension.name === "Vue.js devtools") {
        return !!(window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect ad blocker
   */
  private async detectAdBlocker(): Promise<boolean> {
    try {
      // Test 1: Create a fake ad element
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      testAd.className = "adsbox";
      testAd.style.position = "absolute";
      testAd.style.left = "-9999px";
      document.body.appendChild(testAd);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const isBlocked =
        testAd.offsetHeight === 0 ||
        testAd.offsetWidth === 0 ||
        window.getComputedStyle(testAd).display === "none";

      document.body.removeChild(testAd);

      // Test 2: Check for common ad blocker variables
      const adBlockerVars = [
        "blockAdBlock",
        "adBlock",
        "AdBlock",
        "adblockDetector",
      ];

      for (const varName of adBlockerVars) {
        if ((window as any)[varName]) {
          return true;
        }
      }

      return isBlocked;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect automation tools
   */
  private async detectAutomation(): Promise<{
    data: PluginFingerprint["automation"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["automation"] = {
      selenium: false,
      puppeteer: false,
      playwright: false,
      webDriver: false,
      headless: false,
      automationIndicators: [],
    };

    try {
      // Test automation indicators
      for (const indicator of this.AUTOMATION_INDICATORS) {
        try {
          let source: any;
          switch (indicator.source) {
            case "window":
              source = window;
              break;
            case "navigator":
              source = navigator;
              break;
            case "document":
              source = document;
              break;
            default:
              continue;
          }

          const hasProperty = indicator.property in source;
          const value = source[indicator.property];

          if (hasProperty) {
            data.automationIndicators.push(
              `${indicator.source}.${indicator.property}`
            );

            // Specific tool detection
            if (indicator.property === "webdriver" && value === true) {
              data.webDriver = true;
              data.selenium = true;
            }

            if (indicator.property.includes("puppeteer")) {
              data.puppeteer = true;
            }

            if (indicator.property.includes("playwright")) {
              data.playwright = true;
            }
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Additional headless detection
      data.headless = this.detectHeadlessBrowser();
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Detect headless browser
   */
  private detectHeadlessBrowser(): boolean {
    try {
      // Check for headless indicators
      const headlessIndicators = [
        // Missing expected properties
        !window.outerHeight,
        !window.outerWidth,

        // Suspicious user agent
        /headless/i.test(navigator.userAgent),

        // Missing plugins that should exist
        navigator.plugins.length === 0,

        // Suspicious screen properties
        screen.width === 0 || screen.height === 0,

        // Missing web driver
        "webdriver" in navigator,

        // Chrome headless specific
        navigator.userAgent.includes("HeadlessChrome"),
      ];

      return headlessIndicators.filter(Boolean).length >= 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect developer tools
   */
  private async detectDeveloperTools(): Promise<{
    data: PluginFingerprint["developerTools"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["developerTools"] = {
      open: false,
      orientation: "",
      detected: false,
      debuggerPresent: false,
      consoleModified: false,
    };

    try {
      // Method 1: Console timing
      const startTime = performance.now();
      console.clear();
      const endTime = performance.now();

      const consoleTiming = endTime - startTime;
      data.detected = consoleTiming > 100; // DevTools slows down console
      data.open = data.detected;

      // Method 2: Window size detection
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (heightDiff > threshold) {
        data.orientation = "bottom";
        data.open = true;
      } else if (widthDiff > threshold) {
        data.orientation = "side";
        data.open = true;
      }

      // Method 3: Debugger statement
      try {
        const debugStart = performance.now();
        (function () {
          debugger;
        })();
        const debugEnd = performance.now();
        data.debuggerPresent = debugEnd - debugStart > 100;
      } catch (error) {
        // Debugger blocked or error
      }

      // Method 4: Console modification detection
      data.consoleModified = this.detectConsoleModification();
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Detect console modification
   */
  private detectConsoleModification(): boolean {
    try {
      const originalLog = console.log.toString();
      return (
        !originalLog.includes("[native code]") ||
        originalLog.length < 30 ||
        originalLog.length > 100
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect browser modifications
   */
  private async detectModifications(): Promise<{
    data: PluginFingerprint["modifications"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["modifications"] = {
      windowProperties: [],
      prototypeChanges: [],
      globalVariables: [],
      functionOverrides: [],
      nativeCodeModified: false,
    };

    try {
      // Detect custom window properties
      const standardProps = [
        "window",
        "document",
        "navigator",
        "screen",
        "history",
        "location",
      ];
      for (const prop in window) {
        if (
          !standardProps.includes(prop) &&
          typeof (window as any)[prop] !== "function" &&
          !prop.startsWith("webkit") &&
          !prop.startsWith("moz") &&
          !prop.startsWith("ms")
        ) {
          data.windowProperties.push(prop);
        }
      }

      // Detect prototype modifications
      data.prototypeChanges = this.detectPrototypeChanges();

      // Detect function overrides
      data.functionOverrides = this.detectFunctionOverrides();

      // Check for native code modification
      data.nativeCodeModified = this.detectNativeCodeModification();

      // Global variables (non-standard)
      data.globalVariables = data.windowProperties.filter(
        (prop) =>
          !(window as any)[prop] || typeof (window as any)[prop] === "object"
      );
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Detect prototype changes
   */
  private detectPrototypeChanges(): string[] {
    const changes: string[] = [];

    try {
      const prototypes = [
        { name: "Function", obj: Function.prototype },
        { name: "Object", obj: Object.prototype },
        { name: "Array", obj: Array.prototype },
        { name: "String", obj: String.prototype },
      ];

      for (const proto of prototypes) {
        const descriptors = Object.getOwnPropertyDescriptors(proto.obj);
        for (const prop in descriptors) {
          if (
            descriptors[prop].value &&
            typeof descriptors[prop].value === "function" &&
            !descriptors[prop].value.toString().includes("[native code]")
          ) {
            changes.push(`${proto.name}.prototype.${prop}`);
          }
        }
      }
    } catch (error) {
      // Error accessing prototypes
    }

    return changes;
  }

  /**
   * Detect function overrides
   */
  private detectFunctionOverrides(): string[] {
    const overrides: string[] = [];

    try {
      const functionsToCheck = [
        "alert",
        "confirm",
        "prompt",
        "open",
        "close",
        "setTimeout",
        "setInterval",
        "requestAnimationFrame",
      ];

      for (const funcName of functionsToCheck) {
        const func = (window as any)[funcName];
        if (func && typeof func === "function") {
          const funcStr = func.toString();
          if (!funcStr.includes("[native code]") && funcStr.length > 50) {
            overrides.push(funcName);
          }
        }
      }
    } catch (error) {
      // Error checking functions
    }

    return overrides;
  }

  /**
   * Detect native code modification
   */
  private detectNativeCodeModification(): boolean {
    try {
      // Check if native functions have been modified
      const nativeFunctions = [
        Date,
        Array,
        Object,
        Function,
        String,
        Number,
        Boolean,
        RegExp,
      ];

      for (const nativeFunc of nativeFunctions) {
        const funcStr = nativeFunc.toString();
        if (!funcStr.includes("[native code]")) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze security features
   */
  private async analyzeSecurityFeatures(): Promise<{
    data: PluginFingerprint["security"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["security"] = {
      cspBlocked: false,
      mixedContent: false,
      secureContext: false,
      permissions: {},
    };

    try {
      // Check secure context
      data.secureContext = window.isSecureContext;

      // Check mixed content
      data.mixedContent =
        location.protocol === "https:" && document.referrer.startsWith("http:");

      // Test CSP by trying to create inline script
      try {
        const script = document.createElement("script");
        script.innerHTML = "// test";
        document.head.appendChild(script);
        document.head.removeChild(script);
      } catch (error) {
        data.cspBlocked = true;
      }

      // Check permissions
      if ("permissions" in navigator) {
        const permissionsToCheck = [
          "camera",
          "microphone",
          "geolocation",
          "notifications",
          "clipboard-read",
          "clipboard-write",
        ];

        for (const permission of permissionsToCheck) {
          try {
            const result = await navigator.permissions.query({
              name: permission as any,
            });
            data.permissions[permission] = result.state;
          } catch (error) {
            errorCount++;
          }
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Test browser features
   */
  private async testBrowserFeatures(): Promise<{
    data: PluginFingerprint["browserFeatures"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["browserFeatures"] = {
      webgl: false,
      webrtc: false,
      geolocation: false,
      notifications: false,
      camera: false,
      microphone: false,
      clipboard: false,
      fullscreen: false,
    };

    try {
      // WebGL
      data.webgl = !!(
        window.WebGLRenderingContext || window.WebGL2RenderingContext
      );

      // WebRTC
      data.webrtc = !!(
        window.RTCPeerConnection || (window as any).webkitRTCPeerConnection
      );

      // Geolocation
      data.geolocation = !!navigator.geolocation;

      // Notifications
      data.notifications = "Notification" in window;

      // Media devices
      data.camera = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      data.microphone = data.camera;

      // Clipboard
      data.clipboard = !!(navigator.clipboard && navigator.clipboard.readText);

      // Fullscreen
      data.fullscreen = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled
      );
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Detect fingerprint resistance
   */
  private async detectFingerprintResistance(): Promise<{
    data: PluginFingerprint["fingerprintResistance"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: PluginFingerprint["fingerprintResistance"] = {
      canvasBlocked: false,
      audioBlocked: false,
      webglBlocked: false,
      fontsBlocked: false,
      spoofingDetected: false,
      privacyMode: false,
    };

    try {
      // Test canvas fingerprinting resistance
      data.canvasBlocked = await this.testCanvasBlocking();

      // Test WebGL blocking
      data.webglBlocked = await this.testWebGLBlocking();

      // Test audio blocking
      data.audioBlocked = await this.testAudioBlocking();

      // Test font blocking
      data.fontsBlocked = await this.testFontBlocking();

      // Detect spoofing
      data.spoofingDetected = await this.detectSpoofing();

      // Privacy mode detection
      data.privacyMode = await this.detectPrivacyMode();
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Test canvas blocking
   */
  private async testCanvasBlocking(): Promise<boolean> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;

      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Canvas test", 2, 2);

      const imageData = canvas.toDataURL();
      return imageData === "data:,"; // Blocked canvas returns empty data
    } catch (error) {
      return true; // Blocked
    }
  }

  /**
   * Test WebGL blocking
   */
  private async testWebGLBlocking(): Promise<boolean> {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return (
        !gl ||
        !(gl as WebGLRenderingContext).getParameter(
          (gl as WebGLRenderingContext).VERSION
        )
      );
    } catch (error) {
      return true;
    }
  }

  /**
   * Test audio blocking
   */
  private async testAudioBlocking(): Promise<boolean> {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      return oscillator.frequency.value === 0; // Suspicious if blocked
    } catch (error) {
      return true;
    }
  }

  /**
   * Test font blocking
   */
  private async testFontBlocking(): Promise<boolean> {
    try {
      const testFonts = ["Arial", "Times", "Courier"];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;

      const measurements: number[] = [];
      for (const font of testFonts) {
        ctx.font = `16px ${font}`;
        const metrics = ctx.measureText("mmm");
        measurements.push(metrics.width);
      }

      // If all measurements are identical, fonts might be blocked
      return measurements.every((m) => m === measurements[0]);
    } catch (error) {
      return true;
    }
  }

  /**
   * Detect spoofing
   */
  private async detectSpoofing(): Promise<boolean> {
    try {
      // Check for inconsistencies in user agent vs actual capabilities
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;

      // Example: Chrome user agent but no Chrome-specific features
      if (userAgent.includes("Chrome") && !(window as any).chrome) {
        return true;
      }

      // Platform inconsistencies
      if (platform.includes("Win") && !userAgent.includes("Windows")) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect privacy mode
   */
  private async detectPrivacyMode(): Promise<boolean> {
    try {
      // Test localStorage in private mode
      try {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
        return false; // localStorage works, not private
      } catch (error) {
        return true; // localStorage blocked, likely private mode
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate fingerprint hashes
   */
  private async calculateFingerprints(): Promise<
    PluginFingerprint["fingerprints"]
  > {
    try {
      const pluginData = JSON.stringify(this.plugins);
      const mimeTypeData = JSON.stringify(this.mimeTypes);
      const extensionData = JSON.stringify(this.plugins.enabledPlugins);
      const modificationData = JSON.stringify(
        this.plugins.navigator.map((p) => p.name)
      );

      return {
        pluginHash: await calculateSHA256(pluginData),
        mimeTypeHash: await calculateSHA256(mimeTypeData),
        extensionHash: await calculateSHA256(extensionData),
        modificationHash: await calculateSHA256(modificationData),
      };
    } catch (error) {
      return {
        pluginHash: "hash_error",
        mimeTypeHash: "hash_error",
        extensionHash: "hash_error",
        modificationHash: "hash_error",
      };
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Plugin enumeration success
    confidence += this.plugins.count > 0 ? 1 : 0.5;
    factors++;

    // MIME type enumeration success
    confidence += this.mimeTypes.count > 0 ? 1 : 0.5;
    factors++;

    // Extension detection completeness
    const extensionCategories = [
      "adBlocker",
      "passwordManager",
      "vpnExtension",
      "developerExtensions",
    ];
    const detectedCategories = extensionCategories.filter((cat) =>
      this.plugins.enabledPlugins.some((plugin) =>
        plugin.toLowerCase().includes(cat.toLowerCase())
      )
    ).length;
    confidence += Math.min(1, detectedCategories / 2);
    factors++;

    // Automation detection accuracy
    confidence += this.AUTOMATION_INDICATORS.length > 0 ? 1 : 0.5;
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): PluginFingerprint {
    return {
      available: false,
      plugins: {
        navigator: [],
        count: 0,
        enabledPlugins: [],
        disabledPlugins: [],
      },
      mimeTypes: {
        supported: [],
        count: 0,
        categories: {},
      },
      extensions: {
        detected: [],
        adBlocker: false,
        passwordManager: false,
        vpnExtension: false,
        developerExtensions: false,
        customExtensions: [],
      },
      automation: {
        selenium: false,
        puppeteer: false,
        playwright: false,
        webDriver: false,
        headless: false,
        automationIndicators: [],
      },
      developerTools: {
        open: false,
        orientation: "",
        detected: false,
        debuggerPresent: false,
        consoleModified: false,
      },
      modifications: {
        windowProperties: [],
        prototypeChanges: [],
        globalVariables: [],
        functionOverrides: [],
        nativeCodeModified: false,
      },
      security: {
        cspBlocked: false,
        mixedContent: false,
        secureContext: false,
        permissions: {},
      },
      browserFeatures: {
        webgl: false,
        webrtc: false,
        geolocation: false,
        notifications: false,
        camera: false,
        microphone: false,
        clipboard: false,
        fullscreen: false,
      },
      fingerprintResistance: {
        canvasBlocked: false,
        audioBlocked: false,
        webglBlocked: false,
        fontsBlocked: false,
        spoofingDetected: false,
        privacyMode: false,
      },
      fingerprints: {
        pluginHash: "unavailable",
        mimeTypeHash: "unavailable",
        extensionHash: "unavailable",
        modificationHash: "unavailable",
      },
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      errorCount,
    };
  }
}

/**
 * Collect comprehensive plugin and extension fingerprint
 */
export async function collectPluginFingerprint(): Promise<PluginFingerprint> {
  const fingerprinter = new PluginExtensionFingerprinting();
  return await fingerprinter.collectFingerprint();
}
