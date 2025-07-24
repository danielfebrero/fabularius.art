/**
 * Enhanced User Agent Parser for browser and OS detection
 */

export interface ParsedUserAgent {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
}

export class UserAgentParser {
  /**
   * Parse user agent string to extract browser and OS information
   */
  static parse(userAgent: string): ParsedUserAgent {
    if (!userAgent) {
      return {
        browserName: "Unknown",
        browserVersion: "Unknown",
        osName: "Unknown",
        osVersion: "Unknown",
        deviceType: "unknown",
      };
    }

    const browser = this.parseBrowser(userAgent);
    const os = this.parseOS(userAgent);
    const deviceType = this.parseDeviceType(userAgent);

    return {
      browserName: browser.name,
      browserVersion: browser.version,
      osName: os.name,
      osVersion: os.version,
      deviceType,
    };
  }

  /**
   * Parse browser information from user agent
   */
  private static parseBrowser(userAgent: string): {
    name: string;
    version: string;
  } {
    // Chrome and Chromium-based browsers
    if (userAgent.includes("Chrome/")) {
      if (userAgent.includes("Edg/")) {
        const version = this.extractVersion(userAgent, /Edg\/([0-9.]+)/);
        return { name: "Microsoft Edge", version };
      }
      if (userAgent.includes("OPR/")) {
        const version = this.extractVersion(userAgent, /OPR\/([0-9.]+)/);
        return { name: "Opera", version };
      }
      if (userAgent.includes("Brave/")) {
        const version = this.extractVersion(userAgent, /Chrome\/([0-9.]+)/);
        return { name: "Brave", version };
      }
      if (userAgent.includes("Vivaldi/")) {
        const version = this.extractVersion(userAgent, /Vivaldi\/([0-9.]+)/);
        return { name: "Vivaldi", version };
      }
      const version = this.extractVersion(userAgent, /Chrome\/([0-9.]+)/);
      return { name: "Chrome", version };
    }

    // Firefox
    if (userAgent.includes("Firefox/")) {
      const version = this.extractVersion(userAgent, /Firefox\/([0-9.]+)/);
      return { name: "Firefox", version };
    }

    // Safari
    if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
      const version = this.extractVersion(userAgent, /Version\/([0-9.]+)/);
      return { name: "Safari", version };
    }

    // Internet Explorer
    if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
      if (userAgent.includes("MSIE")) {
        const version = this.extractVersion(userAgent, /MSIE ([0-9.]+)/);
        return { name: "Internet Explorer", version };
      } else {
        const version = this.extractVersion(userAgent, /rv:([0-9.]+)/);
        return { name: "Internet Explorer", version };
      }
    }

    // Fallback
    return { name: "Unknown", version: "Unknown" };
  }

  /**
   * Parse operating system information from user agent
   */
  private static parseOS(userAgent: string): { name: string; version: string } {
    // Windows
    if (userAgent.includes("Windows NT")) {
      const version = this.extractVersion(userAgent, /Windows NT ([0-9.]+)/);
      const windowsVersion = this.mapWindowsVersion(version);
      return { name: "Windows", version: windowsVersion };
    }

    // macOS
    if (userAgent.includes("Mac OS X")) {
      const version = this.extractVersion(
        userAgent,
        /Mac OS X ([0-9_]+)/
      ).replace(/_/g, ".");
      return { name: "macOS", version };
    }

    // iOS
    if (userAgent.includes("iPhone OS") || userAgent.includes("OS ")) {
      const version = this.extractVersion(userAgent, /OS ([0-9_]+)/).replace(
        /_/g,
        "."
      );
      return { name: "iOS", version };
    }

    // Android
    if (userAgent.includes("Android")) {
      const version = this.extractVersion(userAgent, /Android ([0-9.]+)/);
      return { name: "Android", version };
    }

    // Linux
    if (userAgent.includes("Linux")) {
      return { name: "Linux", version: "Unknown" };
    }

    // Ubuntu
    if (userAgent.includes("Ubuntu")) {
      const version =
        this.extractVersion(userAgent, /Ubuntu\/([0-9.]+)/) || "Unknown";
      return { name: "Ubuntu", version };
    }

    // Chrome OS
    if (userAgent.includes("CrOS")) {
      return { name: "Chrome OS", version: "Unknown" };
    }

    return { name: "Unknown", version: "Unknown" };
  }

  /**
   * Parse device type from user agent
   */
  private static parseDeviceType(
    userAgent: string
  ): "desktop" | "mobile" | "tablet" | "unknown" {
    // Mobile indicators
    if (
      userAgent.includes("Mobile") ||
      userAgent.includes("iPhone") ||
      (userAgent.includes("Android") && userAgent.includes("Mobile"))
    ) {
      return "mobile";
    }

    // Tablet indicators
    if (
      userAgent.includes("iPad") ||
      (userAgent.includes("Android") && !userAgent.includes("Mobile")) ||
      userAgent.includes("Tablet")
    ) {
      return "tablet";
    }

    // Desktop indicators
    if (
      userAgent.includes("Windows") ||
      userAgent.includes("Macintosh") ||
      userAgent.includes("Linux") ||
      userAgent.includes("X11")
    ) {
      return "desktop";
    }

    return "unknown";
  }

  /**
   * Extract version using regex pattern
   */
  private static extractVersion(userAgent: string, regex: RegExp): string {
    const match = userAgent.match(regex);
    return match ? match[1] || "Unknown" : "Unknown";
  }

  /**
   * Map Windows NT version to user-friendly names
   */
  private static mapWindowsVersion(ntVersion: string): string {
    const versionMap: { [key: string]: string } = {
      "10.0": "Windows 10/11",
      "6.3": "Windows 8.1",
      "6.2": "Windows 8",
      "6.1": "Windows 7",
      "6.0": "Windows Vista",
      "5.2": "Windows XP x64",
      "5.1": "Windows XP",
      "5.0": "Windows 2000",
    };

    return versionMap[ntVersion] || `Windows NT ${ntVersion}`;
  }

  /**
   * Get device category for fingerprinting
   */
  static getDeviceCategory(
    userAgent: string
  ): "desktop" | "mobile" | "tablet" | "unknown" {
    return this.parseDeviceType(userAgent);
  }

  /**
   * Check if user agent indicates a bot/crawler
   */
  static isBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /googlebot/i,
      /bingbot/i,
      /slackbot/i,
      /twitterbot/i,
      /facebookexternalhit/i,
      /linkedinbot/i,
      /whatsapp/i,
      /telegrambot/i,
    ];

    return botPatterns.some((pattern) => pattern.test(userAgent));
  }
}
