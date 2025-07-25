# Entropy-Based LSH Ponderation System

## Overview

The enhanced fingerprint similarity detection system now uses entropy-based ponderation to weight LSH bucket configurations by their collision probabilities and uniqueness characteristics. This prevents false positives from common hash values and improves the accuracy of visitor reconciliation.

## Core Concepts

### 1. Entropy Weighting

Each LSH bucket configuration has an assigned **entropy score** (0-1) representing how unique the combinations within that bucket typically are:

```typescript
entropy: 0.95, // Very high uniqueness - hardware combinations are highly diverse
entropy: 0.75, // Good uniqueness - but common resolutions/timezones exist
entropy: 0.50, // Medium uniqueness - many devices share these characteristics
```

**Higher entropy = More unique = Less likely to produce false positives**

### 2. Collision Probability

Each bucket also has a **collision probability** representing the likelihood that two different users would produce the same hash:

```typescript
collisionProbability: 0.001,  // Very rare collisions
collisionProbability: 0.05,   // 5% chance of collision
collisionProbability: 0.08,   // 8% chance of collision
```

**Lower collision probability = More reliable for identification**

## LSH Bucket Analysis

### Highest Reliability Buckets

#### 1. **userDevice** (Entropy: 0.99, Collision: 0.00005%)

- **Features**: userId + webglVendor + webglRenderer + canvas
- **Why High Entropy**: User identity combined with specific hardware fingerprint
- **Use Case**: Authenticated user on known device
- **Signal Quality**: Maximum - virtually impossible false positives

#### 2. **userProfile** (Entropy: 0.98, Collision: 0.0001%)

- **Features**: userId + timezone + language + screenResolution
- **Why High Entropy**: User identity with environmental preferences
- **Use Case**: User behavior consistency across sessions
- **Signal Quality**: Excellent - strong user correlation

#### 3. **coreHardware** (Entropy: 0.95, Collision: 0.1%)

- **Features**: canvas + webglVendor + webglRenderer + audioContext
- **Why High Entropy**: Hardware fingerprint combinations are highly diverse
- **Use Case**: Device recognition across browser sessions
- **Signal Quality**: Excellent - hardware-level uniqueness

### Medium Reliability Buckets

#### 4. **webglProfile** (Entropy: 0.90, Collision: 0.5%)

- **Features**: webglVendor + webglRenderer + webglExtensions
- **Why High Entropy**: GPU profiles are device-specific
- **Use Case**: Graphics hardware identification
- **Signal Quality**: High - GPU combinations well-distributed

#### 5. **browserCapabilities** (Entropy: 0.85, Collision: 2%)

- **Features**: canvas + webglExtensions + fontSample
- **Why Good Entropy**: Browser/font combinations create diversity
- **Use Case**: Browser family and capability detection
- **Signal Quality**: Good - sufficient for browser correlation

### Lower Reliability Buckets

#### 6. **displayAudio** (Entropy: 0.80, Collision: 3%)

- **Features**: canvas + audioContext + screenResolution
- **Why Medium Entropy**: Common screen resolutions reduce uniqueness
- **Use Case**: Media capability correlation
- **Signal Quality**: Medium - useful but not definitive

#### 7. **deviceEnvironment** (Entropy: 0.75, Collision: 5%)

- **Features**: screenResolution + timezone + language + webglVendor
- **Why Lower Entropy**: Common resolutions and timezones increase collisions
- **Use Case**: Geographic and environmental consistency
- **Signal Quality**: Medium - good for regional correlation

#### 8. **mixedStability** (Entropy: 0.70, Collision: 8%)

- **Features**: webglRenderer + audioContext + screenResolution + userAgent
- **Why Lowest Entropy**: UserAgent and resolution have many common values
- **Use Case**: General-purpose fallback matching
- **Signal Quality**: Lower - useful for broad similarity detection

## Enhanced Similarity Calculation

### Signal-Based Confidence Scoring

The new similarity system uses **multiple signals** rather than simple hash matching:

```typescript
{
  similarity: 0.847,     // Raw weighted similarity (0-1)
  confidence: 0.923,     // Confidence adjusted for entropy and signals (0-1)
  signals: 6,           // Number of matching LSH buckets
  matchedComponents: [   // Which buckets matched
    'userDevice',
    'coreHardware',
    'webglProfile',
    'browserCapabilities',
    'displayAudio',
    'deviceEnvironment'
  ]
}
```

