/**
 * Frontend Fingerprint Data Retention Manager
 * Handles client-side data lifecycle and GDPR compliance
 */

export interface RetentionPolicy {
  policyName: string;
  description: string;
  retentionPeriodDays: number;
  autoCleanup: boolean;
  gdprCompliant: boolean;
  dataTypes: string[];
  conditions?: RetentionCondition[];
}

export interface RetentionCondition {
  field: string;
  operator: "gt" | "lt" | "eq" | "contains" | "not_null";
  value: any;
  description: string;
}

export interface DataRetentionRequest {
  userId?: string;
  fingerprintId?: string;
  policy: string;
  reason:
    | "expired"
    | "user_request"
    | "gdpr_deletion"
    | "inactive_user"
    | "manual";
  requestedBy: string;
  timestamp: number;
}

export interface RetentionReport {
  totalRecords: number;
  eligibleForDeletion: number;
  actuallyDeleted: number;
  errors: string[];
  policies: Array<{
    policy: string;
    recordsProcessed: number;
    recordsDeleted: number;
  }>;
  processingTimeMs: number;
  gdprCompliance: {
    userRequestsProcessed: number;
    auditLogCreated: boolean;
    complianceVerified: boolean;
  };
}

/**
 * Default retention policies for different data types
 */
export const DEFAULT_RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  active_user_fingerprints: {
    policyName: "Active User Fingerprints",
    description: "Fingerprints for users with recent activity",
    retentionPeriodDays: 365, // 1 year
    autoCleanup: false,
    gdprCompliant: true,
    dataTypes: ["core_fingerprint", "advanced_fingerprint", "behavioral_data"],
    conditions: [
      {
        field: "lastSeen",
        operator: "gt",
        value: 30, // days
        description: "User activity within 30 days",
      },
    ],
  },

  inactive_user_fingerprints: {
    policyName: "Inactive User Fingerprints",
    description: "Fingerprints for users without recent activity",
    retentionPeriodDays: 90, // 3 months
    autoCleanup: true,
    gdprCompliant: true,
    dataTypes: ["core_fingerprint", "advanced_fingerprint"],
    conditions: [
      {
        field: "lastSeen",
        operator: "lt",
        value: 90, // days
        description: "No user activity for 90+ days",
      },
    ],
  },

  anonymous_fingerprints: {
    policyName: "Anonymous Fingerprints",
    description: "Fingerprints without user association",
    retentionPeriodDays: 30, // 1 month
    autoCleanup: true,
    gdprCompliant: true,
    dataTypes: ["core_fingerprint", "session_data"],
    conditions: [
      {
        field: "userId",
        operator: "eq",
        value: null,
        description: "No associated user ID",
      },
    ],
  },

  session_data: {
    policyName: "Session Data",
    description: "Temporary session and behavioral data",
    retentionPeriodDays: 7, // 1 week
    autoCleanup: true,
    gdprCompliant: true,
    dataTypes: ["session_events", "temporary_behavioral_data"],
  },

  audit_logs: {
    policyName: "Audit Logs",
    description: "Compliance and audit trail data",
    retentionPeriodDays: 2555, // 7 years
    autoCleanup: false,
    gdprCompliant: true,
    dataTypes: ["audit_events", "gdpr_requests", "deletion_logs"],
  },
};

/**
 * Client-side storage keys for different data types
 */
const STORAGE_KEYS = {
  fingerprints: "ps_fingerprints",
  sessions: "ps_sessions",
  behavioral: "ps_behavioral",
  audit: "ps_audit_logs",
  preferences: "ps_user_preferences",
  gdpr_requests: "ps_gdpr_requests",
};

export class FingerprintRetentionManager {
  private policies: Map<string, RetentionPolicy>;
  private auditTrail: Array<{
    timestamp: number;
    action: string;
    details: any;
  }>;

  constructor(customPolicies?: Record<string, RetentionPolicy>) {
    this.policies = new Map();
    this.auditTrail = [];

    // Load default policies
    Object.entries(DEFAULT_RETENTION_POLICIES).forEach(([key, policy]) => {
      this.policies.set(key, policy);
    });

    // Add custom policies
    if (customPolicies) {
      Object.entries(customPolicies).forEach(([key, policy]) => {
        this.policies.set(key, policy);
      });
    }

    // Initialize automatic cleanup if supported
    this.initializeAutoCleanup();
  }

