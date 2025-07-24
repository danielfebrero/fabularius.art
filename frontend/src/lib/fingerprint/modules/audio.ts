/**
 * Audio fingerprinting module
 * Generates unique fingerprints based on Web Audio API processing capabilities
 */

import { hashData, isBrowser, measureExecutionTime } from "@/lib/fingerprint/utils";
import type { AudioFingerprint } from "@/types/fingerprint";

/**
 * Audio buffer length for fingerprinting
 */
const BUFFER_LENGTH = 44100; // 1 second at 44.1kHz

/**
 * Sample rates to test
 */
const SAMPLE_RATES = [8000, 16000, 22050, 44100, 48000, 88200, 96000, 192000];

/**
 * Audio formats to test
 */
const AUDIO_FORMATS = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/opus",
];

/**
 * Create an OfflineAudioContext
 */
function createOfflineAudioContext(
  sampleRate: number = 44100,
  bufferLength: number = BUFFER_LENGTH
): OfflineAudioContext | null {
  if (!isBrowser()) return null;

  try {
    // Try different constructor patterns for cross-browser compatibility
    if (window.OfflineAudioContext) {
      return new OfflineAudioContext(1, bufferLength, sampleRate);
    } else if ((window as any).webkitOfflineAudioContext) {
      return new (window as any).webkitOfflineAudioContext(
        1,
        bufferLength,
        sampleRate
      );
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create an AudioContext for capability testing
 */
function createAudioContext(): AudioContext | null {
  if (!isBrowser()) return null;

  try {
    if (window.AudioContext) {
      return new AudioContext();
    } else if ((window as any).webkitAudioContext) {
      return new (window as any).webkitAudioContext();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate oscillator fingerprint
 */
async function generateOscillatorFingerprint(
  type: OscillatorType,
  frequency: number = 1000
): Promise<string> {
  const context = createOfflineAudioContext();
  if (!context) return "";

  try {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    gainNode.gain.setValueAtTime(0.1, context.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);
    oscillator.stop(0.1);

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    // Create a hash from a subset of the audio data
    const samples = Array.from(channelData.subarray(0, 1000));
    return hashData(samples.join(","));
  } catch {
    return "";
  }
}

/**
 * Generate compressor fingerprint
 */
async function generateCompressorFingerprint(): Promise<string> {
  const context = createOfflineAudioContext();
  if (!context) return "";

  try {
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    const gainNode = context.createGain();

    // Configure oscillator
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(1000, context.currentTime);

    // Configure compressor with specific settings
    compressor.threshold.setValueAtTime(-24, context.currentTime);
    compressor.knee.setValueAtTime(30, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0.003, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    gainNode.gain.setValueAtTime(0.1, context.currentTime);

    // Connect nodes
    oscillator.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);
    oscillator.stop(0.1);

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    // Calculate compression ratio from the audio data
    const maxAmplitude = Math.max(...Array.from(channelData));
    const avgAmplitude =
      Array.from(channelData).reduce((sum, val) => sum + Math.abs(val), 0) /
      channelData.length;
    const ratio = maxAmplitude / avgAmplitude;

    const samples = Array.from(channelData.subarray(0, 1000));
    return hashData(samples.join(",") + ratio.toString());
  } catch {
    return "";
  }
}

/**
 * Generate dynamics compressor fingerprint
 */
async function generateDynamicsFingerprint(): Promise<string> {
  const context = createOfflineAudioContext();
  if (!context) return "";

  try {
    const oscillator1 = context.createOscillator();
    const oscillator2 = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    const gainNode = context.createGain();

    // Configure oscillators with different frequencies
    oscillator1.type = "sine";
    oscillator1.frequency.setValueAtTime(440, context.currentTime);

    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(660, context.currentTime);

    // Configure compressor for dynamics
    compressor.threshold.setValueAtTime(-12, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(8, context.currentTime);
    compressor.attack.setValueAtTime(0.001, context.currentTime);
    compressor.release.setValueAtTime(0.1, context.currentTime);

    gainNode.gain.setValueAtTime(0.05, context.currentTime);

    // Connect both oscillators to compressor
    oscillator1.connect(compressor);
    oscillator2.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator1.start(0);
    oscillator2.start(0);
    oscillator1.stop(0.1);
    oscillator2.stop(0.1);

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    const samples = Array.from(channelData.subarray(0, 1000));
    return hashData(samples.join(","));
  } catch {
    return "";
  }
}

/**
 * Generate hybrid audio fingerprint with multiple effects
 */
async function generateHybridFingerprint(): Promise<string> {
  const context = createOfflineAudioContext();
  if (!context) return "";

  try {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();
    const delay = context.createDelay();
    const gainNode = context.createGain();

    // Configure oscillator
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(800, context.currentTime);

    // Configure filter
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, context.currentTime);
    filter.Q.setValueAtTime(5, context.currentTime);

    // Configure compressor
    compressor.threshold.setValueAtTime(-18, context.currentTime);
    compressor.knee.setValueAtTime(25, context.currentTime);
    compressor.ratio.setValueAtTime(6, context.currentTime);
    compressor.attack.setValueAtTime(0.002, context.currentTime);
    compressor.release.setValueAtTime(0.15, context.currentTime);

    // Configure delay
    delay.delayTime.setValueAtTime(0.02, context.currentTime);

    gainNode.gain.setValueAtTime(0.1, context.currentTime);

    // Chain effects
    oscillator.connect(filter);
    filter.connect(compressor);
    compressor.connect(delay);
    delay.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);
    oscillator.stop(0.1);

    const buffer = await context.startRendering();
    const channelData = buffer.getChannelData(0);

    const samples = Array.from(channelData.subarray(0, 1000));
    return hashData(samples.join(","));
  } catch {
    return "";
  }
}

/**
 * Calculate compression ratio from audio data
 */
function calculateCompressionRatio(audioData: Float32Array): number {
  try {
    const maxValue = Math.max(...Array.from(audioData));
    const minValue = Math.min(...Array.from(audioData));
    const peak = Math.max(Math.abs(maxValue), Math.abs(minValue));

    const rms = Math.sqrt(
      Array.from(audioData).reduce((sum, sample) => sum + sample * sample, 0) /
        audioData.length
    );

    return peak > 0 && rms > 0 ? peak / rms : 0;
  } catch {
    return 0;
  }
}

/**
 * Test audio capabilities
 */
function getAudioCapabilities(): {
  maxChannels: number;
  sampleRates: number[];
  audioFormats: string[];
} {
  const capabilities = {
    maxChannels: 0,
    sampleRates: [] as number[],
    audioFormats: [] as string[],
  };

  if (!isBrowser()) return capabilities;

  try {
    const context = createAudioContext();
    if (context) {
      capabilities.maxChannels = context.destination.maxChannelCount || 0;
      context.close();
    }

    // Test sample rates
    for (const sampleRate of SAMPLE_RATES) {
      try {
        const testContext = createOfflineAudioContext(sampleRate, 1024);
        if (testContext && testContext.sampleRate === sampleRate) {
          capabilities.sampleRates.push(sampleRate);
        }
      } catch {
        // Sample rate not supported
      }
    }

    // Test audio formats
    const audio = document.createElement("audio");
    for (const format of AUDIO_FORMATS) {
      try {
        const canPlay = audio.canPlayType(format);
        if (canPlay === "probably" || canPlay === "maybe") {
          capabilities.audioFormats.push(format);
        }
      } catch {
        // Format not supported
      }
    }
  } catch {
    // Error testing capabilities
  }

  return capabilities;
}

/**
 * Test audio node support
 */
function getAudioNodeSupport(): Record<string, boolean> {
  const support: Record<string, boolean> = {};

  if (!isBrowser()) return support;

  try {
    const context = createAudioContext();
    if (!context) return support;

    const testNodes = [
      "createOscillator",
      "createGain",
      "createDelay",
      "createBiquadFilter",
      "createDynamicsCompressor",
      "createConvolver",
      "createAnalyser",
      "createScriptProcessor",
      "createStereoPanner",
      "createChannelSplitter",
      "createChannelMerger",
      "createWaveShaper",
      "createPeriodicWave",
    ];

    for (const nodeName of testNodes) {
      try {
        const createMethod = (context as any)[nodeName];
        if (typeof createMethod === "function") {
          const node = createMethod.call(context);
          support[nodeName] = !!node;
        } else {
          support[nodeName] = false;
        }
      } catch {
        support[nodeName] = false;
      }
    }

    context.close();
  } catch {
    // Error testing node support
  }

  return support;
}

/**
 * Main audio fingerprinting function
 */
export async function collectAudioFingerprint(): Promise<AudioFingerprint> {
  const fallbackFingerprint: AudioFingerprint = {
    isSupported: false,
    contextHashes: {
      oscillator: "",
      triangle: "",
      sawtooth: "",
      square: "",
      compressor: "",
      dynamics: "",
      hybrid: "",
    },
    sampleRate: 0,
    bufferSize: 0,
    channelCount: 0,
    compressionRatio: 0,
    processingTimes: {
      oscillator: 0,
      compressor: 0,
      hybrid: 0,
    },
    audioCapabilities: {
      maxChannels: 0,
      sampleRates: [],
      audioFormats: [],
    },
    nodeSupport: {},
    entropy: 0,
  };

  if (!isBrowser()) {
    return fallbackFingerprint;
  }

  try {
    // Check if Web Audio API is supported
    const testContext = createOfflineAudioContext();
    if (!testContext) {
      return fallbackFingerprint;
    }

    // Generate different audio fingerprints with timing
    const [oscillatorResult, triangleResult, sawtoothResult, squareResult] =
      await Promise.all([
        measureExecutionTime(() => generateOscillatorFingerprint("sine")),
        measureExecutionTime(() => generateOscillatorFingerprint("triangle")),
        measureExecutionTime(() => generateOscillatorFingerprint("sawtooth")),
        measureExecutionTime(() => generateOscillatorFingerprint("square")),
      ]);

    const [compressorResult, dynamicsResult, hybridResult] = await Promise.all([
      measureExecutionTime(() => generateCompressorFingerprint()),
      measureExecutionTime(() => generateDynamicsFingerprint()),
      measureExecutionTime(() => generateHybridFingerprint()),
    ]);

    // Calculate compression ratio using a simple test
    let compressionRatio = 0;
    try {
      const testCtx = createOfflineAudioContext();
      if (testCtx) {
        const osc = testCtx.createOscillator();
        const comp = testCtx.createDynamicsCompressor();

        osc.connect(comp);
        comp.connect(testCtx.destination);

        osc.start(0);
        osc.stop(0.01);

        const buffer = await testCtx.startRendering();
        compressionRatio = calculateCompressionRatio(buffer.getChannelData(0));
      }
    } catch {
      // Ignore compression ratio calculation errors
    }

    // Get audio capabilities and node support
    const audioCapabilities = getAudioCapabilities();
    const nodeSupport = getAudioNodeSupport();

    const contextHashes = {
      oscillator: oscillatorResult.result,
      triangle: triangleResult.result,
      sawtooth: sawtoothResult.result,
      square: squareResult.result,
      compressor: compressorResult.result,
      dynamics: dynamicsResult.result,
      hybrid: hybridResult.result,
    };

    const processingTimes = {
      oscillator: oscillatorResult.duration,
      compressor: compressorResult.duration,
      hybrid: hybridResult.duration,
    };

    // Calculate entropy
    const combinedData = JSON.stringify({
      contextHashes,
      processingTimes,
      compressionRatio,
      audioCapabilities,
      nodeSupport,
    });

    const entropy = new Set(combinedData).size / combinedData.length;

    return {
      isSupported: true,
      contextHashes,
      sampleRate: testContext.sampleRate,
      bufferSize: BUFFER_LENGTH,
      channelCount: testContext.destination.channelCount,
      compressionRatio: Math.round(compressionRatio * 1000) / 1000,
      processingTimes,
      audioCapabilities,
      nodeSupport,
      entropy: Math.round(entropy * 1000) / 1000,
    };
  } catch (error) {
    return fallbackFingerprint;
  }
}
