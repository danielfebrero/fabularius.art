# Unique Visitor Tracking System

## Overview

This system uses advanced fingerprinting and behavioral analysis to accurately count **unique visitors** rather than just sessions or pageviews. It can distinguish between:

1. **Same person, same device** = 1 unique visitor
2. **Different people, same device** = 2 unique visitors (if behavioral patterns differ)
3. **Same person, different devices** = 1 unique visitor (if fuzzy matching connects them)

## How It Works

### 1. **Fingerprint Collection & Analysis**

- **Core Fingerprinting**: Canvas, WebGL, Audio, Fonts, CSS, Timing
- **Behavioral Fingerprinting**: Mouse patterns, typing speed, interaction timing
- **Device Fingerprinting**: Screen resolution, timezone, user agent, hardware capabilities

### 2. **Visitor Identification Process**

#### Step 1: Exact Fingerprint Match

```typescript
// Check if this exact fingerprint has been seen before
const existingVisitor = await findVisitorByFingerprint(fingerprintHash);
```

#### Step 2: Behavioral Validation

```typescript
// If found, verify it's the same person (not different user on same device)
const behavioralSimilarity = calculateBehavioralSimilarity(
  existingSignature,
  newBehavioralData
);

if (behavioralSimilarity >= 0.7) {
  // Same person, same device
  return existingVisitor;
} else {
  // Different person, same device - create new visitor
  return createNewVisitor();
}
```

#### Step 3: Fuzzy Cross-Device Matching

```typescript
// If no exact match, check for same person on different device
const similarFingerprints = await findSimilarFingerprintsAdvanced(
  fingerprintHash
);

for (const similar of similarFingerprints) {
  const crossDeviceSimilarity = calculateCrossDeviceSimilarity(
    candidateVisitor.behavioralSignature,
    newBehavioralData
  );

  if (crossDeviceSimilarity >= 0.8) {
    // Same person, different device
    await associateFingerprintWithVisitor(candidateVisitor.id, fingerprintHash);
    return candidateVisitor;
  }
}
```

#### Step 4: Create New Visitor

```typescript
// No matches found - this is a genuinely new unique visitor
return createNewVisitor(fingerprintHash, behavioralData);
```

## Key Features

### **Behavioral Similarity Detection**

Identifies if two sessions on the same device are from different people:

```typescript
// Factors that distinguish users on same device:
- Typing speed & rhythm (stable per person)
- Mouse velocity patterns
- Click timing consistency
- Interaction frequency
- Navigation patterns
```

### **Cross-Device Recognition**

Identifies when the same person uses different devices:

```typescript
// Factors that connect same person across devices:
- Typing speed (very stable per person)
- Typing rhythm patterns
- Timezone consistency
- Language preferences
- Time-of-day usage patterns
```

### **Fuzzy Hardware Matching**

Uses LSH (Locality-Sensitive Hashing) to find similar devices:

```typescript
// Hardware features that rarely change:
- Canvas rendering capabilities
- WebGL vendor/renderer
- Audio processing characteristics
- Screen resolution (normalized)
- Browser capabilities
```

## Analytics Capabilities

### **Time-Window Analytics**

Track unique visitors in different time windows:

- **Hourly**: Real-time visitor counts
- **Daily**: Daily unique visitor trends
- **Weekly**: Weekly patterns and growth
- **Monthly**: Long-term visitor retention

### **Visitor Segmentation**

- **New Visitors**: First-time visitors in the time window
- **Returning Visitors**: Previously seen visitors
- **Device Types**: Mobile vs Desktop breakdown
- **Browser Types**: Chrome, Safari, Firefox, etc.
- **Confidence Levels**: How certain we are about visitor identification

### **Behavioral Insights**

- **Average Typing Speed**: Aggregate user typing characteristics
- **Interaction Patterns**: Mouse movement, click rates, scroll behavior
- **Session Duration**: Time spent per visit
- **Activity Patterns**: Most active hours, usage trends