  /**
   * Process data retention for all applicable policies
   */
  async processRetention(dryRun: boolean = false): Promise<RetentionReport> {
    const startTime = performance.now();
    const report: RetentionReport = {
      totalRecords: 0,
      eligibleForDeletion: 0,
      actuallyDeleted: 0,
      errors: [],
      policies: [],
      processingTimeMs: 0,
      gdprCompliance: {
        userRequestsProcessed: 0,
        auditLogCreated: false,
        complianceVerified: false,
      },
    };

    try {
      console.log("Starting retention processing", { dryRun });

      for (const [policyName, policy] of Array.from(this.policies.entries())) {
        if (!policy.autoCleanup && policyName !== "manual_cleanup") {
          continue; // Skip non-automatic policies
        }

        try {
          const policyResult = await this.processPolicyRetention(
            policy,
            dryRun
          );

          report.policies.push({
            policy: policyName,
            recordsProcessed: policyResult.processed,
            recordsDeleted: policyResult.deleted,
          });

          report.totalRecords += policyResult.processed;
          report.eligibleForDeletion += policyResult.eligible;
          report.actuallyDeleted += policyResult.deleted;
        } catch (error) {
          const errorMsg = `Error processing policy ${policyName}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          report.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Process pending GDPR requests
      const gdprResult = await this.processPendingGDPRRequests(dryRun);
      report.gdprCompliance = gdprResult;

      report.processingTimeMs = performance.now() - startTime;

      // Create audit log
      if (!dryRun) {
        await this.createRetentionAuditLog(report);
        report.gdprCompliance.auditLogCreated = true;
      }

      console.log("Retention processing completed", {
        totalDeleted: report.actuallyDeleted,
        policies: report.policies.length,
        errors: report.errors.length,
        processingTime: report.processingTimeMs,
      });

      return report;
    } catch (error) {
      console.error("Error in retention processing:", error);
      report.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
      report.processingTimeMs = performance.now() - startTime;
      return report;
    }
  }

  /**
   * Process retention for a specific policy
   */
  private async processPolicyRetention(
    policy: RetentionPolicy,
    dryRun: boolean
  ): Promise<{ processed: number; eligible: number; deleted: number }> {
    const result = { processed: 0, eligible: 0, deleted: 0 };

    for (const dataType of policy.dataTypes) {
      const storageKey = this.getStorageKeyForDataType(dataType);
      if (!storageKey) continue;

      try {
        const data = this.getStoredData(storageKey);
        if (!data || !Array.isArray(data)) continue;

        result.processed += data.length;

        // Filter records eligible for deletion
        const eligible = data.filter((record) =>
          this.isEligibleForDeletion(record, policy)
        );

        result.eligible += eligible.length;

        if (!dryRun && eligible.length > 0) {
          // Remove eligible records
          const remaining = data.filter(
            (record) => !this.isEligibleForDeletion(record, policy)
          );

          this.setStoredData(storageKey, remaining);
          result.deleted += eligible.length;

          // Log deletions
          eligible.forEach((record) => {
            this.addAuditLog("data_deleted", {
              policy: policy.policyName,
              dataType,
              recordId: record.id || record.fingerprintId,
              reason: "retention_policy",
            });
          });
        }
      } catch (error) {
        console.error(`Error processing ${dataType}:`, error);
      }
    }

    return result;
  }

  /**
   * Check if a record is eligible for deletion based on policy
   */
  private isEligibleForDeletion(record: any, policy: RetentionPolicy): boolean {
    // Check retention period
    const recordAge = this.getRecordAge(record);
    if (recordAge < policy.retentionPeriodDays) {
      return false;
    }

    // Check additional conditions
    if (policy.conditions) {
      for (const condition of policy.conditions) {
        if (!this.evaluateCondition(record, condition)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get the age of a record in days
   */
  private getRecordAge(record: any): number {
    const recordDate = record.createdAt || record.timestamp || record.lastSeen;
    if (!recordDate) return 0;

    const recordTime =
      typeof recordDate === "string"
        ? new Date(recordDate).getTime()
        : recordDate;

    const ageDays = (Date.now() - recordTime) / (1000 * 60 * 60 * 24);
    return Math.floor(ageDays);
  }

  /**
   * Evaluate a retention condition
   */
  private evaluateCondition(
    record: any,
    condition: RetentionCondition
  ): boolean {
    const fieldValue = record[condition.field];

    switch (condition.operator) {
      case "gt":
        return typeof fieldValue === "number" && fieldValue > condition.value;
      case "lt":
        return typeof fieldValue === "number" && fieldValue < condition.value;
      case "eq":
        return fieldValue === condition.value;
      case "contains":
        return (
          typeof fieldValue === "string" && fieldValue.includes(condition.value)
        );
      case "not_null":
        return fieldValue != null;
      default:
        return false;
    }
  }

  /**
   * Process pending GDPR deletion requests
   */
  private async processPendingGDPRRequests(
    dryRun: boolean
  ): Promise<RetentionReport["gdprCompliance"]> {
    const result = {
      userRequestsProcessed: 0,
      auditLogCreated: false,
      complianceVerified: false,
    };

    try {
      const pendingRequests =
        this.getStoredData(STORAGE_KEYS.gdpr_requests) || [];

      for (const request of pendingRequests) {
        if (request.processed) continue;

        if (!dryRun) {
          await this.processGDPRDeletionRequest(request);
          request.processed = true;
          request.processedAt = Date.now();
        }

        result.userRequestsProcessed++;
      }

      if (!dryRun && pendingRequests.length > 0) {
        this.setStoredData(STORAGE_KEYS.gdpr_requests, pendingRequests);
        result.complianceVerified = true;
      }
    } catch (error) {
      console.error("Error processing GDPR requests:", error);
    }

    return result;
  }

  /**
   * Process a single GDPR deletion request
   */
  private async processGDPRDeletionRequest(
    request: DataRetentionRequest
  ): Promise<void> {
    if (!request.userId && !request.fingerprintId) {
      throw new Error("GDPR request must specify userId or fingerprintId");
    }

    // Delete all user data across storage
    Object.values(STORAGE_KEYS).forEach((storageKey) => {
      try {
        const data = this.getStoredData(storageKey);
        if (!data || !Array.isArray(data)) return;

        const filtered = data.filter((record) => {
          if (request.userId && record.userId === request.userId) return false;
          if (
            request.fingerprintId &&
            record.fingerprintId === request.fingerprintId
          )
            return false;
          return true;
        });

        this.setStoredData(storageKey, filtered);
      } catch (error) {
        console.error(
          `Error processing GDPR deletion for ${storageKey}:`,
          error
        );
      }
    });

    // Create audit trail
    this.addAuditLog("gdpr_deletion", {
      userId: request.userId,
      fingerprintId: request.fingerprintId,
      reason: request.reason,
      requestedBy: request.requestedBy,
      processedAt: Date.now(),
    });
  }

  /**
   * Submit a GDPR deletion request
   */
  async submitGDPRDeletionRequest(
    userId?: string,
    fingerprintId?: string,
    requestedBy: string = "user"
  ): Promise<{ requestId: string; submitted: boolean }> {
    if (!userId && !fingerprintId) {
      throw new Error("Must specify either userId or fingerprintId");
    }

    const requestId = `gdpr_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const request: DataRetentionRequest = {
      userId,
      fingerprintId,
      policy: "gdpr_deletion",
      reason: "gdpr_deletion",
      requestedBy,
      timestamp: Date.now(),
    };

    try {
      const pendingRequests =
        this.getStoredData(STORAGE_KEYS.gdpr_requests) || [];
      pendingRequests.push({ ...request, requestId, processed: false });
      this.setStoredData(STORAGE_KEYS.gdpr_requests, pendingRequests);

      this.addAuditLog("gdpr_request_submitted", {
        requestId,
        userId,
        fingerprintId,
        requestedBy,
      });

      console.log("GDPR deletion request submitted", {
        requestId,
        userId,
        fingerprintId,
      });

      return { requestId, submitted: true };
    } catch (error) {
      console.error("Error submitting GDPR request:", error);
      return { requestId, submitted: false };
    }
  }

  /**
   * Get storage key for data type
   */
  private getStorageKeyForDataType(dataType: string): string | null {
    switch (dataType) {
      case "core_fingerprint":
      case "advanced_fingerprint":
        return STORAGE_KEYS.fingerprints;
      case "session_events":
      case "session_data":
        return STORAGE_KEYS.sessions;
      case "behavioral_data":
      case "temporary_behavioral_data":
        return STORAGE_KEYS.behavioral;
      case "audit_events":
      case "deletion_logs":
        return STORAGE_KEYS.audit;
      case "gdpr_requests":
        return STORAGE_KEYS.gdpr_requests;
      default:
        return null;
    }
  }

  /**
   * Initialize automatic cleanup intervals
   */
  private initializeAutoCleanup(): void {
    if (typeof window === "undefined") return; // Server-side safety

    // Run cleanup every 24 hours
    setInterval(() => {
      this.processRetention(false).catch((error) => {
        console.error("Error in automatic retention cleanup:", error);
      });
    }, 24 * 60 * 60 * 1000);

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.processRetention(false).catch((error) => {
        console.error("Error in initial retention cleanup:", error);
      });
    }, 60 * 1000);
  }

  /**
   * Storage utilities
   */
  private getStoredData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from storage key ${key}:`, error);
      return null;
    }
  }

  private setStoredData(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to storage key ${key}:`, error);
    }
  }

  /**
   * Audit logging
   */
  private addAuditLog(action: string, details: any): void {
    this.auditTrail.push({
      timestamp: Date.now(),
      action,
      details,
    });

    // Keep audit trail in localStorage as well
    try {
      const existingLogs = this.getStoredData(STORAGE_KEYS.audit) || [];
      existingLogs.push({
        timestamp: Date.now(),
        action,
        details,
      });

      // Keep only last 1000 audit logs
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }

      this.setStoredData(STORAGE_KEYS.audit, existingLogs);
    } catch (error) {
      console.error("Error storing audit log:", error);
    }
  }

  private async createRetentionAuditLog(
    report: RetentionReport
  ): Promise<void> {
    this.addAuditLog("retention_processing_completed", {
      summary: {
        totalRecords: report.totalRecords,
        deleted: report.actuallyDeleted,
        policies: report.policies.length,
        errors: report.errors.length,
        processingTime: report.processingTimeMs,
      },
      policies: report.policies,
      gdprCompliance: report.gdprCompliance,
      timestamp: Date.now(),
    });
  }

  /**
   * Public utilities
   */
  getRetentionPolicies(): Array<[string, RetentionPolicy]> {
    return Array.from(this.policies.entries());
  }

  getAuditTrail(): Array<{ timestamp: number; action: string; details: any }> {
    return [...this.auditTrail];
  }

  async getDataInventory(): Promise<{
    fingerprints: number;
    sessions: number;
    behavioral: number;
    audit: number;
    gdprRequests: number;
  }> {
    return {
      fingerprints: (this.getStoredData(STORAGE_KEYS.fingerprints) || [])
        .length,
      sessions: (this.getStoredData(STORAGE_KEYS.sessions) || []).length,
      behavioral: (this.getStoredData(STORAGE_KEYS.behavioral) || []).length,
      audit: (this.getStoredData(STORAGE_KEYS.audit) || []).length,
      gdprRequests: (this.getStoredData(STORAGE_KEYS.gdpr_requests) || [])
        .length,
    };
  }

  /**
   * Manual cleanup for testing or admin use
   */
  async forceCleanup(policyName?: string): Promise<RetentionReport> {
    console.log("Forcing manual cleanup", { policyName });

    if (policyName && this.policies.has(policyName)) {
      // Process single policy
      const policy = this.policies.get(policyName)!;
      const result = await this.processPolicyRetention(policy, false);

      return {
        totalRecords: result.processed,
        eligibleForDeletion: result.eligible,
        actuallyDeleted: result.deleted,
        errors: [],
        policies: [
          {
            policy: policyName,
            recordsProcessed: result.processed,
            recordsDeleted: result.deleted,
          },
        ],
        processingTimeMs: 0,
        gdprCompliance: {
          userRequestsProcessed: 0,
          auditLogCreated: true,
          complianceVerified: true,
        },
      };
    }

    // Process all policies
    return this.processRetention(false);
  }
}

