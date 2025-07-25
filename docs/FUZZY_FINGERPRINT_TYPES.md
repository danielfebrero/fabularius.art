# Fuzzy Fingerprint Types and Stable Features Documentation

## FingerprintCollectionRequest Type

The `FingerprintCollectionRequest` interface defines the complete structure of data sent from the client to the fingerprint collection endpoint. This type encompasses all collected fingerprint data and metadata needed for processing.

```typescript
export interface FingerprintCollectionRequest {
  coreFingerprint: CoreFingerprintData;
  advancedFingerprint: AdvancedFingerprintData;
  behavioralData?: BehavioralData;
  sessionId?: string;
  pageUrl: string;
  referrer?: string;
  consentGiven: boolean;
  dataProcessingPurpose: string[];
}
```

### Core Components:

#### 1. **CoreFingerprintData**

Contains the most fundamental and stable fingerprinting attributes:

- **Canvas fingerprinting**: Hardware-level graphics rendering signatures
- **WebGL fingerprinting**: GPU vendor, renderer, extensions, and parameters
- **Audio fingerprinting**: Audio context, compression, and oscillator signatures
- **Font fingerprinting**: Available system and web fonts with measurements
- **CSS fingerprinting**: Media queries, computed styles, and supported features
- **Timing fingerprinting**: Performance characteristics of cryptographic, regex, and sorting operations

#### 2. **AdvancedFingerprintData**

Contains more detailed but potentially less stable attributes:

- **WebRTC**: Local IPs, STUN responses, RTC capabilities
- **Battery**: Level, charging status, timing characteristics
- **Media Devices**: Camera/microphone enumeration and permissions
- **Sensors**: Accelerometer, gyroscope, magnetometer availability and precision
- **Network**: Connection analysis, bandwidth, timing patterns
- **WebAssembly**: WASM support and instruction timing
- **Storage**: Available storage mechanisms and quotas
- **Plugins**: Browser extensions, plugins, MIME types

#### 3. **BehavioralData** (Optional)

Dynamic user interaction patterns:

- Mouse movements, typing patterns, scroll behavior, touch interactions

## StableFeatures Reasoning

The `StableFeatures` interface in the fuzzy hash system extracts the most persistent attributes from fingerprint data for similarity detection. Each feature is chosen based on stability criteria:

### High Stability Features (Rarely Change)

#### **canvas** - `string`

- **Source**: `coreFingerprint.canvas` (truncated to 32 chars)
- **Reasoning**: Canvas rendering is determined by hardware (GPU, drivers) and rarely changes unless hardware is upgraded
- **Stability**: Very High - Hardware-dependent

#### **webglVendor** - `string`

- **Source**: `coreFingerprint.webgl.vendor`
- **Reasoning**: GPU vendor (NVIDIA, AMD, Intel) is hardware-based and extremely stable
- **Stability**: Very High - Hardware identifier

#### **webglRenderer** - `string`

- **Source**: `coreFingerprint.webgl.renderer`
- **Reasoning**: Specific GPU model identification, stable unless hardware changes
- **Stability**: Very High - Hardware identifier

#### **audioContext** - `string`

- **Source**: `coreFingerprint.audio.contextHash` (truncated to 16 chars)
- **Reasoning**: Audio hardware characteristics are stable and hardware-dependent
- **Stability**: High - Audio hardware signature

### Medium Stability Features

#### **screenResolution** - `string`

- **Source**: Processed from `coreFingerprint.screen` (rounded to nearest 100px)
- **Reasoning**: Monitor resolution changes less frequently, rounded for fuzzy matching
- **Stability**: Medium - Can change with monitor setup

#### **timezone** - `string`

- **Source**: `coreFingerprint.screen.timezone`
- **Reasoning**: Geographic location indicator, stable unless user relocates
- **Stability**: Medium - Geographic stability

#### **language** - `string`

- **Source**: `coreFingerprint.screen.language` (language code only, no region)
- **Reasoning**: Primary language preference, more stable than locale-specific variants
- **Stability**: Medium - User preference

### Low Volatility Browser Features

#### **webglExtensions** - `string`

- **Source**: Normalized hash of `coreFingerprint.webgl.extensions`
- **Reasoning**: Available WebGL extensions are driver/hardware dependent
- **Stability**: Medium-High - Hardware/driver dependent

#### **fontSample** - `string`

- **Source**: Hash of common system fonts from `coreFingerprint.fonts`
- **Reasoning**: System fonts change less frequently than web fonts
- **Stability**: Medium - OS and software installation dependent

#### **userAgent** - `string`

- **Source**: Processed browser/device indicators from `advancedFingerprint.userAgent`
- **Reasoning**: Device type and browser family are more stable than specific versions
- **Stability**: Medium - Updates with browser/OS changes

## Suggested New Stable Features

Based on the comprehensive `FingerprintCollectionRequest` structure, here are additional stable features that could enhance fuzzy matching:

### Hardware-Level Features (Very High Stability)

1. **webglParameters** - Hash of key WebGL parameters

   - Source: `coreFingerprint.webgl.parameters`
   - Reasoning: Hardware-specific WebGL parameters are very stable

