import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { FingerprintDatabaseService } from "./utils/fingerprint-db";
import { ResponseUtil } from "@shared/utils/response";
import { FingerprintCollectionRequest } from "@shared/types/fingerprint";
import { v4 as uuidv4 } from "uuid";
import {
  extractServerEnhancement,
  storeVisitorEvent,
} from "./utils/collect-utils";

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
    const userId = event.requestContext.authorizer?.["userId"];
    const sessionId = fingerprintData.sessionId || uuidv4();

    // Extract server-side enhancements
    const serverEnhancement = extractServerEnhancement(event);

    // Generate fingerprint hash for uniqueness
    const fingerprintHash = FingerprintDatabaseService.generateFingerprintHash(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint
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
      // Try to find similar fingerprints using the advanced fuzzy matching
      const similarFingerprints =
        await FingerprintDatabaseService.findSimilarFingerprintsAdvanced(
          fingerprintData.coreFingerprint,
          fingerprintData.advancedFingerprint,
          5
        );

      if (similarFingerprints.length > 0) {
        // Calculate similarity with the best match
        const bestMatch = similarFingerprints[0];
        if (bestMatch) {
          // For simplicity, just treat any similar fingerprint as a returning visitor
          isNewVisitor = false;
          confidence = 0.8; // Base confidence for fuzzy matches
          // Use the fingerprint ID as a visitor identifier for simplicity
          visitorId = bestMatch.fingerprintId;
          console.log(
            "🔄 Found similar fingerprint, treating as returning visitor"
          );
        }
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