// Export default retention manager instance
export const fingerprintRetentionManager = new FingerprintRetentionManager();

// Export utility functions
export const RetentionUtils = {
  /**
   * Check if data is expired based on retention period
   */
  isDataExpired(timestamp: number, retentionDays: number): boolean {
    const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    return ageDays > retentionDays;
  },

  /**
   * Get human-readable retention policy description
   */
  getPolicyDescription(policy: RetentionPolicy): string {
    return `${policy.description} - Retention: ${
      policy.retentionPeriodDays
    } days, Auto-cleanup: ${
      policy.autoCleanup ? "Yes" : "No"
    }, GDPR Compliant: ${policy.gdprCompliant ? "Yes" : "No"}`;
  },

  /**
   * Validate GDPR deletion request
   */
  validateGDPRRequest(
    userId?: string,
    fingerprintId?: string
  ): { valid: boolean; error?: string } {
    if (!userId && !fingerprintId) {
      return {
        valid: false,
        error: "Must specify either userId or fingerprintId",
      };
    }

    if (userId && typeof userId !== "string") {
      return { valid: false, error: "userId must be a string" };
    }

    if (fingerprintId && typeof fingerprintId !== "string") {
      return { valid: false, error: "fingerprintId must be a string" };
    }

    return { valid: true };
  },
};