2. **audioCompressionSignature** - Audio compression characteristics
   - Source: `coreFingerprint.audio.compressionRatio + dynamicsHash`
   - Reasoning: Audio hardware compression behavior is device-specific

### Network Infrastructure Features (High Stability)

3. **networkProvider** - ISP and organization fingerprint

   - Source: `serverEnhancement.ipGeolocation.isp + org`
   - Reasoning: ISP/organization changes less frequently than IP addresses

4. **networkASN** - Autonomous System Number

   - Source: `serverEnhancement.ipGeolocation.asn`
   - Reasoning: ASN identifies network infrastructure, very stable

5. **connectionTypeProfile** - Network connection characteristics
   - Source: `advancedFingerprint.network.connection.type + effectiveType`
   - Reasoning: Connection type (WiFi, cellular, ethernet) relatively stable

### Device Architecture Features (High Stability)

6. **wasmCapabilities** - WebAssembly instruction support

   - Source: `advancedFingerprint.webassembly.simdSupported + threadsSupported + bulkMemorySupported`
   - Reasoning: CPU architecture capabilities are hardware-level stable

7. **storageArchitecture** - Available storage mechanisms

   - Source: Hash of supported storage types from `advancedFingerprint.storage`
   - Reasoning: Storage API support is browser/platform dependent, changes slowly

8. **mediaCapabilities** - Device media hardware profile
   - Source: `advancedFingerprint.mediaDevices` (device counts, not labels)
   - Reasoning: Number of cameras/microphones is hardware-dependent

### Geographic/Environmental Features (Medium-High Stability)

9. **timezoneRegion** - Broader timezone classification

   - Source: `serverEnhancement.ipGeolocation.timezone` (region-level grouping)
   - Reasoning: Regional timezone more stable than exact timezone

10. **geographicCluster** - Approximate geographic region
    - Source: `serverEnhancement.ipGeolocation.country + region` (hashed)
    - Reasoning: Geographic region is more stable than city-level location

### Browser/Platform Features (Medium Stability)

11. **platformCapabilities** - Core platform support

    - Source: Combined sensor availability from `advancedFingerprint.sensors`
    - Reasoning: Device sensor capabilities are platform/hardware dependent

12. **tlsProfile** - TLS fingerprint characteristics
    - Source: `serverEnhancement.tlsFingerprint.cipherSuite + tlsVersion`
    - Reasoning: TLS capabilities reflect browser and system security features

### Performance Characteristics (Medium Stability)

13. **computeProfile** - Relative performance characteristics

    - Source: Normalized timing ratios from `coreFingerprint.timing`
    - Reasoning: Relative performance ratios more stable than absolute values

14. **networkLatencyProfile** - Network performance tier
    - Source: Bucketed values from `advancedFingerprint.network.analysis`
    - Reasoning: Network performance characteristics indicate infrastructure quality

### Implementation Considerations

These suggested features would provide:

- **Enhanced similarity detection** across hardware upgrades (same device family)
- **Geographic correlation** for users who travel or use VPNs
- **Platform consistency** detection across browser updates
- **Infrastructure stability** for users on consistent networks
- **Performance profiling** for similar device classes

Each feature should be carefully weighted based on stability vs. uniqueness trade-offs, with hardware-level features receiving higher weights in similarity calculations.

## LSH Bucket Configurations

The Locality-Sensitive Hashing (LSH) system uses predefined bucket configurations to create multiple hash signatures for each fingerprint. This multi-bucket approach enables similarity detection across different stability profiles and use cases.

### Bucket Configuration Structure

```typescript
interface LSHBucketConfig {
  name: string;
  features: FeatureName[];
}
```

### Predefined LSH_BUCKET_CONFIGS

#### 1. **coreHardware** - Hardware-Level Signature

```typescript
{
  name: 'coreHardware',
  features: ['canvas', 'webglVendor', 'webglRenderer', 'audioContext']
}
```

- **Purpose**: Detect same physical device across browsers/sessions
- **Stability**: Very High - Hardware characteristics rarely change
- **Use Cases**: Device recognition, hardware fingerprinting
- **Match Scenarios**: Same computer with different browsers, OS updates

#### 2. **deviceEnvironment** - Environmental Context

```typescript
{
  name: 'deviceEnvironment',
  features: ['screenResolution', 'timezone', 'language', 'webglVendor']
}
```

- **Purpose**: Identify devices in consistent environments
- **Stability**: High - Environmental settings change infrequently
- **Use Cases**: Geographic correlation, device setup consistency
- **Match Scenarios**: Same device in same location/configuration

#### 3. **browserCapabilities** - Browser-Specific Features

```typescript
{
  name: 'browserCapabilities',
  features: ['canvas', 'webglExtensions', 'fontSample']
}
```

- **Purpose**: Browser and platform capability profiling
- **Stability**: Medium-High - Browser features evolve slowly
- **Use Cases**: Browser family detection, capability-based grouping
- **Match Scenarios**: Same browser family across versions

#### 4. **mixedStability** - Balanced Profile

