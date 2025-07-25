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
