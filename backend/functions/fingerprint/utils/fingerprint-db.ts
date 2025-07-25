import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import * as crypto from "crypto";
import {
  FingerprintEntity,
  FingerprintSessionEntity,
  FingerprintAnalyticsEntity,
  FingerprintCollectionRequest,
} from "@shared/types/fingerprint";
import {
  UniqueVisitor,
  BehavioralSignature,
  VisitSession,
  SessionBehavior,
} from "@shared/types/visitor-analytics";
import {
  generateLocalitySensitiveHashes,
  generateFuzzyFingerprintHash,
} from "./fuzzy-hash";
import { DEFAULT_ENTROPY_WEIGHTS } from "./config";

// Match the isLocal/clientConfig logic from dynamodb.ts
const isLocal = process.env["AWS_SAM_LOCAL"] === "true";
const clientConfig: any = {};

if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env["DYNAMODB_TABLE"] || "pornspot-media";

export class FingerprintDatabaseService {
  /**
   * Generate a unique fingerprint ID
   */
  static generateFingerprintId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate a hash from fingerprint data
   */
  static generateFingerprintHash(
    coreFingerprint: any,
    advancedFingerprint: any
  ): string {
    // Use the fuzzy fingerprint hash for better similarity detection
    return generateFuzzyFingerprintHash(coreFingerprint, advancedFingerprint);
  }

  /**
   * Generate multiple fuzzy hashes for similarity detection
   * Creates hashes from different component combinations to enable fuzzy matching
   */
  static generateFuzzyHashes(
    coreFingerprint: any,
    advancedFingerprint: any
  ): string[] {
    // Use the advanced LSH approach for better fuzzy matching
    const fuzzyHashes = generateLocalitySensitiveHashes(
      coreFingerprint,
      advancedFingerprint,
      4
    );
    
    console.log("🔍 Generated fuzzy hashes:", {
      count: fuzzyHashes.length,
      hashes: fuzzyHashes,
      coreFeatures: {
        hasCanvas: !!coreFingerprint?.canvas,
        hasWebgl: !!coreFingerprint?.webgl,
        hasAudio: !!coreFingerprint?.audio,
        hasScreen: !!coreFingerprint?.screen
      }
    });
    
    return fuzzyHashes;
  }

  /**
   * Calculate entropy for a given data object
   */
  static calculateEntropy(data: string): number {
    if (!data || data.length === 0) return 0;

    const freq: Record<string, number> = {};
    for (const char of data) {
      freq[char] = (freq[char] || 0) + 1;
    }

    const length = data.length;
    let entropy = 0;

    for (const count of Object.values(freq)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Calculate weighted entropy score for entire fingerprint
   */
  static calculateWeightedEntropy(
    coreFingerprint: any,
    advancedFingerprint: any,
    weights = DEFAULT_ENTROPY_WEIGHTS
  ): number {
    let totalEntropy = 0;
    let totalWeight = 0;

    // Core fingerprint entropy
    if (coreFingerprint.canvas) {
      const entropy = this.calculateEntropy(coreFingerprint.canvas);
      totalEntropy += entropy * weights.canvas;
      totalWeight += weights.canvas;
    }

    if (coreFingerprint.webgl) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.webgl)
      );
      totalEntropy += entropy * weights.webgl;
      totalWeight += weights.webgl;
    }

