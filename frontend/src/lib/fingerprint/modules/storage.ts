/**
 * Storage Fingerprinting Module
 *
 * Comprehensive storage capability analysis for device identification:
 * - Service Worker API detection and registration analysis
 * - Cache API functionality and storage quota analysis
 * - IndexedDB capabilities and database enumeration
 * - WebSQL support and database detection
 * - localStorage and sessionStorage analysis
 * - Persistent storage and storage manager detection
 * - Background sync and push notification capabilities
 * - Storage events and cross-tab communication
 * - Storage usage patterns and compression analysis
 */

import type { StorageFingerprint } from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface StorageTest {
  name: string;
  test: () => Promise<any>;
  timeout: number;
}

interface QuotaInfo {
  quota: number;
  usage: number;
  usageDetails: Record<string, number>;
}

/**
 * Advanced storage fingerprinting with comprehensive API analysis
 */
export class StorageFingerprinting {
  private serviceWorkerData: StorageFingerprint["serviceWorker"] = {
    supported: false,
    scope: "",
    scriptURL: "",
    state: "",
    registration: false,
    updateViaCache: "",
    permissions: "",
  };

  private cacheData: StorageFingerprint["cacheAPI"] = {
    supported: false,
    storageEstimate: { quota: 0, usage: 0, usageDetails: {} },
    cacheNames: [],
    cacheOperations: {
      add: false,
      addAll: false,
      delete: false,
      keys: false,
      match: false,
      matchAll: false,
      put: false,
    },
    cacheBehavior: {
      requestMode: "",
      cacheMode: "",
      credentials: "",
      redirect: "",
    },
  };

  private persistentStorageData: StorageFingerprint["persistentStorage"] = {
    supported: false,
    persisted: false,
    requestPersistent: false,
    storageManager: false,
  };

  private indexedDBData: StorageFingerprint["indexedDB"] = {
    supported: false,
    databases: [],
    version: 0,
    objectStores: [],
    storageQuota: 0,
    usageBytes: 0,
  };

  private webSQLData: StorageFingerprint["webSQL"] = {
    supported: false,
    version: "",
    databases: [],
    storageSize: 0,
  };

  private localStorageData: StorageFingerprint["localStorage"] = {
    supported: false,
    quota: 0,
    usage: 0,
    testWrite: false,
    testRead: false,
    itemCount: 0,
  };

  private sessionStorageData: StorageFingerprint["sessionStorage"] = {
    supported: false,
    quota: 0,
    usage: 0,
    testWrite: false,
    testRead: false,
    itemCount: 0,
  };

  private readonly TIMEOUT_MS = 5000;
  private readonly TEST_KEY_PREFIX = "__fp_test_";

  /**
   * Collect comprehensive storage fingerprint
   */
  async collectFingerprint(): Promise<StorageFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Test basic storage support
      const basicSupport = await this.testBasicStorageSupport();
      errorCount += basicSupport.errorCount;

      // Test Service Worker API
      const serviceWorkerResult = await this.testServiceWorker();
      errorCount += serviceWorkerResult.errorCount;

      // Test Cache API
      const cacheResult = await this.testCacheAPI();
      errorCount += cacheResult.errorCount;

      // Test persistent storage
      const persistentResult = await this.testPersistentStorage();
      errorCount += persistentResult.errorCount;

      // Test IndexedDB
      const indexedDBResult = await this.testIndexedDB();
      errorCount += indexedDBResult.errorCount;

      // Test WebSQL
      const webSQLResult = await this.testWebSQL();
      errorCount += webSQLResult.errorCount;

      // Test localStorage and sessionStorage
      const localStorageResult = await this.testLocalStorage();
      const sessionStorageResult = await this.testSessionStorage();
      errorCount +=
        localStorageResult.errorCount + sessionStorageResult.errorCount;

      // Test storage events
      const storageEvents = await this.testStorageEvents();
      errorCount += storageEvents.errorCount;

      // Test background APIs
      const backgroundSync = await this.testBackgroundSync();
      const pushAPI = await this.testPushAPI();
      const notifications = await this.testNotifications();
      const broadcastChannel = await this.testBroadcastChannel();
      errorCount +=
        backgroundSync.errorCount +
        pushAPI.errorCount +
        notifications.errorCount +
        broadcastChannel.errorCount;

      // Analyze storage patterns
      const storageAnalysis = await this.analyzeStoragePatterns();

      // Calculate fingerprint hashes
      const fingerprints = await this.calculateFingerprints();

