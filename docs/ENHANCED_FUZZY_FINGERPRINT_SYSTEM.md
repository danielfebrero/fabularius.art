# Enhanced Fuzzy Fingerprint Types and Stable Features Documentation

## Overview

The Enhanced Fuzzy Fingerprint System uses **Locality-Sensitive Hashing (LSH)** to enable similarity detection between fingerprints that are nearly identical but not exact matches. This system has been significantly enhanced to utilize comprehensive fingerprint data from all available sources.

## FingerprintCollectionRequest Type

The `FingerprintCollectionRequest` interface defines the complete structure of data sent from the client to the fingerprint collection endpoint. This type encompasses all collected fingerprint data and metadata needed for processing.

```typescript
export interface FingerprintCollectionRequest {
  coreFingerprint: CoreFingerprintData;
  advancedFingerprint: AdvancedFingerprintData;
  behavioralData?: BehavioralData;
  sessionId?: string;
  userId?: string; // User identity when authenticated
  pageUrl: string;
  referrer?: string;
  consentGiven: boolean;
  dataProcessingPurpose: string[];
}
```

### Core Components:

#### 1. **CoreFingerprintData**

Contains the most stable and reliable fingerprinting attributes:

- **Canvas**: Multi-layer rendering fingerprint with geometric shapes and text
- **WebGL**: GPU vendor, renderer, extensions, and rendering capabilities
- **Audio**: Audio context fingerprints with oscillator and compression patterns
- **Fonts**: Available system and web fonts with measurement hashes
- **CSS**: Media query support, computed styles, and feature detection
- **Timing**: Performance benchmarks for CPU-intensive operations

#### 2. **AdvancedFingerprintData** (Enhanced)

Contains more detailed but potentially less stable attributes:

- **WebRTC**: Local IPs, NAT traversal, STUN responses, RTC capabilities, ICE gathering
- **Battery**: Level, charging status, timing characteristics, power patterns
- **Media Devices**: Camera/microphone enumeration, permissions, capabilities
- **Sensors**: Accelerometer, gyroscope, magnetometer availability and precision
- **Network**: Connection analysis, bandwidth, timing patterns, geographic inference
- **WebAssembly**: WASM support, SIMD capabilities, instruction timing
- **Storage**: Available storage mechanisms, quotas, API capabilities
- **Plugins**: Browser extensions, plugins, MIME types, ad-blocker detection

#### 3. **BehavioralData** (Optional)

Dynamic user interaction patterns:

- Mouse movements, typing patterns, scroll behavior, touch interactions

## Enhanced StableFeatures System

The stable features extraction system has been significantly enhanced to utilize data from all fingerprinting modules:

### High Stability Features (Rarely Change)

#### **canvas** - `string`

- **Source**: `coreFingerprint.canvas` (truncated to 32 characters)
- **Reasoning**: Hardware-based rendering is highly stable
- **Stability**: Very High - Hardware and driver dependent

#### **webglVendor** - `string`

- **Source**: `coreFingerprint.webgl.vendor`
- **Reasoning**: GPU vendor identification is hardware-based
- **Stability**: Very High - Hardware dependent

#### **webglRenderer** - `string`

- **Source**: `coreFingerprint.webgl.renderer`
- **Reasoning**: Specific GPU model identification
- **Stability**: Very High - Hardware dependent

#### **audioContext** - `string`

- **Source**: `coreFingerprint.audio.contextHash` (truncated to 16 characters)
- **Reasoning**: Audio hardware characteristics are stable
- **Stability**: Very High - Hardware dependent

### Network-Level Features (High Stability)

#### **webrtcLocalIPs** - `string`

- **Source**: Hashed `advancedFingerprint.webrtc.localIPs`
- **Reasoning**: Local network topology is relatively stable
- **Stability**: High - Network configuration dependent
- **Privacy**: IPs are hashed for privacy protection

#### **webrtcNATType** - `string`

- **Source**: `advancedFingerprint.webrtc.natType` and candidate types
- **Reasoning**: NAT configuration reflects network infrastructure
- **Stability**: High - Network infrastructure dependent

#### **webrtcCapabilities** - `string`

- **Source**: `advancedFingerprint.webrtc.rtcCapabilities` (codecs, extensions)
- **Reasoning**: Browser RTC capabilities are version-dependent but stable
- **Stability**: High - Browser version dependent

### Hardware Characteristics (High Stability)

#### **hardwareProfile** - `string`

- **Source**: Combined hardware indicators from core and advanced fingerprints
- **Reasoning**: Physical device characteristics are highly stable
- **Stability**: Very High - Device hardware dependent

