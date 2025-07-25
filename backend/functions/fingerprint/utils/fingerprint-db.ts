import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
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
    advancedFingerprint: any,
    userId?: string
  ): string {
    // Use the fuzzy fingerprint hash for better similarity detection
    return generateFuzzyFingerprintHash(
      coreFingerprint,
      advancedFingerprint,
      userId
    );
  }

  /**
   * Generate multiple fuzzy hashes for similarity detection
   * Creates hashes from different component combinations to enable fuzzy matching
   */
  static generateFuzzyHashes(
    coreFingerprint: any,
    advancedFingerprint: any,
    userId?: string
  ): string[] {
    // Use the advanced LSH approach for better fuzzy matching
    const fuzzyHashes = generateLocalitySensitiveHashes(
      coreFingerprint,
      advancedFingerprint,
      userId
    );

    console.log("🔍 Generated fuzzy hashes:", {
      count: fuzzyHashes.length,
      hashes: fuzzyHashes,
      userId: userId ? "present" : "not provided",
      coreFeatures: {
        hasCanvas: !!coreFingerprint?.canvas,
        hasWebgl: !!coreFingerprint?.webgl,
        hasAudio: !!coreFingerprint?.audio,
        hasScreen: !!coreFingerprint?.screen,
      },
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
      fingerprintData.advancedFingerprint,
      userId
    );

    // Generate fuzzy hashes for similarity detection
    const fuzzyHashes = this.generateFuzzyHashes(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint,
      userId
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
    userId?: string,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    // Generate fuzzy hashes for the current fingerprint
    const currentFuzzyHashes = this.generateFuzzyHashes(
      coreFingerprint,
      advancedFingerprint,
      userId
    );

    // Try exact matches first
    const mainHash = this.generateFingerprintHash(
      coreFingerprint,
      advancedFingerprint,
      userId
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
   * ENHANCED: Now includes triangular table reconciliation to merge visitor identities
   * when fingerprint matching reveals they belong to the same user
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
      // STEP 1: Perform triangular reconciliation
      await this.performTriangularReconciliation(
        visitorId,
        fingerprintId,
        metadata
      );

      // STEP 2: Store the association record (after reconciliation)
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

      // STEP 3: Ensure user-visitor relationship exists if userId is available
      const fingerprint = await this.getFingerprintById(fingerprintId);
      if (fingerprint?.userId) {
        await this.createOrUpdateUserVisitorRelationship(
          fingerprint.userId,
          visitorId,
          metadata.confidence
        );
      }
    } catch (error) {
      console.warn("Failed to store visitor-fingerprint association:", error);
      // Don't fail the entire request if this association storage fails
    }
  }

  /**
   * Perform triangular table reconciliation
   * This detects when multiple visitor_ids should be merged into one identity
   * based on fingerprint similarity and userId matching
   */
  private static async performTriangularReconciliation(
    currentVisitorId: string,
    currentFingerprintId: string,
    metadata: {
      isNewVisitor: boolean;
      confidence: number;
      timestamp: string;
      fingerprintHash: string;
    }
  ): Promise<void> {
    try {
      console.log("🔺 Starting triangular reconciliation for visitor:", {
        visitorId: currentVisitorId.substring(0, 8) + "...",
        fingerprintId: currentFingerprintId.substring(0, 8) + "...",
      });

      // Get the current fingerprint to extract userId and fuzzy hashes
      const currentFingerprint = await this.getFingerprintById(
        currentFingerprintId
      );
      if (!currentFingerprint) {
        console.log(
          "⚠️ Current fingerprint not found, skipping reconciliation"
        );
        return;
      }

      // Extract userId from fingerprint data
      const userId = currentFingerprint.userId;
      if (!userId) {
        console.log("⚠️ No userId in fingerprint, skipping reconciliation");
        return;
      }

      // STEP 1: Find all similar fingerprints using fuzzy matching
      const similarFingerprints = await this.findSimilarFingerprintsAdvanced(
        currentFingerprint.coreFingerprint,
        currentFingerprint.advancedFingerprint,
        userId,
        20 // Get more matches for comprehensive reconciliation
      );

      // STEP 2: Extract visitor IDs from similar fingerprints
      const candidateVisitorIds = new Set<string>();
      const fingerprintToVisitorMap = new Map<string, string>();

      for (const similarFingerprint of similarFingerprints) {
        // Skip if it's the same fingerprint
        if (similarFingerprint.fingerprintId === currentFingerprintId) {
          continue;
        }

        // Don't filter by userId here - we want to find cross-user correlations
        // The triangular reconciliation will handle user-visitor relationships

        // Find existing visitor associations for this fingerprint
        const associations = await this.getVisitorAssociationsForFingerprint(
          similarFingerprint.fingerprintId
        );

        for (const association of associations) {
          if (association.visitorId !== currentVisitorId) {
            candidateVisitorIds.add(association.visitorId);
            fingerprintToVisitorMap.set(
              similarFingerprint.fingerprintId,
              association.visitorId
            );
          }
        }
      }

      if (candidateVisitorIds.size === 0) {
        console.log("✅ No visitor reconciliation needed");
        return;
      }

      console.log("🔍 Found candidate visitors for reconciliation:", {
        candidates: candidateVisitorIds.size,
        visitorIds: Array.from(candidateVisitorIds).map(
          (id) => id.substring(0, 8) + "..."
        ),
      });

      // STEP 3: Determine the primary visitor ID (oldest one)
      let primaryVisitorId = currentVisitorId;
      let earliestTimestamp = metadata.timestamp;

      for (const candidateId of candidateVisitorIds) {
        const visitor = await this.getVisitorById(candidateId);
        if (visitor && visitor.createdAt < earliestTimestamp) {
          primaryVisitorId = candidateId;
          earliestTimestamp = visitor.createdAt;
        }
      }

      // If current visitor is already primary, no need to reconcile
      if (primaryVisitorId === currentVisitorId) {
        console.log(
          "✅ Current visitor is already primary, no reconciliation needed"
        );
        return;
      }

      console.log("🔄 Reconciling visitors under primary:", {
        primaryVisitorId: primaryVisitorId.substring(0, 8) + "...",
        mergingCount: candidateVisitorIds.size,
      });

      // STEP 4: Merge all candidate visitors into the primary visitor
      const allVisitorIds = [
        currentVisitorId,
        ...Array.from(candidateVisitorIds),
      ];
      await this.mergeVisitorsIntoPrimary(
        primaryVisitorId,
        allVisitorIds,
        userId
      );

      // STEP 5: Handle user-visitor relationships through triangular table
      await this.reconcileUserVisitorRelationships(
        primaryVisitorId,
        allVisitorIds,
        userId
      );
    } catch (error) {
      console.error("❌ Triangular reconciliation failed:", error);
      // Don't throw - reconciliation failure shouldn't break fingerprint collection
    }
  }

  /**
   * Reconcile user-visitor relationships in the triangular table
   * Supports many-to-many relationships:
   * - One person with multiple accounts (many user_ids → one visitor_id)
   * - Shared accounts (one user_id → many visitor_ids)
   */
  private static async reconcileUserVisitorRelationships(
    primaryVisitorId: string,
    allVisitorIds: string[],
    currentUserId: string
  ): Promise<void> {
    console.log("🔺 Reconciling user-visitor relationships:", {
      primaryVisitor: primaryVisitorId.substring(0, 8) + "...",
      allVisitors: allVisitorIds.length,
      currentUser: currentUserId.substring(0, 8) + "...",
    });

    // 1. Get all existing user-visitor relationships for these visitors
    const existingRelationships = await this.getUserVisitorRelationships(
      allVisitorIds
    );

    console.log("📊 Found existing relationships:", {
      total: existingRelationships.length,
      relationships: existingRelationships.map((r) => ({
        user: r.userId.substring(0, 8) + "...",
        visitor: r.visitorId.substring(0, 8) + "...",
        confidence: r.confidence,
      })),
    });

    // 2. Collect all unique user IDs from existing relationships
    const allUserIds = new Set<string>();
    allUserIds.add(currentUserId); // Always include current user

    for (const relationship of existingRelationships) {
      allUserIds.add(relationship.userId);
    }

    // 3. Create/update relationships for primary visitor with all users
    for (const userId of allUserIds) {
      await this.createOrUpdateUserVisitorRelationship(
        userId,
        primaryVisitorId,
        this.calculateRelationshipConfidence(
          userId,
          allVisitorIds,
          existingRelationships
        )
      );
    }

    // 4. Remove old relationships for secondary visitors
    const secondaryVisitorIds = allVisitorIds.filter(
      (id) => id !== primaryVisitorId
    );
    for (const secondaryVisitorId of secondaryVisitorIds) {
      await this.removeVisitorRelationships(secondaryVisitorId);
    }

    console.log("✅ User-visitor relationships reconciled successfully");
  }

  /**
   * Calculate confidence score for user-visitor relationship
   */
  private static calculateRelationshipConfidence(
    userId: string,
    visitorIds: string[],
    existingRelationships: Array<{
      userId: string;
      visitorId: string;
      confidence: number;
    }>
  ): number {
    const userRelationships = existingRelationships.filter(
      (r) => r.userId === userId
    );

    if (userRelationships.length === 0) {
      return 0.8; // Default confidence for new relationship
    }

    // Higher confidence if user has relationships with multiple visitors being merged
    const matchingVisitors = userRelationships.filter((r) =>
      visitorIds.includes(r.visitorId)
    );
    const confidenceBoost = Math.min(matchingVisitors.length * 0.1, 0.2);

    const avgConfidence =
      userRelationships.reduce((sum, r) => sum + r.confidence, 0) /
      userRelationships.length;
    return Math.min(avgConfidence + confidenceBoost, 1.0);
  }

  /**
   * Create or update user-visitor relationship in triangular table
   */
  private static async createOrUpdateUserVisitorRelationship(
    userId: string,
    visitorId: string,
    confidence: number
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // Store bidirectional relationship for efficient querying
    const relationship = {
      userId,
      visitorId,
      confidence,
      createdAt: timestamp,
      updatedAt: timestamp,
      ttl: Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000), // 1 year TTL
    };

    // Primary record: USER -> VISITOR (for finding visitors by user)
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER_VISITOR#${userId}`,
          SK: `VISITOR#${visitorId}`,
          GSI1PK: `VISITOR_USER#${visitorId}`, // Reverse lookup
          GSI1SK: `USER#${userId}`,
          GSI2PK: `USER_CONFIDENCE#${userId}`,
          GSI2SK: `${confidence.toFixed(3)}#${timestamp}`, // Sort by confidence
          EntityType: "UserVisitorRelationship",
          ...relationship,
        },
      })
    );

    console.log("🔗 Created/updated user-visitor relationship:", {
      user: userId.substring(0, 8) + "...",
      visitor: visitorId.substring(0, 8) + "...",
      confidence,
    });
  }

  /**
   * Get all user-visitor relationships for given visitor IDs
   */
  private static async getUserVisitorRelationships(
    visitorIds: string[]
  ): Promise<Array<{ userId: string; visitorId: string; confidence: number }>> {
    const relationships: Array<{
      userId: string;
      visitorId: string;
      confidence: number;
    }> = [];

    // Query each visitor ID to find associated users
    for (const visitorId of visitorIds) {
      try {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :visitorPK",
          ExpressionAttributeValues: {
            ":visitorPK": `VISITOR_USER#${visitorId}`,
          },
        });

        const result = await docClient.send(command);

        if (result.Items) {
          for (const item of result.Items) {
            relationships.push({
              userId: item["userId"],
              visitorId: item["visitorId"],
              confidence: item["confidence"] || 0.8,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error querying relationships for visitor ${visitorId}:`,
          error
        );
      }
    }

    return relationships;
  }

  /**
   * Remove all relationships for a visitor (used when merging visitors)
   */
  private static async removeVisitorRelationships(
    visitorId: string
  ): Promise<void> {
    try {
      // Find all relationships for this visitor
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :visitorPK",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR_USER#${visitorId}`,
        },
      });

      const result = await docClient.send(command);

      if (result.Items && result.Items.length > 0) {
        // Delete each relationship
        const deletePromises = result.Items.map((item) =>
          docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `USER_VISITOR#${item["userId"]}`,
                SK: `VISITOR#${visitorId}`,
              },
            })
          )
        );

        await Promise.all(deletePromises);

        console.log("🗑️ Removed relationships for visitor:", {
          visitorId: visitorId.substring(0, 8) + "...",
          count: result.Items.length,
        });
      }
    } catch (error) {
      console.error("Error removing visitor relationships:", error);
    }
  }

  // ============ TRIANGULAR TABLE QUERY METHODS ============

  /**
   * Get all visitors associated with a user (for finding all identities using one shared account)
   */
  static async getVisitorsByUserId(
    userId: string,
    minConfidence = 0.5
  ): Promise<
    Array<{ visitorId: string; confidence: number; createdAt: string }>
  > {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :userPK",
        FilterExpression: "confidence >= :minConfidence",
        ExpressionAttributeValues: {
          ":userPK": `USER_VISITOR#${userId}`,
          ":minConfidence": minConfidence,
        },
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        confidence: item["confidence"],
        createdAt: item["createdAt"],
      }));
    } catch (error) {
      console.error("Error getting visitors by user ID:", error);
      return [];
    }
  }

  /**
   * Get all users associated with a visitor (for multiple accounts used by the same identity)
   */
  static async getUsersByVisitorId(
    visitorId: string,
    minConfidence = 0.5
  ): Promise<Array<{ userId: string; confidence: number; createdAt: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :visitorPK",
        FilterExpression: "confidence >= :minConfidence",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR_USER#${visitorId}`,
          ":minConfidence": minConfidence,
        },
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        userId: item["userId"],
        confidence: item["confidence"],
        createdAt: item["createdAt"],
      }));
    } catch (error) {
      console.error("Error getting users by visitor ID:", error);
      return [];
    }
  }

  /**
   * Get high-confidence visitors for a user (sorted by confidence)
   */
  static async getHighConfidenceVisitorsByUserId(
    userId: string,
    limit = 10
  ): Promise<Array<{ visitorId: string; confidence: number }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :userPK",
        ExpressionAttributeValues: {
          ":userPK": `USER_CONFIDENCE#${userId}`,
        },
        ScanIndexForward: false, // Sort by confidence DESC
        Limit: limit,
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        confidence: item["confidence"],
      }));
    } catch (error) {
      console.error("Error getting high-confidence visitors:", error);
      return [];
    }
  }

  /**
   * Check if user and visitor are associated
   */
  static async isUserVisitorAssociated(
    userId: string,
    visitorId: string
  ): Promise<{ associated: boolean; confidence?: number }> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER_VISITOR#${userId}`,
          SK: `VISITOR#${visitorId}`,
        },
      });

      const result = await docClient.send(command);

      if (result.Item) {
        return {
          associated: true,
          confidence: result.Item["confidence"],
        };
      }

      return { associated: false };
    } catch (error) {
      console.error("Error checking user-visitor association:", error);
      return { associated: false };
    }
  }

  /**
   * Get visitor associations for a specific fingerprint
   */
  private static async getVisitorAssociationsForFingerprint(
    fingerprintId: string
  ): Promise<Array<{ visitorId: string; associatedAt: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :fingerprintPK",
        ExpressionAttributeValues: {
          ":fingerprintPK": `FINGERPRINT#${fingerprintId}`,
        },
      });

      const result = await docClient.send(command);
      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        associatedAt: item["associatedAt"],
      }));
    } catch (error) {
      console.error("Error getting visitor associations:", error);
      return [];
    }
  }

  /**
   * Merge multiple visitors into a primary visitor identity
   * This is the core of the triangular reconciliation system
   */
  private static async mergeVisitorsIntoPrimary(
    primaryVisitorId: string,
    allVisitorIds: string[],
    userId: string
  ): Promise<void> {
    console.log("🔀 Merging visitors into primary:", {
      primary: primaryVisitorId.substring(0, 8) + "...",
      merging: allVisitorIds.length,
      userId: userId.substring(0, 8) + "...",
    });

    const secondaryVisitorIds = allVisitorIds.filter(
      (id) => id !== primaryVisitorId
    );

    for (const secondaryVisitorId of secondaryVisitorIds) {
      try {
        // 1. Get all fingerprint associations for secondary visitor
        const secondaryAssociations = await this.getAssociationsForVisitor(
          secondaryVisitorId
        );

        // 2. Re-associate all fingerprints to primary visitor
        for (const association of secondaryAssociations) {
          await this.reassociateFingerprintToPrimaryVisitor(
            association.fingerprintId,
            secondaryVisitorId,
            primaryVisitorId
          );
        }

        // 3. Merge visitor profile data
        await this.mergeVisitorProfiles(primaryVisitorId, secondaryVisitorId);

        // 4. Clean up secondary visitor record
        await this.cleanupSecondaryVisitor(secondaryVisitorId);

        console.log("✅ Merged secondary visitor:", {
          secondary: secondaryVisitorId.substring(0, 8) + "...",
          associations: secondaryAssociations.length,
        });
      } catch (error) {
        console.error("❌ Failed to merge visitor:", secondaryVisitorId, error);
        // Continue with other visitors even if one fails
      }
    }

    console.log("🎉 Triangular reconciliation completed successfully");
  }

  /**
   * Get all fingerprint associations for a visitor
   */
  private static async getAssociationsForVisitor(
    visitorId: string
  ): Promise<Array<{ fingerprintId: string; fingerprintHash: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression:
          "PK = :visitorPK AND begins_with(SK, :fingerprintPrefix)",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR#${visitorId}`,
          ":fingerprintPrefix": "FINGERPRINT#",
        },
      });

      const result = await docClient.send(command);
      return (result.Items || []).map((item) => ({
        fingerprintId: item["fingerprintId"],
        fingerprintHash: item["fingerprintHash"],
      }));
    } catch (error) {
      console.error("Error getting associations for visitor:", error);
      return [];
    }
  }

  /**
   * Re-associate a fingerprint from secondary to primary visitor
   */
  private static async reassociateFingerprintToPrimaryVisitor(
    fingerprintId: string,
    secondaryVisitorId: string,
    _primaryVisitorId: string
  ): Promise<void> {
    try {
      // Delete old association
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${secondaryVisitorId}`,
            SK: `FINGERPRINT#${fingerprintId}`,
          },
        })
      );

      // The new association will be created by the calling function
      // We just need to clean up the old one here
    } catch (error) {
      console.error("Error reassociating fingerprint:", error);
    }
  }

  /**
   * Merge visitor profile data from secondary into primary
   */
  private static async mergeVisitorProfiles(
    primaryVisitorId: string,
    secondaryVisitorId: string
  ): Promise<void> {
    try {
      const [primaryVisitor, secondaryVisitor] = await Promise.all([
        this.getVisitorById(primaryVisitorId),
        this.getVisitorById(secondaryVisitorId),
      ]);

      if (!primaryVisitor || !secondaryVisitor) {
        return;
      }

      // Merge visit counts and session times
      const mergedData = {
        visitCount:
          (primaryVisitor.visitCount || 0) + (secondaryVisitor.visitCount || 0),
        totalSessionTime:
          (primaryVisitor.totalSessionTime || 0) +
          (secondaryVisitor.totalSessionTime || 0),
        associatedFingerprints: [
          ...new Set([
            ...(primaryVisitor.associatedFingerprints || []),
            ...(secondaryVisitor.associatedFingerprints || []),
          ]),
        ],
        // Use the earlier creation date
        createdAt:
          primaryVisitor.createdAt < secondaryVisitor.createdAt
            ? primaryVisitor.createdAt
            : secondaryVisitor.createdAt,
        // Use the latest last seen date
        lastSeenAt:
          primaryVisitor.lastSeenAt > secondaryVisitor.lastSeenAt
            ? primaryVisitor.lastSeenAt
            : secondaryVisitor.lastSeenAt,
      };

      // Update primary visitor with merged data
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${primaryVisitorId}`,
            SK: "PROFILE",
          },
          UpdateExpression: `
          SET visitCount = :visitCount,
              totalSessionTime = :totalSessionTime,
              associatedFingerprints = :fingerprints,
              createdAt = :createdAt,
              lastSeenAt = :lastSeenAt
        `,
          ExpressionAttributeValues: {
            ":visitCount": mergedData.visitCount,
            ":totalSessionTime": mergedData.totalSessionTime,
            ":fingerprints": mergedData.associatedFingerprints,
            ":createdAt": mergedData.createdAt,
            ":lastSeenAt": mergedData.lastSeenAt,
          },
        })
      );
    } catch (error) {
      console.error("Error merging visitor profiles:", error);
    }
  }

  /**
   * Clean up secondary visitor record after merge
   */
  private static async cleanupSecondaryVisitor(
    secondaryVisitorId: string
  ): Promise<void> {
    try {
      // Delete visitor profile
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${secondaryVisitorId}`,
            SK: "PROFILE",
          },
        })
      );

      console.log("🗑️ Cleaned up secondary visitor:", {
        visitorId: secondaryVisitorId.substring(0, 8) + "...",
      });
    } catch (error) {
      console.error("Error cleaning up secondary visitor:", error);
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

  // ================= HELPER METHODS =================

  /**
   * Gets all user-visitor relationships for a given user with detailed metadata
   */
  static async getUserVisitorRelationshipsWithDetails(userId: string): Promise<Array<{
    visitorId: string;
    confidence: number;
    firstSeen: string;
    lastSeen: string;
    associationCount: number;
  }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :userPk",
        ExpressionAttributeValues: {
          ":userPk": `USER_VISITOR#${userId}`
        }
      });

      const result = await docClient.send(command);
      return result.Items?.map(item => ({
        visitorId: item['visitorId'] as string,
        confidence: item['confidence'] as number,
        firstSeen: item['firstSeen'] as string,
        lastSeen: item['lastSeen'] as string,
        associationCount: item['associationCount'] as number
      })) || [];
    } catch (error) {
      console.error("Error getting user-visitor relationships with details:", error);
      return [];
    }
  }

  /**
   * Gets all visitor-user relationships for a given visitor with detailed metadata
   */
  static async getVisitorUserRelationshipsWithDetails(visitorId: string): Promise<Array<{
    userId: string;
    confidence: number;
    firstSeen: string;
    lastSeen: string;
    associationCount: number;
  }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :visitorPk",
        ExpressionAttributeValues: {
          ":visitorPk": `VISITOR_USER#${visitorId}`
        }
      });

      const result = await docClient.send(command);
      return result.Items?.map(item => ({
        userId: item['userId'] as string,
        confidence: item['confidence'] as number,
        firstSeen: item['firstSeen'] as string,
        lastSeen: item['lastSeen'] as string,
        associationCount: item['associationCount'] as number
      })) || [];
    } catch (error) {
      console.error("Error getting visitor-user relationships with details:", error);
      return [];
    }
  }

  /**
   * Bulk update user-visitor relationships for visitor merging scenarios
   */
  static async bulkUpdateUserVisitorRelationships(
    oldVisitorId: string,
    newVisitorId: string
  ): Promise<void> {
    try {
      // Get all user relationships for the old visitor
      const oldRelationships = await this.getVisitorUserRelationshipsWithDetails(oldVisitorId);
      
      // Update each relationship to point to the new visitor
      for (const relationship of oldRelationships) {
        // Create new relationship with new visitor
        await this.createOrUpdateUserVisitorRelationship(
          relationship.userId,
          newVisitorId,
          relationship.confidence
        );
        
        // Remove old relationship
        await this.removeUserVisitorRelationship(relationship.userId, oldVisitorId);
      }
      
      console.log(`🔄 Bulk updated ${oldRelationships.length} user-visitor relationships from ${oldVisitorId} to ${newVisitorId}`);
    } catch (error) {
      console.error("Error in bulk update user-visitor relationships:", error);
      throw error;
    }
  }

  /**
   * Remove a specific user-visitor relationship
   */
  static async removeUserVisitorRelationship(userId: string, visitorId: string): Promise<void> {
    try {
      const batch = [
        // Remove USER_VISITOR record
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER_VISITOR#${userId}`,
            SK: `VISITOR#${visitorId}`
          }
        }),
        // Remove VISITOR_USER record
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR_USER#${visitorId}`,
            SK: `USER#${userId}`
          }
        })
      ];

      await Promise.all(batch.map(command => docClient.send(command)));
      console.log(`🗑️ Removed user-visitor relationship: ${userId} <-> ${visitorId}`);
    } catch (error) {
      console.error("Error removing user-visitor relationship:", error);
      throw error;
    }
  }
}