    if (coreFingerprint.audio) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.audio)
      );
      totalEntropy += entropy * weights.audio;
      totalWeight += weights.audio;
    }

    if (coreFingerprint.fonts) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.fonts)
      );
      totalEntropy += entropy * weights.fonts;
      totalWeight += weights.fonts;
    }

    // Advanced fingerprint entropy
    if (advancedFingerprint.webrtc) {
      const entropy = this.calculateEntropy(
        JSON.stringify(advancedFingerprint.webrtc)
      );
      totalEntropy += entropy * weights.webrtc;
      totalWeight += weights.webrtc;
    }

    if (advancedFingerprint.battery) {
      const entropy = this.calculateEntropy(
        JSON.stringify(advancedFingerprint.battery)
      );
      totalEntropy += entropy * weights.battery;
      totalWeight += weights.battery;
    }

    // Add other advanced fingerprint components...

    return totalWeight > 0 ? totalEntropy / totalWeight : 0;
  }

  /**
   * Calculate similarity between two fingerprints
   */
  static calculateSimilarity(
    fp1: FingerprintEntity,
    fp2: FingerprintEntity,
    weights = DEFAULT_ENTROPY_WEIGHTS
  ): number {
    let totalSimilarity = 0;
    let totalWeight = 0;
    const matchedComponents: string[] = [];

    // Canvas similarity
    if (fp1.coreFingerprint.canvas && fp2.coreFingerprint.canvas) {
      const similarity =
        fp1.coreFingerprint.canvas === fp2.coreFingerprint.canvas ? 1 : 0;
      totalSimilarity += similarity * weights.canvas;
      totalWeight += weights.canvas;
      if (similarity > 0.8) matchedComponents.push("canvas");
    }

    // WebGL similarity
    if (fp1.coreFingerprint.webgl && fp2.coreFingerprint.webgl) {
      let webglSimilarity = 0;

      if (
        fp1.coreFingerprint.webgl.vendor === fp2.coreFingerprint.webgl.vendor
      ) {
        webglSimilarity += 0.3;
      }
      if (
        fp1.coreFingerprint.webgl.renderer ===
        fp2.coreFingerprint.webgl.renderer
      ) {
        webglSimilarity += 0.3;
      }
      if (
        fp1.coreFingerprint.webgl.renderHash ===
        fp2.coreFingerprint.webgl.renderHash
      ) {
        webglSimilarity += 0.4;
      }

      totalSimilarity += webglSimilarity * weights.webgl;
      totalWeight += weights.webgl;
      if (webglSimilarity > 0.8) matchedComponents.push("webgl");
    }

    // Audio similarity
    if (fp1.coreFingerprint.audio && fp2.coreFingerprint.audio) {
      const audioSimilarity =
        fp1.coreFingerprint.audio.contextHash ===
        fp2.coreFingerprint.audio.contextHash
          ? 1
          : 0;
      totalSimilarity += audioSimilarity * weights.audio;
      totalWeight += weights.audio;
      if (audioSimilarity > 0.8) matchedComponents.push("audio");
    }

    // Font similarity
    if (fp1.coreFingerprint.fonts && fp2.coreFingerprint.fonts) {
      const fonts1 = Object.keys(fp1.coreFingerprint.fonts.available);
      const fonts2 = Object.keys(fp2.coreFingerprint.fonts.available);
      const intersection = fonts1.filter((f) => fonts2.includes(f));
      const union = [...new Set([...fonts1, ...fonts2])];
      const fontSimilarity =
        union.length > 0 ? intersection.length / union.length : 0;

      totalSimilarity += fontSimilarity * weights.fonts;
      totalWeight += weights.fonts;
      if (fontSimilarity > 0.8) matchedComponents.push("fonts");
    }

    // WebRTC similarity
    if (fp1.advancedFingerprint.webrtc && fp2.advancedFingerprint.webrtc) {
      const ips1 = fp1.advancedFingerprint.webrtc.localIPs;
      const ips2 = fp2.advancedFingerprint.webrtc.localIPs;
      const ipIntersection = ips1.filter((ip) => ips2.includes(ip));
      const ipSimilarity =
        ips1.length > 0
          ? ipIntersection.length / Math.max(ips1.length, ips2.length)
          : 0;

      totalSimilarity += ipSimilarity * weights.webrtc;
      totalWeight += weights.webrtc;
      if (ipSimilarity > 0.8) matchedComponents.push("webrtc");
    }

    // Battery similarity
    if (fp1.advancedFingerprint.battery && fp2.advancedFingerprint.battery) {
      const batterySimilarity =
        fp1.advancedFingerprint.battery.batteryHash ===
        fp2.advancedFingerprint.battery.batteryHash
          ? 1
          : 0;
      totalSimilarity += batterySimilarity * weights.battery;
      totalWeight += weights.battery;
      if (batterySimilarity > 0.8) matchedComponents.push("battery");
    }

    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }

  /**
   * Create a new fingerprint entity
   */
  static async createFingerprint(
    fingerprintData: FingerprintCollectionRequest,
    serverEnhancement: any,
    userId?: string,
    sessionId?: string
  ): Promise<FingerprintEntity> {
    const now = new Date();
    const fingerprintId = this.generateFingerprintId();
    const fingerprintHash = this.generateFingerprintHash(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint
    );

    // Generate fuzzy hashes for similarity detection
    const fuzzyHashes = this.generateFuzzyHashes(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint
    );

    const entropy = this.calculateWeightedEntropy(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint
    );

    // Calculate TTL (90 days from now)
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const ttl = Math.floor(expiresAt.getTime() / 1000);

    // Determine device category from user agent
    const userAgent = serverEnhancement.httpHeaders.userAgent;
    let deviceCategory: "desktop" | "mobile" | "tablet" | "unknown" = "unknown";
    if (userAgent.includes("Mobile")) {
      deviceCategory = userAgent.includes("Tablet") ? "tablet" : "mobile";
    } else if (
      userAgent.includes("Desktop") ||
      userAgent.includes("Windows") ||
      userAgent.includes("Macintosh")
    ) {
      deviceCategory = "desktop";
    }

    const entity: FingerprintEntity = {
      // Primary Keys
      PK: `FINGERPRINT#${fingerprintId}`,
      SK: "METADATA",

      // Global Secondary Indexes
      GSI1PK: userId ? `USER#${userId}` : "ANONYMOUS",
      GSI1SK: `${now.toISOString()}#${fingerprintId}`,
      GSI2PK: `FP_HASH#${fingerprintHash}`,
      GSI2SK: `${Math.round(entropy * 100)}#${now.toISOString()}`,
      GSI3PK: `ANALYTICS#${now.toISOString().split("T")[0]}`,
      GSI3SK: `${now.getHours().toString().padStart(2, "0")}#${fingerprintId}`,
      GSI4PK: `DEVICE_TYPE#${deviceCategory}`,
      GSI4SK: `${
        serverEnhancement.httpHeaders.userAgent.split(" ")[0]
      }#${now.toISOString()}`,

      // Entity metadata
      EntityType: "Fingerprint",

      // Core identification
      fingerprintId,
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      fingerprintHash,
      fuzzyHashes, // Store fuzzy hashes for similarity detection
      confidence: Math.round(entropy * 100),
      deviceCategory,

      // Fingerprint data
      coreFingerprint: fingerprintData.coreFingerprint,
      advancedFingerprint: fingerprintData.advancedFingerprint,
      serverEnhancement,
      ...(fingerprintData.behavioralData && {
        behavioralData: fingerprintData.behavioralData,
      }),

      // Analytics metadata
      entropy,
      uniqueness: Math.min(entropy / 10, 1), // Normalize to 0-1
      riskScore: 0, // Will be calculated by ML models

      // Browser/Device info
      userAgent: serverEnhancement.httpHeaders.userAgent,
      browserName: "Unknown", // Will be parsed from user agent
      browserVersion: "Unknown",
      osName: "Unknown",
      osVersion: "Unknown",

      // Location and network
      ipAddress: crypto
        .createHash("sha256")
        .update(serverEnhancement.ipGeolocation.country)
        .digest("hex")
        .slice(0, 16),
      country: serverEnhancement.ipGeolocation.country,
      timezone: serverEnhancement.ipGeolocation.timezone,

      // Timestamps and TTL
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ttl,

      // Privacy and compliance
      consentGiven: fingerprintData.consentGiven,
      dataProcessingPurpose: fingerprintData.dataProcessingPurpose,
      retentionCategory: "analytics",

      // Store all raw data from the request for advanced similarity or analytics
      rawFingerprint: { ...fingerprintData },
    };

    // Write the main entity as usual
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    });

    await docClient.send(command);

    // Write one additional record per fuzzy hash for GSI4 indexing
    // (Each will have different GSI4PK but can share the same GSI4 index)
    const fuzzyWritePromises = fuzzyHashes.map((fuzzyHash, index) => {
      const fuzzyEntity = {
        ...entity,
        // Use a unique SK to avoid conflicts with main entity
        SK: `FUZZY#${index}`,
        GSI4PK: `FINGERPRINT_FUZZY#${fuzzyHash}`,
        GSI4SK: `${now.toISOString()}#${entity.fingerprintId}`,
      };
      return docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: fuzzyEntity,
        })
      );
    });
    await Promise.all(fuzzyWritePromises);

    return entity;
  }

  /**
   * Get fingerprint by ID
   */
  static async getFingerprintById(
    fingerprintId: string
  ): Promise<FingerprintEntity | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `FINGERPRINT#${fingerprintId}`,
        SK: "METADATA",
      },
    });

    const result = await docClient.send(command);
    return (result.Item as FingerprintEntity) || null;
  }

  /**
   * Find similar fingerprints using fuzzy hashing
   */
  static async findSimilarFingerprints(
    fingerprintHash: string,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    // First, try to find exact matches using the original method
    const exactMatches = await this.findExactHashMatches(
      fingerprintHash,
      limit
    );

    // If we have enough exact matches, return them
    if (exactMatches.length >= limit) {
      return exactMatches.slice(0, limit);
    }

    // If not enough exact matches, perform fuzzy matching
    const remainingLimit = limit - exactMatches.length;
    const fuzzyMatches = await this.findFuzzyMatches(remainingLimit);

    // Combine and deduplicate results
    const allMatches = [...exactMatches];
    const existingIds = new Set(exactMatches.map((fp) => fp.fingerprintId));

    for (const fuzzyMatch of fuzzyMatches) {
      if (!existingIds.has(fuzzyMatch.fingerprintId)) {
        allMatches.push(fuzzyMatch);
        existingIds.add(fuzzyMatch.fingerprintId);
      }
    }

    return allMatches.slice(0, limit);
  }

  /**
   * Find exact hash matches (original method)
   */
  private static async findExactHashMatches(
    fingerprintHash: string,
    limit: number
  ): Promise<FingerprintEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :hashPK",
      ExpressionAttributeValues: {
        ":hashPK": `FP_HASH#${fingerprintHash}`,
      },
      Limit: limit,
      ScanIndexForward: false, // Get most recent first
    });

    const result = await docClient.send(command);
    return (result.Items as FingerprintEntity[]) || [];
  }

  /**
   * Find fuzzy matches by scanning recent fingerprints
   */
  private static async findFuzzyMatches(
    limit: number
  ): Promise<FingerprintEntity[]> {
    // Get recent fingerprints from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "EntityType = :entityType AND lastSeenAt > :minDate",
      ExpressionAttributeValues: {
        ":entityType": "Fingerprint",
        ":minDate": thirtyDaysAgo.toISOString(),
      },
      Limit: Math.min(500, limit * 10), // Scan more candidates for better fuzzy matching
    });

    const result = await docClient.send(command);
    const candidates = (result.Items as FingerprintEntity[]) || [];

    // Return fingerprints that have fuzzy hashes (support fuzzy matching)
    const fuzzyMatches = candidates.filter(
      (fp) => fp.fuzzyHashes && fp.fuzzyHashes.length > 0
    );

    return fuzzyMatches.slice(0, limit);
  }

  /**
   * Enhanced fuzzy matching with actual hash comparison
   * This method generates fuzzy hashes for the current fingerprint and finds matches
   */
  static async findSimilarFingerprintsAdvanced(
    coreFingerprint: any,
    advancedFingerprint: any,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    // Generate fuzzy hashes for the current fingerprint
    const currentFuzzyHashes = this.generateFuzzyHashes(
      coreFingerprint,
      advancedFingerprint
    );

    // Try exact matches first
    const mainHash = this.generateFingerprintHash(
      coreFingerprint,
      advancedFingerprint
    );
    const exactMatches = await this.findExactHashMatches(mainHash, limit);

    if (exactMatches.length >= limit) {
      return exactMatches.slice(0, limit);
    }

    // Find fuzzy matches by checking each fuzzy hash
    const allMatches = [...exactMatches];
    const existingIds = new Set(exactMatches.map((fp) => fp.fingerprintId));
    const remainingLimit = limit - exactMatches.length;

    // Query each fuzzy hash to find potential matches
    for (const fuzzyHash of currentFuzzyHashes) {
      if (allMatches.length >= limit) break;

      // Use the new fuzzy GSI for each bucket!
      const fuzzyMatches = await this.findFuzzyHashMatches(
        fuzzyHash,
        remainingLimit
      );
      for (const match of fuzzyMatches) {
        if (
          !existingIds.has(match.fingerprintId) &&
          allMatches.length < limit
        ) {
          allMatches.push(match);
          existingIds.add(match.fingerprintId);
        }
      }
    }

    return allMatches.slice(0, limit);
  }

  /**
   * Query the fuzzy hash GSI for candidates
   */
  static async findFuzzyHashMatches(
    fuzzyHash: string,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI4", // Use GSI4 - it can handle both DEVICE_TYPE and FINGERPRINT_FUZZY patterns
      KeyConditionExpression: "GSI4PK = :fuzzyPK",
      ExpressionAttributeValues: {
        ":fuzzyPK": `FINGERPRINT_FUZZY#${fuzzyHash}`,
      },
      Limit: limit,
      ScanIndexForward: false,
    });

    const result = await docClient.send(command);
    // Filter duplicates, only return one per fingerprintId (canonical)
    const unique: Record<string, FingerprintEntity> = {};
    for (const item of (result.Items as FingerprintEntity[]) ?? []) {
      unique[item.fingerprintId] = item;
    }
    return Object.values(unique);
  }

  /**
   * Get fingerprints by user ID
   */
  static async getFingerprintsByUserId(
    userId: string,
    limit = 20,
    lastEvaluatedKey?: any
  ): Promise<{ fingerprints: FingerprintEntity[]; lastEvaluatedKey?: any }> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :userPK",
      ExpressionAttributeValues: {
        ":userPK": `USER#${userId}`,
      },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    return {
      fingerprints: (result.Items as FingerprintEntity[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Update fingerprint last seen time
   */
  static async updateLastSeen(fingerprintId: string): Promise<void> {
    const now = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `FINGERPRINT#${fingerprintId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET lastSeenAt = :now, updatedAt = :now",
      ExpressionAttributeValues: {
        ":now": now,
      },
    });

    await docClient.send(command);
  }

  /**
   * Create fingerprint session correlation
   */
  static async createFingerprintSession(
    fingerprintId: string,
    sessionId: string,
    userId?: string,
    correlationScore = 100
  ): Promise<FingerprintSessionEntity> {
    const now = new Date();
    const ttl = Math.floor((now.getTime() + 30 * 24 * 60 * 60 * 1000) / 1000); // 30 days

    const entity: FingerprintSessionEntity = {
      PK: `FINGERPRINT#${fingerprintId}`,
      SK: `SESSION#${sessionId}`,
      GSI1PK: `SESSION#${sessionId}`,
      GSI1SK: `${now.toISOString()}#${fingerprintId}`,
      EntityType: "FingerprintSession",

      fingerprintId,
      sessionId,
      ...(userId && { userId }),
      correlationScore,
      sessionStartTime: now.toISOString(),
      pageViews: 1,
      actionsCount: 0,
      createdAt: now.toISOString(),
      ttl,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    });

    await docClient.send(command);
    return entity;
  }

  /**
   * Store the association between visitorId and fingerprintId in the database
   */
  static async storeVisitorFingerprintAssociation(
    visitorId: string,
    fingerprintId: string,
    metadata: {
      isNewVisitor: boolean;
      confidence: number;
      timestamp: string;
      fingerprintHash: string;
    }
  ): Promise<void> {
    try {
      // Store visitor-fingerprint association in DynamoDB
      // This creates a bidirectional link for quick lookups
      const associationRecord = {
        PK: `VISITOR#${visitorId}`,
        SK: `FINGERPRINT#${fingerprintId}`,
        GSI1PK: `FINGERPRINT#${fingerprintId}`,
        GSI1SK: `VISITOR#${visitorId}`,
        EntityType: "VisitorFingerprintAssociation",
        visitorId,
        fingerprintId,
        fingerprintHash: metadata.fingerprintHash,
        isNewVisitor: metadata.isNewVisitor,
        confidence: metadata.confidence,
        associatedAt: metadata.timestamp,
        ttl: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000), // 90 days TTL
      };

      console.log("🔗 Storing visitor-fingerprint association:", {
        visitorId: visitorId.substring(0, 8) + "...",
        fingerprintId: fingerprintId.substring(0, 8) + "...",
        isNewVisitor: metadata.isNewVisitor,
        confidence: metadata.confidence,
      });

      // Store the association in DynamoDB
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: associationRecord,
      });

      await docClient.send(command);
    } catch (error) {
      console.warn("Failed to store visitor-fingerprint association:", error);
      // Don't fail the entire request if this association storage fails
    }
  }

  /**
   * Get analytics data for a date range
   */
  static async getAnalyticsData(
    startDate: string,
    endDate: string,
    analyticsType?: string
  ): Promise<FingerprintAnalyticsEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: analyticsType ? "GSI1" : "GSI3",
      KeyConditionExpression: analyticsType
        ? "GSI1PK = :typePK AND GSI1SK BETWEEN :start AND :end"
        : "GSI3PK BETWEEN :startPK AND :endPK",
      ExpressionAttributeValues: analyticsType
        ? {
            ":typePK": `ANALYTICS_TYPE#${analyticsType}`,
            ":start": startDate,
            ":end": endDate,
          }
        : {
            ":startPK": `ANALYTICS#${startDate}`,
            ":endPK": `ANALYTICS#${endDate}`,
          },
    });

    const result = await docClient.send(command);
    return (result.Items as FingerprintAnalyticsEntity[]) || [];
  }

  /**
   * Delete expired fingerprints (cleanup job)
   */
  static async deleteExpiredFingerprints(): Promise<number> {
    // DynamoDB TTL will handle automatic deletion
    // This method can be used for manual cleanup if needed
    console.log("TTL-based cleanup is handled automatically by DynamoDB");
    return 0;
  }

  // ============ VISITOR TRACKING METHODS ============

  /**
   * Find visitor by fingerprint hash
   */
  static async findVisitorByFingerprint(
    fingerprintHash: string
  ): Promise<UniqueVisitor | null> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI4",
        KeyConditionExpression: "GSI4PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `FINGERPRINT#${fingerprintHash}`,
        },
        Limit: 1,
      });

      const result = await docClient.send(command);

      if (result.Items && result.Items.length > 0) {
        const item = result.Items[0];
        if (!item) return null;

        return {
          visitorId: item["visitorId"],
          createdAt: item["createdAt"],
          lastSeenAt: item["lastSeenAt"],
          associatedFingerprints: item["associatedFingerprints"] || [
            fingerprintHash,
          ],
          primaryFingerprintHash: item["primaryFingerprintHash"],
          behavioralSignature: JSON.parse(item["behavioralSignature"] || "{}"),
          visitCount: item["visitCount"] || 0,
          totalSessionTime: item["totalSessionTime"] || 0,
          hourlyVisits: JSON.parse(item["hourlyVisits"] || "{}"),
          dailyVisits: JSON.parse(item["dailyVisits"] || "{}"),
          confidenceScore: item["confidenceScore"] || 1.0,
          lastBehavioralUpdate: item["lastBehavioralUpdate"],
        };
      }
      return null;
    } catch (error) {
      console.error("Error finding visitor by fingerprint:", error);
      return null;
    }
  }

  /**
   * Create new unique visitor
   */
  static async createNewVisitor(
    visitorId: string,
    fingerprintHash: string,
    behavioralSignature: BehavioralSignature,
    timestamp: string
  ): Promise<UniqueVisitor> {
    const visitor: UniqueVisitor = {
      visitorId,
      createdAt: timestamp,
      lastSeenAt: timestamp,
      associatedFingerprints: [fingerprintHash],
      primaryFingerprintHash: fingerprintHash,
      behavioralSignature,
      visitCount: 1,
      totalSessionTime: 0,
      hourlyVisits: {},
      dailyVisits: {},
      confidenceScore: 1.0,
      lastBehavioralUpdate: timestamp,
    };

    // Store visitor record
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
        GSI1PK: "VISITORS",
        GSI1SK: timestamp,
        GSI4PK: `FINGERPRINT#${fingerprintHash}`,
        GSI4SK: visitorId,
        ...visitor,
        behavioralSignature: JSON.stringify(behavioralSignature),
        hourlyVisits: JSON.stringify(visitor.hourlyVisits),
        dailyVisits: JSON.stringify(visitor.dailyVisits),
        entityType: "Visitor",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return visitor;
  }

  /**
   * Create session record
   */
  static async createSession(
    sessionId: string,
    visitorId: string,
    fingerprintHash: string,
    sessionBehavior: SessionBehavior,
    context: {
      userAgent: string;
      ipAddress: string;
      referrer?: string;
    },
    timestamp: string
  ): Promise<VisitSession> {
    const hour = timestamp.substring(0, 13); // YYYY-MM-DDTHH
    const day = timestamp.substring(0, 10); // YYYY-MM-DD

    const session: VisitSession = {
      sessionId,
      visitorId,
      fingerprintHash,
      startTime: timestamp,
      pageViews: 1,
      interactions: sessionBehavior.mouseMovements + sessionBehavior.keystrokes,
      sessionBehavior,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      ...(context.referrer && { referrer: context.referrer }),
      timeWindow: { hour, day },
    };

    // Store session
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SESSION#${sessionId}`,
        SK: "DETAILS",
        GSI1PK: `VISITOR#${visitorId}`,
        GSI1SK: timestamp,
        GSI2PK: `TIMEWINDOW#${hour}`,
        GSI2SK: sessionId,
        ...session,
        sessionBehavior: JSON.stringify(sessionBehavior),
        entityType: "Session",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return session;
  }

  /**
   * Update visitor statistics
   */
  static async updateVisitorStatistics(
    visitorId: string,
    hour: string,
    day: string,
    timestamp: string
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `VISITOR#${visitorId}`,
          SK: "PROFILE",
        },
        UpdateExpression: `
          SET lastSeenAt = :timestamp,
              visitCount = visitCount + :one,
              hourlyVisits.#hour = if_not_exists(hourlyVisits.#hour, :zero) + :one,
              dailyVisits.#day = if_not_exists(dailyVisits.#day, :zero) + :one,
              updatedAt = :timestamp
        `,
        ExpressionAttributeNames: {
          "#hour": hour,
          "#day": day,
        },
        ExpressionAttributeValues: {
          ":timestamp": timestamp,
          ":one": 1,
          ":zero": 0,
        },
      });

      await docClient.send(command);
    } catch (error) {
      console.error("Error updating visitor statistics:", error);
    }
  }

  /**
   * Get sessions in time window
   */
  static async getSessionsInTimeWindow(
    start: Date,
    end: Date
  ): Promise<VisitSession[]> {
    const sessions: VisitSession[] = [];

    // Generate hourly time windows to query
    const current = new Date(start);
    while (current <= end) {
      const hourKey = current.toISOString().substring(0, 13);

      try {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `TIMEWINDOW#${hourKey}`,
          },
        });

        const result = await docClient.send(command);

        if (result.Items) {
          sessions.push(
            ...result.Items.map((item: any) => ({
              sessionId: item.sessionId,
              visitorId: item.visitorId,
              fingerprintHash: item.fingerprintHash,
              startTime: item.startTime,
              endTime: item.endTime,
              duration: item.duration,
              pageViews: item.pageViews,
              interactions: item.interactions,
              sessionBehavior: JSON.parse(item.sessionBehavior || "{}"),
              userAgent: item.userAgent,
              ipAddress: item.ipAddress,
              referrer: item.referrer,
              timeWindow: item.timeWindow,
            }))
          );
        }
      } catch (error) {
        console.error(`Error querying sessions for ${hourKey}:`, error);
      }

      current.setHours(current.getHours() + 1);
    }

    return sessions;
  }

  /**
   * Get visitor by ID
   */
  static async getVisitorById(
    visitorId: string
  ): Promise<UniqueVisitor | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `VISITOR#${visitorId}`,
          SK: "PROFILE",
        },
      });

      const result = await docClient.send(command);

      if (result.Item) {
        return {
          visitorId: result.Item["visitorId"],
          createdAt: result.Item["createdAt"],
          lastSeenAt: result.Item["lastSeenAt"],
          associatedFingerprints: result.Item["associatedFingerprints"],
          primaryFingerprintHash: result.Item["primaryFingerprintHash"],
          behavioralSignature: JSON.parse(
            result.Item["behavioralSignature"] || "{}"
          ),
          visitCount: result.Item["visitCount"],
          totalSessionTime: result.Item["totalSessionTime"],
          hourlyVisits: JSON.parse(result.Item["hourlyVisits"] || "{}"),
          dailyVisits: JSON.parse(result.Item["dailyVisits"] || "{}"),
          confidenceScore: result.Item["confidenceScore"],
          lastBehavioralUpdate: result.Item["lastBehavioralUpdate"],
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting visitor by ID:", error);
      return null;
    }
  }

  /**
   * Associate fingerprint with visitor
   */
  static async associateFingerprintWithVisitor(
    visitorId: string,
    fingerprintHash: string
  ): Promise<void> {
    // Update visitor's associated fingerprints
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
      },
      UpdateExpression: "ADD associatedFingerprints :fingerprint",
      ExpressionAttributeValues: {
        ":fingerprint": [fingerprintHash],
      },
    });

    await docClient.send(updateCommand);

    // Also create reverse lookup
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `FINGERPRINT_VISITOR#${fingerprintHash}`,
        SK: visitorId,
        GSI4PK: `FINGERPRINT#${fingerprintHash}`,
        GSI4SK: visitorId,
        entityType: "FingerprintVisitorMapping",
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);
  }

  /**
   * Update behavioral signature
   */
  static async updateBehavioralSignature(
    visitorId: string,
    behavioralSignature: BehavioralSignature,
    timestamp: string
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
      },
      UpdateExpression:
        "SET behavioralSignature = :signature, lastBehavioralUpdate = :timestamp",
      ExpressionAttributeValues: {
        ":signature": JSON.stringify(behavioralSignature),
        ":timestamp": timestamp,
      },
    });

    await docClient.send(command);
  }
}