## Database Schema

### **Visitor Record**

```typescript
{
  visitorId: "uuid",
  createdAt: "2025-01-01T00:00:00Z",
  lastSeenAt: "2025-01-01T12:00:00Z",

  // Associated fingerprints (same person, different devices)
  associatedFingerprints: ["hash1", "hash2", "hash3"],
  primaryFingerprintHash: "hash1",

  // Behavioral profile for user distinction
  behavioralSignature: {
    typingWPM: 65,
    typingRhythm: 0.85,
    mouseVelocityAvg: 0.3,
    keyboardLanguage: "en",
    // ... more behavioral metrics
  },

  // Visit statistics
  visitCount: 15,
  totalSessionTime: 3600,
  hourlyVisits: { "2025-01-01-14": 3 },
  dailyVisits: { "2025-01-01": 5 },

  confidenceScore: 0.92
}
```

### **Session Record**

```typescript
{
  sessionId: "uuid",
  visitorId: "visitor-uuid",
  fingerprintHash: "fp-hash",

  startTime: "2025-01-01T14:30:00Z",
  endTime: "2025-01-01T14:45:00Z",
  duration: 900, // seconds

  pageViews: 5,
  interactions: 120,

  // Behavioral data for this specific session
  sessionBehavior: {
    mouseMovements: 450,
    clicks: 23,
    scrollEvents: 67,
    keystrokes: 89,
    averageMouseVelocity: 0.31,
    typingSpeed: 63
  },

  // Privacy-safe context
  userAgent: "Mozilla/5.0...",
  ipAddress: "aGVsbG8=", // hashed
  referrer: "https://google.com",

  timeWindow: {
    hour: "2025-01-01T14",
    day: "2025-01-01"
  }
}
```

## API Endpoints

### **Visitor Tracking**

`POST /fingerprint/collect`

- Processes fingerprint + behavioral data
- Returns visitor ID and confidence score
- Automatically handles visitor identification

## Privacy & Compliance

### **Data Minimization**

- Only stores behavioral patterns, not actual keystrokes
- IP addresses are hashed, not stored in plain text
- No personally identifiable information collected

### **Consent Management**

- Respects user consent preferences
- Configurable data retention periods
- GDPR/CCPA compliant data handling

### **Anonymization**

- Behavioral signatures are mathematical patterns, not raw data
- Fingerprints are hashed, not reversible to device details
- Statistical aggregation prevents individual tracking

## Configuration Options

```typescript
const config = {
  // Similarity thresholds
  behavioralSimilarityThreshold: 0.7, // Same device, different users
  crossDeviceSimilarityThreshold: 0.8, // Same user, different devices

  // Session management
  sessionTimeoutMinutes: 30,
  visitorMergeWindowDays: 7,

  // Quality control
  minimumConfidenceScore: 0.6,
  behavioralStabilityThreshold: 0.7,

  // Privacy
  hashIPAddresses: true,
  retainVisitorDataDays: 90,
  anonymizeBehavioralData: true,
};
```

## Benefits

1. **Accurate Visitor Counting**: Eliminates session/cookie limitations
2. **Cross-Device Recognition**: Same user counted once across all devices
3. **Multi-User Device Support**: Different people on same computer counted separately
4. **Privacy-First**: No personal data collection, mathematical signatures only
5. **Real-time Analytics**: Live visitor counts and behavioral insights
6. **Fraud Detection**: Identifies suspicious patterns and bot behavior

## Limitations

1. **Behavioral Stability Required**: Users with inconsistent behavior may not be recognized
2. **Privacy Mode Impact**: Some fingerprinting reduced in private browsing
3. **False Positives Possible**: Very similar users might be incorrectly merged
4. **Processing Overhead**: More complex than simple session counting
5. **Storage Requirements**: Behavioral signatures require additional database space

This system provides the most accurate unique visitor tracking possible while maintaining user privacy and regulatory compliance.