### Confidence Calculation Formula

```typescript
confidence =
  similarity * signalBonus * 1.2 + entropyBonus * 0.3 + consistencyBonus;
```

Where:

- **similarity**: Entropy-weighted match score
- **signalBonus**: More matching buckets = higher confidence (0-1)
- **entropyBonus**: Quality of matched buckets (entropy-weighted)
- **consistencyBonus**: Bonus for 3+ consistent signals (+0.1)

## Reconciliation Process

### 1. **Candidate Collection**

```typescript
// Collect candidates from high-entropy buckets first
for (bucketConfig of LSH_BUCKET_CONFIGS.sortBy(entropy)) {
  const bucketLimit = Math.ceil(searchLimit * bucketConfig.entropy);
  const matches = await findFuzzyHashMatches(fuzzyHash, bucketLimit);
  // Add to candidate pool
}
```

### 2. **Entropy-Weighted Scoring**

```typescript
// Score each candidate using enhanced similarity
for (candidate of potentialMatches) {
  const result = calculateSimilarity(currentFingerprint, candidate);
  if (result.confidence >= confidenceThreshold) {
    qualifiedCandidates.push({ ...candidate, ...result });
  }
}
```

### 3. **Multi-Factor Ranking**

```typescript
// Sort by: confidence → signals → similarity
candidates.sort((a, b) => {
  if (Math.abs(a.confidence - b.confidence) > 0.01) {
    return b.confidence - a.confidence; // Higher confidence first
  }
  if (a.signals !== b.signals) {
    return b.signals - a.signals; // More signals first
  }
  return b.similarity - a.similarity; // Higher similarity first
});
```

### 4. **Threshold-Based Reconciliation**

```typescript
const RECONCILIATION_THRESHOLD = 0.7; // 70% confidence required

if (bestMatch.confidence >= RECONCILIATION_THRESHOLD) {
  // Reconcile as returning visitor (works with or without userId)
  isNewVisitor = false;
  confidence = bestMatch.confidence;
  visitorId = bestMatch.fingerprintId;

  // If userId available, also create user-visitor relationships
  if (userId) {
    await createOrUpdateUserVisitorRelationship(userId, visitorId, confidence);
  }
} else {
  // Treat as new visitor
  isNewVisitor = true;
}
```

## Dual Reconciliation System

The entropy-based ponderation system supports two complementary reconciliation modes:

### Anonymous Reconciliation (No userId Required)

- **Fingerprint similarity only**: Uses entropy-weighted LSH bucket matching
- **High confidence thresholds**: Requires 70%+ confidence to prevent false positives
- **Conservative merging**: Better to create separate visitors than incorrectly merge
- **Works universally**: Functions for all traffic, authenticated or not

```typescript
// Anonymous user returns with similar fingerprint
const candidates = await findSimilarFingerprintsAdvanced(
  coreFingerprint,
  advancedFingerprint,
  undefined, // No userId
  5,
  0.7 // High confidence threshold
);

if (candidates[0]?.confidence >= 0.7) {
  // Merge visitors based on fingerprint similarity alone
  await performTriangularReconciliation(visitorId, fingerprintId, metadata);
}
```

### User-Enhanced Reconciliation (With userId)

- **Identity-anchored matching**: userId provides strong correlation signal
- **Cross-device linking**: Same user across multiple devices/browsers
- **Lower thresholds possible**: userId reduces false positive risk
- **Triangular table updates**: Maintains user-visitor relationships

```typescript
// Authenticated user with enhanced matching
const candidates = await findSimilarFingerprintsAdvanced(
  coreFingerprint,
  advancedFingerprint,
  userId, // Provides identity anchor
  10,
  0.6 // Can use lower threshold with userId
);

// Create bidirectional user-visitor relationships
await createOrUpdateUserVisitorRelationship(userId, visitorId, confidence);
```

### Entropy Impact on Reconciliation Modes

#### Without userId (Higher Entropy Required)

- **userDevice bucket**: Disabled (no userId available)
- **userProfile bucket**: Disabled (no userId available)
- **Remaining buckets**: Must achieve higher confidence collectively
- **Threshold impact**: 70% confidence harder to achieve, preventing false positives

#### With userId (Enhanced Entropy)