#### **batteryCharacteristics** - `string`

- **Source**: `advancedFingerprint.battery` (level, charging, timing)
- **Reasoning**: Battery behavior patterns are device-specific
- **Stability**: High - Device and usage pattern dependent

#### **mediaDeviceSignature** - `string`

- **Source**: `advancedFingerprint.mediaDevices` (counts, permissions)
- **Reasoning**: Available media devices reflect hardware configuration
- **Stability**: High - Hardware dependent

#### **sensorCapabilities** - `string`

- **Source**: `advancedFingerprint.sensors` (accelerometer, gyroscope, etc.)
- **Reasoning**: Device sensor availability is hardware-specific
- **Stability**: High - Hardware dependent

### Platform and Browser Features (Medium-High Stability)

#### **cssCapabilities** - `string`

- **Source**: `coreFingerprint.css` (feature support counts)
- **Reasoning**: CSS capabilities reflect browser version and platform
- **Stability**: Medium-High - Browser version dependent

#### **storageCapabilities** - `string`

- **Source**: `advancedFingerprint.storage` (API availability, quotas)
- **Reasoning**: Storage capabilities are platform and browser dependent
- **Stability**: Medium-High - Platform dependent

#### **pluginSignature** - `string`

- **Source**: `advancedFingerprint.plugins` (counts, capabilities)
- **Reasoning**: Plugin ecosystem reflects user environment
- **Stability**: Medium - User installation dependent

#### **timingProfile** - `string`

- **Source**: `coreFingerprint.timing` (normalized performance metrics)
- **Reasoning**: Performance characteristics reflect hardware capabilities
- **Stability**: Medium-High - Hardware dependent but can vary with load

### Network and Environmental Features (Medium Stability)

#### **networkTiming** - `string`

- **Source**: `advancedFingerprint.network` (RTT, bandwidth, characteristics)
- **Reasoning**: Network performance characteristics are relatively stable
- **Stability**: Medium - Network conditions dependent

#### **screenResolution** - `string`

- **Source**: Processed from screen data (rounded to nearest 100px)
- **Reasoning**: Monitor resolution changes less frequently
- **Stability**: Medium - Monitor setup dependent

#### **timezone** - `string`

- **Source**: System timezone information
- **Reasoning**: Geographic location indicator, stable unless user relocates
- **Stability**: Medium - Geographic stability

#### **language** - `string`

- **Source**: Primary language preference (language code only)
- **Reasoning**: Primary language preference is more stable than locale variants
- **Stability**: Medium - User preference dependent

### Traditional Browser Features (Medium Stability)

#### **webglExtensions** - `string`

- **Source**: Normalized hash of `coreFingerprint.webgl.extensions`
- **Reasoning**: Available WebGL extensions are driver/hardware dependent
- **Stability**: Medium-High - Hardware/driver dependent

#### **fontSample** - `string`

- **Source**: Hash of common system fonts from `coreFingerprint.fonts`
- **Reasoning**: System fonts change less frequently than web fonts
- **Stability**: Medium - OS and software installation dependent

#### **userAgent** - `string`

- **Source**: Processed browser/device indicators
- **Reasoning**: Device type and browser family are more stable than versions
- **Stability**: Medium - Updates with browser/OS changes

### User Identity (Highest Stability)

#### **userId** - `string`

- **Source**: `userId` from request when user is authenticated
- **Reasoning**: Direct user identification when available
- **Stability**: Highest - User identity is definitive when authenticated

## Enhanced LSH Bucket Configurations

The system now uses 15 carefully designed LSH buckets that combine features based on stability, entropy, and correlation patterns:

### Primary Buckets (Highest Weight)

1. **coreHardware** (Weight: 1.0, Entropy: 0.95)

   - Features: canvas, webglVendor, webglRenderer, audioContext
   - Purpose: Core hardware identification

2. **webrtcNetworkProfile** (Weight: 0.95, Entropy: 0.92)

   - Features: webrtcLocalIPs, webrtcNATType, webrtcCapabilities, networkTiming
   - Purpose: Network topology and capabilities

3. **userProfile** (Weight: 1.0, Entropy: 0.98)

   - Features: userId, timezone, language, screenResolution
   - Purpose: User identification when authenticated

4. **userDevice** (Weight: 1.0, Entropy: 0.99)
   - Features: userId, hardwareProfile, webrtcLocalIPs, networkTiming
   - Purpose: Complete user-device association

### Hardware and Capability Buckets

5. **hardwareCapabilities** (Weight: 0.9, Entropy: 0.88)

   - Features: hardwareProfile, mediaDeviceSignature, sensorCapabilities, batteryCharacteristics
   - Purpose: Physical device characteristics

