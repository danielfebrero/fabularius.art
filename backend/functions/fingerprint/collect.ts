import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { FingerprintDatabaseService } from "./utils/fingerprint-db";
import { ResponseUtil } from "@shared/utils/response";
import { FingerprintCollectionRequest } from "@shared/types/fingerprint";
import { v4 as uuidv4 } from "uuid";
import {
  extractServerEnhancement,
  storeVisitorEvent,
} from "./utils/collect-utils";
import { UserAuthMiddleware } from "@shared/index";

/**
 * Clean fingerprint collection with simple visitor tracking
 * POST /fingerprint/collect
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 Fingerprint collection started");

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    // Validate user session
    const authResult = await UserAuthMiddleware.validateSession(event);
    const user = authResult.user;

    // Parse fingerprint data
    const fingerprintData: FingerprintCollectionRequest = JSON.parse(
      event.body
    );

    // Validate required fields
    if (
      !fingerprintData.coreFingerprint ||
      !fingerprintData.advancedFingerprint
    ) {
      return ResponseUtil.badRequest(
        event,
        "Core and advanced fingerprint data are required"
      );
    }

    const timestamp = new Date().toISOString();
    const userId = user?.userId;
    const sessionId = fingerprintData.sessionId || uuidv4();

    // Extract server-side enhancements
    const serverEnhancement = extractServerEnhancement(event);

    // Generate fingerprint hash for uniqueness
    const fingerprintHash = FingerprintDatabaseService.generateFingerprintHash(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint,
      userId
    );

    console.log("🔧 Processing fingerprint:", {
      hasUserId: !!userId,
      sessionId,
      fingerprintHash: fingerprintHash.substring(0, 8) + "...",
    });

    // === SIMPLIFIED VISITOR TRACKING ===

    // 1. Check for similar fingerprints to determine if returning visitor
    let isNewVisitor = true;
    let confidence = 1.0;
    let visitorId = uuidv4();

    try {
      // Generate fuzzy hashes to debug what we're looking for
      const currentFuzzyHashes = FingerprintDatabaseService.generateFuzzyHashes(
        fingerprintData.coreFingerprint,
        fingerprintData.advancedFingerprint,
        userId
      );

      console.log("🔍 Generated fuzzy hashes for current fingerprint:", {
        count: currentFuzzyHashes.length,
        hashes: currentFuzzyHashes.map((h) => h.substring(0, 8) + "..."),
        fingerprintHash: fingerprintHash.substring(0, 8) + "...",
      });

      // Try to find similar fingerprints using the advanced fuzzy matching
      const similarFingerprints =
        await FingerprintDatabaseService.findSimilarFingerprintsAdvanced(
          fingerprintData.coreFingerprint,
          fingerprintData.advancedFingerprint,
          userId,
          5
        );

      console.log("🔍 Fuzzy matching results:", {
        found: similarFingerprints.length,
        matches: similarFingerprints.map((fp) => ({
          id: fp.fingerprintId.substring(0, 8) + "...",
          hash: fp.fingerprintHash.substring(0, 8) + "...",
          fuzzyHashes:
            fp.fuzzyHashes?.map((h) => h.substring(0, 8) + "...") || [],
          created: fp.createdAt,
          lastSeen: fp.lastSeenAt,
        })),
      });

      if (similarFingerprints.length > 0) {
        // Calculate similarity with the best match
        const bestMatch = similarFingerprints[0];
        if (bestMatch) {
          // Calculate actual similarity score
          const similarity = FingerprintDatabaseService.calculateSimilarity(
            {
              fingerprintId: "temp-id", // Temporary ID for comparison
              fingerprintHash,
              coreFingerprint: fingerprintData.coreFingerprint,
              advancedFingerprint: fingerprintData.advancedFingerprint,
              fuzzyHashes: currentFuzzyHashes,
            } as any,
            bestMatch
          );

          console.log("🔍 Similarity calculation:", {
            similarity,
            threshold: 0.7,
            willMatch: similarity >= 0.7,
          });

          // Only treat as returning visitor if similarity is high enough
          if (similarity >= 0.7) {
            isNewVisitor = false;
            confidence = similarity;
            // Use the best match's fingerprint ID as visitor identifier
            visitorId = bestMatch.fingerprintId;
            console.log(
              "🔄 Found similar fingerprint, treating as returning visitor",
              {
                similarity,
                confidence,
                matchedFingerprintId:
                  bestMatch.fingerprintId.substring(0, 8) + "...",
              }
            );
          } else {
            console.log("🆕 Similarity too low, treating as new visitor", {
              similarity,
              threshold: 0.7,
            });
          }
        }
      } else {
        console.log(
          "🆕 No similar fingerprints found, treating as new visitor"
        );
      }
    } catch (error) {
      console.warn(
        "Similar fingerprint detection failed, treating as new visitor:",
        error
      );
    }

    // 2. Create fingerprint entity (this serves as our visitor tracking record)
    const fingerprintEntity =
      await FingerprintDatabaseService.createFingerprint(
        fingerprintData,
        serverEnhancement,
        userId,
        sessionId
      );

    // 3. CRITICAL: Associate visitorId with fingerprintId in the database
    await FingerprintDatabaseService.storeVisitorFingerprintAssociation(
      visitorId,
      fingerprintEntity.fingerprintId,
      {
        isNewVisitor,
        confidence,
        timestamp,
        fingerprintHash,
      }
    );

    // 4. Create session correlation
    await FingerprintDatabaseService.createFingerprintSession(
      fingerprintEntity.fingerprintId,
      sessionId,
      userId,
      Math.round(confidence * 100)
    );

    // 4. Simple analytics update - store visitor event
    await storeVisitorEvent({
      visitorId,
      sessionId,
      fingerprintId: fingerprintEntity.fingerprintId,
      isNewVisitor,
      confidence,
      timestamp,
      userAgent: serverEnhancement.httpHeaders.userAgent,
      country: serverEnhancement.ipGeolocation.country,
    });

    console.log("✅ Fingerprint collection successful:", {
      visitorId,
      sessionId,
      isNewVisitor,
      confidence,
      fingerprintId: fingerprintEntity.fingerprintId,
    });

    return ResponseUtil.success(event, {
      visitorId,
      sessionId,
      isNewVisitor,
      confidence,
    });
  } catch (error) {
    console.error("💥 Fingerprint collection error:", error);
    return ResponseUtil.internalError(event, "Fingerprint collection failed");
  }
};
