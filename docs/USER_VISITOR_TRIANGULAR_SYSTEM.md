# User-Visitor Many-to-Many Relationship System

## Overview
We've implemented a sophisticated triangular table system that supports complex many-to-many relationships between users and visitors. This system handles two key scenarios:

1. **One person with multiple accounts** (one user → many visitors)
2. **Shared accounts with multiple users** (one visitor → many users)

## Database Design

### Primary Tables

#### 1. User-Visitor Relationships (USER_VISITOR)
```
PK: USER_VISITOR#{userId}
SK: VISITOR#{visitorId}
GSI3PK: USER_VISITOR#{userId}
GSI3SK: VISITOR#{visitorId}
```

#### 2. Visitor-User Relationships (VISITOR_USER)
```
PK: VISITOR_USER#{visitorId}  
SK: USER#{userId}
GSI3PK: VISITOR_USER#{visitorId}
GSI3SK: USER#{userId}
```

### Global Secondary Index (GSI3)
- **Primary Access Pattern**: Query by USER_VISITOR#{userId} or VISITOR_USER#{visitorId}
- **Efficient Querying**: Enables fast lookups in both directions
- **Index Structure**: GSI3PK/GSI3SK supports bidirectional queries

## Key Features

### 1. Automatic Relationship Creation
- When fingerprints are stored, user-visitor relationships are automatically established
- Confidence scores are calculated based on fingerprint matching accuracy
- Timestamps track when relationships are first established and last updated

### 2. Confidence Scoring System
- Relationships maintain confidence scores (0-100)
- Higher confidence indicates stronger association between user and visitor
- Scores are updated when new associations are found
- Queries can filter by minimum confidence thresholds

### 3. Bidirectional Querying
- **Get visitors by user**: `getVisitorsByUserId(userId)`
- **Get users by visitor**: `getUsersByVisitorId(visitorId)`
- **High confidence filtering**: `getHighConfidenceVisitorsByUserId(userId, minConfidence)`
- **Relationship validation**: `isUserVisitorAssociated(userId, visitorId)`

### 4. Bulk Operations
- **Visitor merging**: `bulkUpdateUserVisitorRelationships(oldVisitorId, newVisitorId)`
- **Relationship removal**: `removeUserVisitorRelationship(userId, visitorId)`
- **Detailed metadata**: `getUserVisitorRelationshipsWithDetails(userId)`

## Implementation Details

### Core Methods

#### `createOrUpdateUserVisitorRelationship(userId, visitorId, confidence)`
- Creates bidirectional records (USER_VISITOR and VISITOR_USER)
- Updates confidence scores and timestamps
- Increments association counters

#### `reconcileUserVisitorRelationships(userId, visitorId, confidence)`
- Main reconciliation method called during fingerprint processing
- Handles all the complex logic for relationship management
- Ensures data consistency across the triangular system

#### `storeVisitorFingerprintAssociation(visitorId, fingerprintId, metadata)`
- Enhanced to automatically create user-visitor relationships
- Extracts userId from fingerprint data
- Maintains existing visitor-fingerprint associations

### Data Consistency
- All operations are designed to maintain referential integrity
- Bidirectional records are created/updated atomically
- TTL settings ensure old relationships are cleaned up automatically

## Use Cases

### Scenario 1: One Person, Multiple Accounts
```
User123 → Visitor456 (confidence: 95)
User123 → Visitor789 (confidence: 87)
User123 → Visitor101 (confidence: 92)
```

**Query**: `getVisitorsByUserId("User123")` returns all visitors associated with this user.

### Scenario 2: Shared Account, Multiple Users  
```
Visitor456 → User123 (confidence: 95)
Visitor456 → User124 (confidence: 88)
Visitor456 → User125 (confidence: 91)
```

**Query**: `getUsersByVisitorId("Visitor456")` returns all users who have accessed this visitor session.

### Scenario 3: High Confidence Filtering
```javascript
// Get only high-confidence visitor associations
const highConfidenceVisitors = await FingerprintDB.getHighConfidenceVisitorsByUserId(
  "User123", 
  90 // minimum confidence threshold
);
```

## Integration Points

### 1. Fingerprint Collection
- `collect.ts` automatically extracts userId from requests
- Creates relationships when fingerprints are initially stored
- Updates relationships when existing fingerprints are matched

### 2. Fuzzy Hash Matching
- `fuzzy-hash.ts` includes userId as a stable feature
- LSH buckets consider user-based similarity for improved matching
- Confidence scores flow into relationship strength calculations

### 3. Visitor Reconciliation
- Triangular reconciliation considers user relationships during visitor merging
- Maintains relationship integrity across visitor consolidation operations
- Preserves user associations when visitors are merged

## Performance Considerations

### Efficient Indexing
- GSI3 provides O(log n) lookup performance for both query directions
- Compound keys enable range queries and filtering
- DynamoDB's native scaling handles high-volume relationship data

### Memory Management
- TTL settings prevent indefinite data growth
- Confidence thresholds allow filtering of low-quality relationships
- Batch operations minimize API calls for bulk updates

## Future Enhancements

### Potential Additions
1. **Relationship Analytics**: Track relationship formation patterns
2. **Confidence Decay**: Reduce confidence over time for inactive relationships
3. **Relationship Clustering**: Group related users/visitors for advanced analytics
4. **Privacy Controls**: User-controlled relationship visibility settings
5. **Audit Trails**: Track all relationship changes for compliance

### Monitoring Considerations
1. **Relationship Count Metrics**: Monitor many-to-many relationship growth
2. **Confidence Distribution**: Track confidence score patterns
3. **Query Performance**: Monitor GSI3 query latency and throughput
4. **Data Consistency**: Validate bidirectional relationship integrity

## Summary

This implementation provides a robust foundation for managing complex user-visitor relationships while maintaining high performance and data consistency. The system scales to handle both simple one-to-one relationships and complex many-to-many scenarios that are common in modern web applications with shared devices and multiple account usage patterns.
