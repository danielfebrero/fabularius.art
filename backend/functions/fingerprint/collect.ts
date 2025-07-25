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
        fingerprintData.behavioralData,
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
          fingerprintData.behavioralData,
          userId,
          5,
          0.7 // Confidence threshold for reconciliation
        );

      console.log("🔍 Enhanced fuzzy matching results:", {
        found: similarFingerprints.length,
        matches: similarFingerprints.map((fp) => ({
          id: fp.fingerprintId.substring(0, 8) + "...",
          hash: fp.fingerprintHash.substring(0, 8) + "...",
          similarity: fp.similarity.toFixed(3),
          confidence: fp.confidence.toFixed(3),
          signals: fp.signals,
          components: fp.matchedComponents.join(", "),
          created: fp.createdAt,
          lastSeen: fp.lastSeenAt,
        })),
      });

      if (similarFingerprints.length > 0) {
        // Get the best match (already sorted by confidence)
        const bestMatch = similarFingerprints[0];
        if (bestMatch) {
          console.log("🔍 Best match analysis:", {
            similarity: bestMatch.similarity.toFixed(3),
            confidence: bestMatch.confidence.toFixed(3),
            signals: bestMatch.signals,
            components: bestMatch.matchedComponents.join(", "),
            threshold: 0.7,
            willReconcile: bestMatch.confidence >= 0.7,
          });

          // Use confidence threshold for reconciliation decision
          if (bestMatch.confidence >= 0.7) {
            isNewVisitor = false;
            confidence = bestMatch.confidence;

            // CRITICAL FIX: Look up the actual visitorId associated with this fingerprintId
            // Instead of using fingerprintId as visitorId
            const existingAssociations =
              await FingerprintDatabaseService.getVisitorAssociationsForFingerprint(
                bestMatch.fingerprintId
              );

            if (existingAssociations.length > 0) {
              // Use the visitorId from the existing association (take the first one)
              const association = existingAssociations[0];
              if (association && association.visitorId) {
                visitorId = association.visitorId;
                console.log(
                  "🔄 High-confidence match found, using existing visitor",
                  {
                    similarity: bestMatch.similarity.toFixed(3),
                    confidence: bestMatch.confidence.toFixed(3),
                    signals: bestMatch.signals,
                    matchedFingerprintId:
                      bestMatch.fingerprintId.substring(0, 8) + "...",
                    existingVisitorId: visitorId.substring(0, 8) + "...",
                    components: bestMatch.matchedComponents.join(", "),
                  }
                );
              } else {
                console.warn(
                  "⚠️ Found association but no valid visitorId, treating as new visitor",
                  {
                    associationData: association,
                  }
                );
                isNewVisitor = true;
                visitorId = uuidv4(); // Keep the new visitorId
              }
            } else {
              console.warn(
                "⚠️ No visitor associations found for fingerprint match, treating as new visitor",
                {
                  matchedFingerprintId:
                    bestMatch.fingerprintId.substring(0, 8) + "...",
                }
              );
              isNewVisitor = true;
              visitorId = uuidv4(); // Keep the new visitorId
            }
          } else {
            console.log(
              "🆕 Confidence below reconciliation threshold, treating as new visitor",
              {
                confidence: bestMatch.confidence.toFixed(3),
                threshold: 0.7,
                signals: bestMatch.signals,
              }
            );
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