6. **webglCapabilities** (Weight: 0.95, Entropy: 0.9)

   - Features: webglVendor, webglRenderer, webglExtensions, timingProfile
   - Purpose: GPU and rendering capabilities

7. **comprehensiveDevice** (Weight: 0.95, Entropy: 0.93)
   - Features: canvas, webrtcLocalIPs, hardwareProfile, pluginSignature, networkTiming
   - Purpose: Multi-dimensional device signature

### Platform and Browser Buckets

8. **browserPlatform** (Weight: 0.85, Entropy: 0.85)

   - Features: cssCapabilities, storageCapabilities, pluginSignature, timingProfile
   - Purpose: Browser and platform identification

9. **browserFingerprint** (Weight: 0.75, Entropy: 0.78)
   - Features: fontSample, cssCapabilities, pluginSignature, storageCapabilities
   - Purpose: Browser-specific feature combination

### Network and Environment Buckets

10. **networkDevice** (Weight: 0.9, Entropy: 0.87)

    - Features: webrtcLocalIPs, networkTiming, batteryCharacteristics, mediaDeviceSignature
    - Purpose: Network-device correlation

11. **networkHardware** (Weight: 0.88, Entropy: 0.84)

    - Features: webrtcCapabilities, webrtcNATType, hardwareProfile, cssCapabilities
    - Purpose: Network capabilities and hardware

12. **deviceEnvironment** (Weight: 0.8, Entropy: 0.75)
    - Features: screenResolution, timezone, language, sensorCapabilities
    - Purpose: Environmental context

### Specialized Buckets

13. **audioVisualProfile** (Weight: 0.85, Entropy: 0.83)

    - Features: canvas, audioContext, mediaDeviceSignature, hardwareProfile
    - Purpose: Multimedia capabilities

14. **deviceCharacteristics** (Weight: 0.82, Entropy: 0.81)

    - Features: batteryCharacteristics, sensorCapabilities, mediaDeviceSignature, timingProfile
    - Purpose: Physical device behavior

15. **platformStability** (Weight: 0.7, Entropy: 0.72)
    - Features: webglVendor, userAgent, sensorCapabilities, storageCapabilities
    - Purpose: Platform stability indicators

## Similarity Calculation

The enhanced similarity calculation uses entropy-weighted matching with the following improvements:

- **Weighted Matching**: Each bucket match is weighted by both bucket weight and entropy
- **Signal Quality**: Higher entropy matches receive more weight
- **Confidence Scoring**: Factors in signal count, quality, and consistency
- **Collision Probability**: Each bucket has an estimated collision probability for fine-tuning

### Calculation Formula

```
similarity = Σ(matched_buckets * weight * entropy) / Σ(total_weight)
confidence = similarity * signal_bonus * entropy_bonus + consistency_bonus
```

Where:

- `signal_bonus` = min(matching_signals / total_buckets, 1.0)
- `entropy_bonus` = average entropy of matching signals
- `consistency_bonus` = 0.1 if >= 3 signals match, 0 otherwise

## Privacy Considerations

- **Local IP Hashing**: Local IP addresses are hashed before storage for privacy
- **Device ID Protection**: Device identifiers use cryptographic hashing
- **Battery Quantization**: Battery levels are quantized to reduce precision
- **Media Device Privacy**: Media device labels are excluded from signatures
- **Timing Normalization**: All timing values are normalized/rounded to reduce fingerprinting precision

## Performance Characteristics

- **15 LSH buckets** provide comprehensive coverage across all fingerprint dimensions
- **Entropy-weighted similarity** improves accuracy by prioritizing high-quality signals
- **Privacy-preserving hashing** protects sensitive data while maintaining uniqueness
- **Configurable thresholds** allow adaptation to different security/privacy requirements
- **Collision probability estimation** enables continuous bucket optimization

## Implementation Benefits

### Enhanced Accuracy

- Utilizes all available fingerprint data sources
- Weighted matching based on feature stability and entropy
- Multi-dimensional device and network characterization

### Improved Privacy

- Cryptographic hashing of sensitive identifiers
- Quantization of precise measurements
- Exclusion of personally identifiable information

### Better Performance

- Optimized bucket configurations based on real-world entropy measurements
- Reduced false positives through comprehensive signal analysis
- Configurable similarity thresholds for different use cases

### Future Extensibility

- Modular feature extraction system
- Easy addition of new fingerprinting dimensions
- Adaptable to emerging browser technologies

This enhanced fuzzy fingerprint system provides significantly improved accuracy while maintaining strong privacy protections and good performance characteristics.