- **userDevice bucket**: Maximum weight (0.99 entropy)
- **userProfile bucket**: Very high weight (0.98 entropy)
- **Additive confidence**: Hardware + identity signals compound
- **Threshold flexibility**: Can lower to 60% with strong identity signals

### Real-World Reconciliation Examples

#### Anonymous Visitor Reconciliation

```
Scenario: Same person, two anonymous sessions
Bucket Matches: coreHardware(0.95) + webglProfile(0.90) + browserCapabilities(0.85)
Signals: 3 high-entropy matches
Confidence: 78% → Above 70% threshold → Reconcile
Result: Visitors merged based on hardware similarity
```

#### Authenticated User Reconciliation

```
Scenario: Same user, different device
Bucket Matches: userProfile(0.98) + deviceEnvironment(0.75) + displayAudio(0.80)
Signals: 3 mixed-entropy matches, but userId provides strong anchor
Confidence: 91% → Well above threshold → Reconcile + Link
Result: User-visitor relationship created, cross-device tracking enabled
```

#### Prevented False Positive

```
Scenario: Different people, similar common hardware
Bucket Matches: mixedStability(0.70) + deviceEnvironment(0.75)
Signals: 2 low-entropy matches
Confidence: 42% → Below 70% threshold → No reconciliation
Result: Separate visitors maintained, false positive avoided
```

This dual system ensures that:

1. **Anonymous traffic** gets conservative but accurate visitor reconciliation
2. **Authenticated traffic** gets enhanced cross-device correlation
3. **False positives** are minimized through entropy-aware thresholding
4. **Identity resolution** improves progressively as more signals become available

## Benefits of Entropy-Based Ponderation

### 1. **Reduced False Positives**

- Common hashes (low entropy) have reduced influence
- High-entropy matches carry more weight in decisions
- Collision probability directly factors into confidence

### 2. **Better Signal Quality Assessment**

- Multiple weak signals < fewer strong signals
- Entropy weighting prevents common-value dominance
- Signal count and quality both matter

### 3. **Adaptive Threshold Management**

- Different thresholds for different use cases
- Confidence scores reflect actual reliability
- Dynamic adjustment based on signal patterns

### 4. **Improved Reconciliation Accuracy**

- Fewer incorrect visitor merges
- More accurate returning visitor detection
- Better handling of edge cases (shared devices, similar hardware)

## Use Case Examples

### High-Confidence Reconciliation (95%+ confidence)

```
Scenario: Same user, same device, different browser session
Matched Buckets: userDevice, userProfile, coreHardware, webglProfile
Signals: 4 high-entropy matches
Decision: Definitely returning visitor
```

### Medium-Confidence Reconciliation (70-85% confidence)

```
Scenario: Similar device, different user, same location
Matched Buckets: coreHardware, deviceEnvironment, displayAudio
Signals: 3 mixed-entropy matches
Decision: Likely returning visitor (cautious reconciliation)
```

### Below-Threshold Rejection (< 70% confidence)

```
Scenario: Common hardware, different users
Matched Buckets: mixedStability, deviceEnvironment
Signals: 2 low-entropy matches
Decision: New visitor (avoid false positive)
```

## Performance Considerations

### Query Optimization

- High-entropy buckets searched first (better hit rate)
- Bucket limits scaled by entropy (focus resources on quality)
- Early termination when enough high-confidence matches found

### Computational Efficiency

- Entropy calculations done once at configuration time
- Confidence scoring batched for multiple candidates
- Threshold filtering reduces unnecessary processing

### Scalability

- Entropy weights remain static (no runtime recalculation)
- Bucket-level parallelization possible
- Database queries optimized for high-entropy patterns

## Future Enhancements

### Dynamic Entropy Learning

- Track actual collision rates over time
- Adjust entropy weights based on real-world performance
- Machine learning for optimal threshold tuning

### Context-Aware Ponderation

- Different entropy weights for different user segments
- Geographic/temporal adjustments to collision probabilities
- Behavioral pattern integration into entropy calculations

### Advanced Signal Analysis

- Signal correlation analysis (which combinations work best)
- Temporal decay factors for aging fingerprints
- Confidence calibration based on historical accuracy

This entropy-based ponderation system provides a sophisticated foundation for accurate fingerprint similarity detection while minimizing false positives and optimizing reconciliation decisions.