```typescript
{
  name: 'mixedStability',
  features: ['webglRenderer', 'audioContext', 'screenResolution', 'userAgent']
}
```

- **Purpose**: Balanced approach combining stable and semi-stable features
- **Stability**: Medium - Mix of hardware and software characteristics
- **Use Cases**: General-purpose similarity detection
- **Match Scenarios**: Similar devices with software variations

#### 5. **displayAudio** - Media Hardware Profile

```typescript
{
  name: 'displayAudio',
  features: ['canvas', 'audioContext', 'screenResolution']
}
```

- **Purpose**: Media hardware capability signature
- **Stability**: High - Display and audio hardware stable
- **Use Cases**: Media device categorization, hardware clustering
- **Match Scenarios**: Devices with similar media capabilities

#### 6. **webglProfile** - Graphics Hardware Signature

```typescript
{
  name: 'webglProfile',
  features: ['webglVendor', 'webglRenderer', 'webglExtensions']
}
```

- **Purpose**: Comprehensive GPU and graphics driver fingerprinting
- **Stability**: Very High - Graphics hardware characteristics very stable
- **Use Cases**: GPU-based device identification, graphics capability matching
- **Match Scenarios**: Same graphics hardware across driver updates

#### 7. **userProfile** - User-Centric Identity

```typescript
{
  name: 'userProfile',
  features: ['userId', 'timezone', 'language', 'screenResolution']
}
```

- **Purpose**: User identity correlation across devices/sessions
- **Stability**: Very High - User identity and preferences stable
- **Use Cases**: Cross-device user tracking, authenticated user correlation
- **Match Scenarios**: Same user on different devices, user device migration

#### 8. **userDevice** - User-Device Association

```typescript
{
  name: 'userDevice',
  features: ['userId', 'webglVendor', 'webglRenderer', 'canvas']
}
```

- **Purpose**: Strong user-device binding with hardware correlation
- **Stability**: Very High - Combines user identity with hardware stability
- **Use Cases**: Authenticated user device recognition, account security
- **Match Scenarios**: Verified user on known device hardware

### LSH Bucket Strategy

#### Multi-Bucket Similarity Detection

Each fingerprint generates 8 different hash buckets, enabling:

1. **Granular Matching**: Different similarity thresholds for different use cases
2. **Fallback Detection**: If high-stability buckets don't match, lower-stability buckets might
3. **Confidence Scoring**: More bucket matches = higher confidence similarity
4. **Use Case Optimization**: Different buckets optimized for different scenarios

#### Bucket Weighting Strategy

```typescript
// Example similarity calculation with bucket weights
const bucketWeights = {
  userDevice: 1.0, // Highest confidence when user + hardware match
  userProfile: 0.9, // High confidence for user correlation
  coreHardware: 0.8, // High confidence for hardware matching
  webglProfile: 0.7, // Graphics hardware stability
  deviceEnvironment: 0.6, // Environmental consistency
  displayAudio: 0.5, // Media hardware correlation
  browserCapabilities: 0.4, // Browser feature matching
  mixedStability: 0.3, // General-purpose fallback
};
```

#### Bucket Evolution Strategy

The LSH bucket system allows for:

- **Feature Addition**: New stable features can be added to existing buckets
- **Bucket Refinement**: Configurations can be tuned based on real-world performance
- **Specialized Buckets**: New buckets for specific use cases (e.g., mobile-only, enterprise-only)
- **Deprecation Handling**: Old bucket configurations can be phased out gradually

### Performance Characteristics

#### Memory Efficiency

- Each fingerprint stores 8 compact hash strings (16 characters each)
- Total storage: ~128 bytes per fingerprint for all LSH buckets
- Index-friendly: Short hash strings enable efficient database indexing

#### Query Performance

- **Exact bucket matching**: O(1) hash table lookups
- **Multi-bucket similarity**: O(k) where k = number of buckets (8)
- **Batch processing**: Multiple fingerprints can be processed in parallel

#### Scalability Considerations

- Hash collision probability: ~1/16^16 per bucket (effectively zero)
- Bucket independence: Each bucket can be processed separately
- Horizontal scaling: Different buckets can be stored/queried on different nodes

### Future Enhancements

#### Adaptive Buckets

- **Machine Learning**: Bucket configurations optimized based on matching success rates
- **Dynamic Weighting**: Bucket weights adjusted based on real-world performance
- **Contextual Buckets**: Different bucket sets for different user segments

#### Specialized Configurations

- **Mobile-Optimized**: Buckets designed specifically for mobile device characteristics
- **Enterprise-Focused**: Buckets for corporate environment detection
- **Privacy-Enhanced**: Buckets that maximize utility while minimizing identifying information

#### Advanced Similarity

- **Fuzzy Bucket Matching**: Partial bucket matches for damaged/corrupted fingerprints
- **Temporal Buckets**: Time-aware buckets that account for feature evolution
- **Behavioral Integration**: Buckets that incorporate behavioral patterns

This LSH bucket system provides a sophisticated foundation for fingerprint similarity detection while maintaining flexibility for future enhancements and specialized use cases.