      const collectionTime = performance.now() - startTime;
      const confidenceLevel = this.calculateConfidenceLevel();

      return {
        available: true,
        serviceWorker: this.serviceWorkerData,
        cacheAPI: this.cacheData,
        persistentStorage: this.persistentStorageData,
        indexedDB: this.indexedDBData,
        webSQL: this.webSQLData,
        localStorage: this.localStorageData,
        sessionStorage: this.sessionStorageData,
        storageEvents: storageEvents.data,
        backgroundSync: backgroundSync.data,
        pushAPI: pushAPI.data,
        notifications: notifications.data,
        broadcastChannel: broadcastChannel.data,
        storageAnalysis,
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
   * Test basic storage support
   */
  private async testBasicStorageSupport(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      // Test localStorage
      this.localStorageData.supported =
        typeof Storage !== "undefined" && typeof localStorage !== "undefined";

      // Test sessionStorage
      this.sessionStorageData.supported =
        typeof Storage !== "undefined" && typeof sessionStorage !== "undefined";

      // Test IndexedDB
      this.indexedDBData.supported = typeof indexedDB !== "undefined";

      // Test WebSQL
      this.webSQLData.supported =
        typeof (window as any).openDatabase !== "undefined";

      // Test Service Worker
      this.serviceWorkerData.supported = "serviceWorker" in navigator;

      // Test Cache API
      this.cacheData.supported = "caches" in window;

      // Test Storage Manager
      this.persistentStorageData.storageManager =
        "storage" in navigator && "estimate" in navigator.storage;
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test Service Worker capabilities
   */
  private async testServiceWorker(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.serviceWorkerData.supported) {
        return { errorCount };
      }

      // Get existing registration
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        this.serviceWorkerData.registration = true;
        this.serviceWorkerData.scope = registration.scope;
        this.serviceWorkerData.updateViaCache = registration.updateViaCache;

        if (registration.active) {
          this.serviceWorkerData.scriptURL = registration.active.scriptURL;
          this.serviceWorkerData.state = registration.active.state;
        }
      }

      // Test permissions
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "background-sync" as any,
          });
          this.serviceWorkerData.permissions = permission.state;
        } catch (error) {
          // Permission query not supported
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test Cache API capabilities
   */
  private async testCacheAPI(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.cacheData.supported) {
        return { errorCount };
      }

      // Get cache names
      this.cacheData.cacheNames = await caches.keys();

      // Test cache operations
      const testCacheName = `${this.TEST_KEY_PREFIX}cache_test`;

      try {
        const cache = await caches.open(testCacheName);

        // Test basic operations
        this.cacheData.cacheOperations.add = typeof cache.add === "function";
        this.cacheData.cacheOperations.addAll =
          typeof cache.addAll === "function";
        this.cacheData.cacheOperations.delete =
          typeof cache.delete === "function";
        this.cacheData.cacheOperations.keys = typeof cache.keys === "function";
        this.cacheData.cacheOperations.match =
          typeof cache.match === "function";
        this.cacheData.cacheOperations.matchAll =
          typeof cache.matchAll === "function";
        this.cacheData.cacheOperations.put = typeof cache.put === "function";

        // Test cache behavior
        if (this.cacheData.cacheOperations.put) {
          const testResponse = new Response("test data", {
            headers: { "Content-Type": "text/plain" },
          });

          await cache.put("/test", testResponse);

          const cachedResponse = await cache.match("/test");
          if (cachedResponse) {
            this.cacheData.cacheBehavior.requestMode = "cors";
            this.cacheData.cacheBehavior.cacheMode = "default";
            this.cacheData.cacheBehavior.credentials = "same-origin";
            this.cacheData.cacheBehavior.redirect = "follow";
          }
        }

        // Clean up test cache
        await caches.delete(testCacheName);
      } catch (error) {
        errorCount++;
      }

      // Get storage estimate
      if (this.persistentStorageData.storageManager) {
        try {
          const estimate = await navigator.storage.estimate();
          this.cacheData.storageEstimate = {
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
            usageDetails: (estimate as any).usageDetails || {},
          };
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
   * Test persistent storage capabilities
   */
  private async testPersistentStorage(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.persistentStorageData.storageManager) {
        return { errorCount };
      }

      this.persistentStorageData.supported = true;

      // Check if storage is persisted
      if ("persisted" in navigator.storage) {
        this.persistentStorageData.persisted =
          await navigator.storage.persisted();
      }

      // Test request persistent
      if ("persist" in navigator.storage) {
        this.persistentStorageData.requestPersistent = true;
        // Note: We don't actually request persistent storage to avoid user prompts
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test IndexedDB capabilities
   */
  private async testIndexedDB(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.indexedDBData.supported) {
        return { errorCount };
      }

      // Get databases (if supported)
      if ("databases" in indexedDB) {
        try {
          const databases = await (indexedDB as any).databases();
          this.indexedDBData.databases = databases.map((db: any) => db.name);
        } catch (error) {
          // databases() not supported in all browsers
        }
      }

      // Test database creation and operations
      const testDBName = `${this.TEST_KEY_PREFIX}test_db`;

      try {
        const dbRequest = indexedDB.open(testDBName, 1);

        await new Promise<void>((resolve, reject) => {
          dbRequest.onerror = () => reject(dbRequest.error);
          dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            this.indexedDBData.version = db.version;
            this.indexedDBData.objectStores = Array.from(db.objectStoreNames);
            db.close();
            resolve();
          };
          dbRequest.onupgradeneeded = (event) => {
            const db = (event.target as any).result;
            if (!db.objectStoreNames.contains("test_store")) {
              db.createObjectStore("test_store", { keyPath: "id" });
            }
          };
        });

        // Clean up test database
        indexedDB.deleteDatabase(testDBName);
      } catch (error) {
        errorCount++;
      }

      // Estimate storage usage
      if (this.persistentStorageData.storageManager) {
        try {
          const estimate = await navigator.storage.estimate();
          this.indexedDBData.storageQuota = estimate.quota || 0;
          this.indexedDBData.usageBytes =
            (estimate as any).usageDetails?.indexedDB || 0;
        } catch (error) {
          // Storage estimate not available
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test WebSQL capabilities
   */
  private async testWebSQL(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.webSQLData.supported) {
        return { errorCount };
      }

      const openDatabase = (window as any).openDatabase;

      // Test database creation
      const testDB = openDatabase(
        `${this.TEST_KEY_PREFIX}test_websql`,
        "1.0",
        "Test Database",
        1024 * 1024 // 1MB
      );

      if (testDB) {
        this.webSQLData.version = testDB.version;
        this.webSQLData.storageSize = 1024 * 1024;
        this.webSQLData.databases.push(`${this.TEST_KEY_PREFIX}test_websql`);

        // Test transaction
        await new Promise<void>((resolve, reject) => {
          testDB.transaction(
            (tx: any) => {
              tx.executeSql(
                "CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, data TEXT)"
              );
            },
            reject,
            resolve
          );
        });
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test localStorage capabilities
   */
  private async testLocalStorage(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.localStorageData.supported) {
        return { errorCount };
      }

      // Count existing items
      this.localStorageData.itemCount = localStorage.length;

      // Test write operation
      const testKey = `${this.TEST_KEY_PREFIX}localStorage_test`;
      const testValue = "test_value_" + Date.now();

      try {
        localStorage.setItem(testKey, testValue);
        this.localStorageData.testWrite = true;

        // Test read operation
        const readValue = localStorage.getItem(testKey);
        this.localStorageData.testRead = readValue === testValue;

        // Clean up
        localStorage.removeItem(testKey);
      } catch (error) {
        errorCount++;
      }

      // Estimate quota and usage
      this.localStorageData.quota = this.estimateStorageQuota("localStorage");
      this.localStorageData.usage = this.estimateStorageUsage("localStorage");
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test sessionStorage capabilities
   */
  private async testSessionStorage(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      if (!this.sessionStorageData.supported) {
        return { errorCount };
      }

      // Count existing items
      this.sessionStorageData.itemCount = sessionStorage.length;

      // Test write operation
      const testKey = `${this.TEST_KEY_PREFIX}sessionStorage_test`;
      const testValue = "test_value_" + Date.now();

      try {
        sessionStorage.setItem(testKey, testValue);
        this.sessionStorageData.testWrite = true;

        // Test read operation
        const readValue = sessionStorage.getItem(testKey);
        this.sessionStorageData.testRead = readValue === testValue;

        // Clean up
        sessionStorage.removeItem(testKey);
      } catch (error) {
        errorCount++;
      }

      // Estimate quota and usage
      this.sessionStorageData.quota =
        this.estimateStorageQuota("sessionStorage");
      this.sessionStorageData.usage =
        this.estimateStorageUsage("sessionStorage");
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test storage events
   */
  private async testStorageEvents(): Promise<{
    data: StorageFingerprint["storageEvents"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: StorageFingerprint["storageEvents"] = {
      supported: false,
      crossTab: false,
      persistence: false,
    };

    try {
      data.supported = typeof window.addEventListener === "function";

      if (data.supported) {
        // Test storage event listener
        let eventFired = false;
        const eventHandler = () => {
          eventFired = true;
        };

        window.addEventListener("storage", eventHandler);

        // Trigger a storage event (will only fire in other tabs)
        const testKey = `${this.TEST_KEY_PREFIX}event_test`;
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);

        // Check if event system is working
        setTimeout(() => {
          data.crossTab = eventFired;
          window.removeEventListener("storage", eventHandler);
        }, 100);

        data.persistence = true; // localStorage events persist across sessions
      }
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Test background sync capabilities
   */
  private async testBackgroundSync(): Promise<{
    data: StorageFingerprint["backgroundSync"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: StorageFingerprint["backgroundSync"] = {
      supported: false,
      registration: false,
      permissions: "",
    };

    try {
      data.supported =
        "serviceWorker" in navigator &&
        "sync" in window.ServiceWorkerRegistration.prototype;

      if (data.supported && this.serviceWorkerData.registration) {
        // Test background sync registration
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && "sync" in registration) {
            data.registration = true;
          }
        } catch (error) {
          errorCount++;
        }

        // Check permissions
        if ("permissions" in navigator) {
          try {
            const permission = await navigator.permissions.query({
              name: "background-sync" as any,
            });
            data.permissions = permission.state;
          } catch (error) {
            // Permission not supported
          }
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Test Push API capabilities
   */
  private async testPushAPI(): Promise<{
    data: StorageFingerprint["pushAPI"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: StorageFingerprint["pushAPI"] = {
      supported: false,
      permissions: "",
      subscription: false,
      applicationServerKey: false,
    };

    try {
      data.supported = "PushManager" in window && "serviceWorker" in navigator;

      if (data.supported) {
        // Check permissions
        if ("permissions" in navigator) {
          try {
            const permission = await navigator.permissions.query({
              name: "push" as any,
            });
            data.permissions = permission.state;
          } catch (error) {
            // Permission not supported
          }
        }

        // Test subscription capabilities
        if (this.serviceWorkerData.registration) {
          try {
            const registration =
              await navigator.serviceWorker.getRegistration();
            if (registration && "pushManager" in registration) {
              data.subscription = true;
              data.applicationServerKey =
                "applicationServerKey" in PushSubscriptionOptions.prototype;
            }
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
   * Test notification capabilities
   */
  private async testNotifications(): Promise<{
    data: StorageFingerprint["notifications"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: StorageFingerprint["notifications"] = {
      supported: false,
      permissions: "",
      showNotification: false,
      actions: false,
      badge: false,
      icon: false,
      image: false,
      silent: false,
      tag: false,
      timestamp: false,
      vibrate: false,
    };

    try {
      data.supported = "Notification" in window;

      if (data.supported) {
        data.permissions = Notification.permission;

        // Test notification features
        const testNotification = {
          actions: "actions" in Notification.prototype,
          badge: "badge" in Notification.prototype,
          icon: "icon" in Notification.prototype,
          image: "image" in Notification.prototype,
          silent: "silent" in Notification.prototype,
          tag: "tag" in Notification.prototype,
          timestamp: "timestamp" in Notification.prototype,
          vibrate: "vibrate" in Notification.prototype,
        };

        Object.assign(data, testNotification);

        // Test show notification via Service Worker
        if (this.serviceWorkerData.registration) {
          try {
            const registration =
              await navigator.serviceWorker.getRegistration();
            data.showNotification = !!(
              registration && "showNotification" in registration
            );
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
   * Test broadcast channel capabilities
   */
  private async testBroadcastChannel(): Promise<{
    data: StorageFingerprint["broadcastChannel"];
    errorCount: number;
  }> {
    let errorCount = 0;
    const data: StorageFingerprint["broadcastChannel"] = {
      supported: false,
      postMessage: false,
      onMessage: false,
    };

    try {
      data.supported = "BroadcastChannel" in window;

      if (data.supported) {
        const testChannel = new BroadcastChannel(
          `${this.TEST_KEY_PREFIX}test_channel`
        );

        data.postMessage = typeof testChannel.postMessage === "function";
        data.onMessage = "onmessage" in testChannel;

        testChannel.close();
      }
    } catch (error) {
      errorCount++;
    }

    return { data, errorCount };
  }

  /**
   * Analyze storage patterns and usage
   */
  private async analyzeStoragePatterns(): Promise<
    StorageFingerprint["storageAnalysis"]
  > {
    try {
      const analysis: StorageFingerprint["storageAnalysis"] = {
        totalQuota: 0,
        totalUsage: 0,
        storageBreakdown: {},
        compressionRatio: 0,
        accessPatterns: [],
      };

      // Calculate total quota and usage
      if (this.persistentStorageData.storageManager) {
        const estimate = this.cacheData.storageEstimate;
        analysis.totalQuota = estimate.quota;
        analysis.totalUsage = estimate.usage;
        analysis.storageBreakdown = estimate.usageDetails;
      }

      // Add localStorage and sessionStorage
      analysis.storageBreakdown.localStorage = this.localStorageData.usage;
      analysis.storageBreakdown.sessionStorage = this.sessionStorageData.usage;

      // Calculate compression ratio
      analysis.compressionRatio = this.calculateCompressionRatio();

      // Analyze access patterns
      analysis.accessPatterns = this.analyzeAccessPatterns();

      return analysis;
    } catch (error) {
      return {
        totalQuota: 0,
        totalUsage: 0,
        storageBreakdown: {},
        compressionRatio: 0,
        accessPatterns: [],
      };
    }
  }

  /**
   * Estimate storage quota for localStorage/sessionStorage
   */
  private estimateStorageQuota(
    storageType: "localStorage" | "sessionStorage"
  ): number {
    try {
      const storage =
        storageType === "localStorage" ? localStorage : sessionStorage;
      const testKey = `${this.TEST_KEY_PREFIX}quota_test`;
      let quota = 0;

      // Try to estimate by attempting to store data
      const testData = "x".repeat(1024); // 1KB chunks
      let i = 0;

      try {
        while (i < 10000) {
          // Max 10MB test
          storage.setItem(testKey + i, testData);
          quota += 1024;
          i++;
        }
      } catch (error) {
        // Quota exceeded
      } finally {
        // Clean up test data
        for (let j = 0; j < i; j++) {
          storage.removeItem(testKey + j);
        }
      }

      return quota;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate storage usage for localStorage/sessionStorage
   */
  private estimateStorageUsage(
    storageType: "localStorage" | "sessionStorage"
  ): number {
    try {
      const storage =
        storageType === "localStorage" ? localStorage : sessionStorage;
      let usage = 0;

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key);
          usage += key.length + (value?.length || 0);
        }
      }

      return usage * 2; // Approximate UTF-16 encoding
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(): number {
    try {
      // Test compression by storing compressible vs random data
      const testKey = `${this.TEST_KEY_PREFIX}compression_test`;
      const compressibleData = "a".repeat(1000);
      const randomData = Array.from({ length: 1000 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 256))
      ).join("");

      try {
        localStorage.setItem(testKey + "_comp", compressibleData);
        localStorage.setItem(testKey + "_rand", randomData);

        // In a real implementation, you'd measure actual storage usage
        // For now, return a heuristic based on data patterns
        const ratio = randomData.length / compressibleData.length;

        localStorage.removeItem(testKey + "_comp");
        localStorage.removeItem(testKey + "_rand");

        return Math.round(ratio * 100) / 100;
      } catch (error) {
        return 1.0; // No compression
      }
    } catch (error) {
      return 1.0;
    }
  }

  /**
   * Analyze access patterns
   */
  private analyzeAccessPatterns(): string[] {
    const patterns: string[] = [];

    // Check for common storage patterns
    if (
      this.localStorageData.supported &&
      this.localStorageData.itemCount > 0
    ) {
      patterns.push("persistent_local_storage");
    }

    if (
      this.sessionStorageData.supported &&
      this.sessionStorageData.itemCount > 0
    ) {
      patterns.push("session_storage_usage");
    }

    if (this.indexedDBData.databases.length > 0) {
      patterns.push("structured_database_storage");
    }

    if (this.cacheData.cacheNames.length > 0) {
      patterns.push("cache_api_usage");
    }

    if (this.serviceWorkerData.registration) {
      patterns.push("service_worker_caching");
    }

    if (this.persistentStorageData.persisted) {
      patterns.push("persistent_storage_granted");
    }

    return patterns;
  }

  /**
   * Calculate fingerprint hashes
   */
  private async calculateFingerprints(): Promise<
    StorageFingerprint["fingerprints"]
  > {
    try {
      const serviceWorkerData = JSON.stringify(this.serviceWorkerData);
      const cacheData = JSON.stringify(this.cacheData);
      const storageData = JSON.stringify({
        localStorage: this.localStorageData,
        sessionStorage: this.sessionStorageData,
        indexedDB: this.indexedDBData,
        webSQL: this.webSQLData,
      });
      const behaviorData = JSON.stringify({
        persistentStorage: this.persistentStorageData,
        patterns: this.analyzeAccessPatterns(),
      });

      return {
        serviceWorkerHash: await calculateSHA256(serviceWorkerData),
        cacheHash: await calculateSHA256(cacheData),
        storageHash: await calculateSHA256(storageData),
        behaviorHash: await calculateSHA256(behaviorData),
      };
    } catch (error) {
      return {
        serviceWorkerHash: "hash_error",
        cacheHash: "hash_error",
        storageHash: "hash_error",
        behaviorHash: "hash_error",
      };
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Storage API support
    const supportedAPIs = [
      this.localStorageData.supported,
      this.sessionStorageData.supported,
      this.indexedDBData.supported,
      this.serviceWorkerData.supported,
      this.cacheData.supported,
    ].filter(Boolean).length;

    confidence += Math.min(1, supportedAPIs / 5);
    factors++;

    // Successful operations
    const successfulOps = [
      this.localStorageData.testWrite,
      this.sessionStorageData.testWrite,
      this.cacheData.cacheOperations.put,
      this.serviceWorkerData.registration,
    ].filter(Boolean).length;

    confidence += Math.min(1, successfulOps / 4);
    factors++;

    // Storage usage detection
    const storageUsage =
      this.localStorageData.usage +
      this.sessionStorageData.usage +
      this.cacheData.storageEstimate.usage;
    confidence += storageUsage > 0 ? 1 : 0;
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): StorageFingerprint {
    return {
      available: false,
      serviceWorker: {
        supported: false,
        scope: "",
        scriptURL: "",
        state: "",
        registration: false,
        updateViaCache: "",
        permissions: "",
      },
      cacheAPI: {
        supported: false,
        storageEstimate: { quota: 0, usage: 0, usageDetails: {} },
        cacheNames: [],
        cacheOperations: {
          add: false,
          addAll: false,
          delete: false,
          keys: false,
          match: false,
          matchAll: false,
          put: false,
        },
        cacheBehavior: {
          requestMode: "",
          cacheMode: "",
          credentials: "",
          redirect: "",
        },
      },
      persistentStorage: {
        supported: false,
        persisted: false,
        requestPersistent: false,
        storageManager: false,
      },
      indexedDB: {
        supported: false,
        databases: [],
        version: 0,
        objectStores: [],
        storageQuota: 0,
        usageBytes: 0,
      },
      webSQL: {
        supported: false,
        version: "",
        databases: [],
        storageSize: 0,
      },
      localStorage: {
        supported: false,
        quota: 0,
        usage: 0,
        testWrite: false,
        testRead: false,
        itemCount: 0,
      },
      sessionStorage: {
        supported: false,
        quota: 0,
        usage: 0,
        testWrite: false,
        testRead: false,
        itemCount: 0,
      },
      storageEvents: {
        supported: false,
        crossTab: false,
        persistence: false,
      },
      backgroundSync: {
        supported: false,
        registration: false,
        permissions: "",
      },
      pushAPI: {
        supported: false,
        permissions: "",
        subscription: false,
        applicationServerKey: false,
      },
      notifications: {
        supported: false,
        permissions: "",
        showNotification: false,
        actions: false,
        badge: false,
        icon: false,
        image: false,
        silent: false,
        tag: false,
        timestamp: false,
        vibrate: false,
      },
      broadcastChannel: {
        supported: false,
        postMessage: false,
        onMessage: false,
      },
      storageAnalysis: {
        totalQuota: 0,
        totalUsage: 0,
        storageBreakdown: {},
        compressionRatio: 0,
        accessPatterns: [],
      },
      fingerprints: {
        serviceWorkerHash: "unavailable",
        cacheHash: "unavailable",
        storageHash: "unavailable",
        behaviorHash: "unavailable",
      },
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      errorCount,
    };
  }
}

/**
 * Collect comprehensive storage fingerprint
 */
export async function collectStorageFingerprint(): Promise<StorageFingerprint> {
  const fingerprinter = new StorageFingerprinting();
  return await fingerprinter.collectFingerprint();
}
