/**
 * Timing fingerprinting module
 * CPU and WebAssembly performance fingerprinting through timing attacks
 */

import { safeFeatureDetect, isBrowser, measureExecutionTime } from "@/lib/fingerprint/utils";
import type { TimingFingerprint } from "@/types/fingerprint";

/**
 * Crypto operations for timing analysis
 */
const CRYPTO_OPERATIONS = [
  "getRandomValues",
  "subtle.digest",
  "subtle.encrypt",
  "subtle.decrypt",
  "subtle.sign",
  "subtle.verify",
] as const;

/**
 * Math operations for CPU benchmarking
 */
const MATH_OPERATIONS = [
  "sqrt",
  "sin",
  "cos",
  "tan",
  "log",
  "exp",
  "pow",
  "floor",
  "ceil",
  "round",
] as const;

/**
 * Array operations for memory performance testing
 */
const ARRAY_OPERATIONS = [
  "sort",
  "reverse",
  "map",
  "filter",
  "reduce",
  "forEach",
  "find",
  "splice",
] as const;

/**
 * String operations for text processing performance
 */
const STRING_OPERATIONS = [
  "charAt",
  "indexOf",
  "substring",
  "replace",
  "split",
  "match",
  "search",
] as const;

/**
 * Regex operations for pattern matching performance
 */
const REGEX_PATTERNS = [
  /[a-z]+/g,
  /\d{3}-\d{3}-\d{4}/g,
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/,
  /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-5]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
] as const;

/**
 * Sorting algorithms for CPU performance testing
 */
const SORTING_ALGORITHMS = [
  "bubbleSort",
  "quickSort",
  "mergeSort",
  "insertionSort",
  "selectionSort",
] as const;

/**
 * WebAssembly test module source
 */
const WASM_MODULE_SOURCE = `
(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (func $fibonacci (param $n i32) (result i32)
    local.get $n
    i32.const 2
    i32.lt_s
    if (result i32)
      local.get $n
    else
      local.get $n
      i32.const 1
      i32.sub
      call $fibonacci
      local.get $n
      i32.const 2
      i32.sub
      call $fibonacci
      i32.add
    end)
  (func $matrix_multiply (param $size i32) (result i32)
    (local $i i32) (local $j i32) (local $k i32) (local $sum i32)
    loop $outer
      local.get $i
      local.get $size
      i32.lt_s
      if
        i32.const 0
        local.set $j
        loop $inner
          local.get $j
          local.get $size
          i32.lt_s
          if
            i32.const 0
            local.set $k
            i32.const 0
            local.set $sum
            loop $inner2
              local.get $k
              local.get $size
              i32.lt_s
              if
                local.get $sum
                local.get $k
                local.get $k
                i32.mul
                i32.add
                local.set $sum
                local.get $k
                i32.const 1
                i32.add
                local.set $k
                br $inner2
              end
            end
            local.get $j
            i32.const 1
            i32.add
            local.set $j
            br $inner
          end
        end
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $outer
      end
    end
    local.get $sum)
  (export "add" (func $add))
  (export "fibonacci" (func $fibonacci))
  (export "matrix_multiply" (func $matrix_multiply))
  (memory $mem 1)
  (export "memory" (memory $mem)))
`;

/**
 * Get high-precision timestamp
 */
function getHighPrecisionTime(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/**
 * Measure clock resolution
 */
function measureClockResolution(): number {
  const samples = 1000;
  let minDelta = Infinity;

  for (let i = 0; i < samples; i++) {
    const start = getHighPrecisionTime();
    let current = start;

    while (current === start) {
      current = getHighPrecisionTime();
    }

    const delta = current - start;
    if (delta > 0 && delta < minDelta) {
      minDelta = delta;
    }
  }

  return minDelta === Infinity ? 1 : minDelta;
}

/**
 * Test performance API precision
 */
function testPerformanceApiPrecision(): number {
  if (!isBrowser() || typeof performance === "undefined" || !performance.now) {
    return 1;
  }

  const measurements: number[] = [];
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    // Minimal operation
    Math.random();
    const end = performance.now();
    measurements.push(end - start);
  }

  // Calculate precision based on smallest non-zero measurement
  const nonZero = measurements.filter((m) => m > 0);
  return nonZero.length > 0 ? Math.min(...nonZero) : 1;
}

/**
 * Benchmark crypto operations
 */
async function benchmarkCryptoOperations(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  if (!isBrowser() || !window.crypto) {
    return results;
  }

  try {
    // Random values generation
    const randomResult = await measureExecutionTime(() => {
      const array = new Uint32Array(1000);
      window.crypto.getRandomValues(array);
      return array;
    });
    results["getRandomValues"] = randomResult.duration;

    // Subtle crypto operations
    if (window.crypto.subtle) {
      try {
        // Hash operation
        const hashResult = await measureExecutionTime(async () => {
          const data = new TextEncoder().encode("test data for hashing");
          return await window.crypto.subtle.digest("SHA-256", data);
        });
        results["subtle.digest"] = hashResult.duration;

        // Key generation and encryption
        const encryptResult = await measureExecutionTime(async () => {
          const key = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
          );
          const data = new TextEncoder().encode("test encryption data");
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          return await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            data
          );
        });
        results["subtle.encrypt"] = encryptResult.duration;
      } catch {
        // Crypto operations may fail in some environments
      }
    }
  } catch {
    // Crypto API not available or restricted
  }

  return results;
}

/**
 * Benchmark math operations
 */
async function benchmarkMathOperations(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const iterations = 10000;

  for (const operation of MATH_OPERATIONS) {
    const result = await measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        const value = i / 100;
        switch (operation) {
          case "sqrt":
            Math.sqrt(value);
            break;
          case "sin":
            Math.sin(value);
            break;
          case "cos":
            Math.cos(value);
            break;
          case "tan":
            Math.tan(value);
            break;
          case "log":
            Math.log(value + 1);
            break;
          case "exp":
            Math.exp(value);
            break;
          case "pow":
            Math.pow(value, 2);
            break;
          case "floor":
            Math.floor(value);
            break;
          case "ceil":
            Math.ceil(value);
            break;
          case "round":
            Math.round(value);
            break;
        }
      }
    });
    results[operation] = result.duration;
  }

  return results;
}

/**
 * Benchmark array operations
 */
async function benchmarkArrayOperations(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const size = 1000;

  for (const operation of ARRAY_OPERATIONS) {
    const result = await measureExecutionTime(() => {
      const arr = Array.from({ length: size }, (_, i) => i);

      switch (operation) {
        case "sort":
          arr.sort((a, b) => b - a);
          break;
        case "reverse":
          arr.reverse();
          break;
        case "map":
          arr.map((x) => x * 2);
          break;
        case "filter":
          arr.filter((x) => x % 2 === 0);
          break;
        case "reduce":
          arr.reduce((sum, x) => sum + x, 0);
          break;
        case "forEach":
          arr.forEach((x) => x * 2);
          break;
        case "find":
          arr.find((x) => x === 500);
          break;
        case "splice":
          arr.splice(100, 10);
          break;
      }
    });
    results[operation] = result.duration;
  }

  return results;
}

/**
 * Benchmark string operations
 */
async function benchmarkStringOperations(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const testString = "The quick brown fox jumps over the lazy dog. ".repeat(
    100
  );
  const iterations = 1000;

  for (const operation of STRING_OPERATIONS) {
    const result = await measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        switch (operation) {
          case "charAt":
            testString.charAt(i % testString.length);
            break;
          case "indexOf":
            testString.indexOf("fox");
            break;
          case "substring":
            testString.substring(0, 100);
            break;
          case "replace":
            testString.replace("fox", "cat");
            break;
          case "split":
            testString.split(" ");
            break;
          case "match":
            testString.match(/\w+/g);
            break;
          case "search":
            testString.search(/brown/);
            break;
        }
      }
    });
    results[operation] = result.duration;
  }

  return results;
}

/**
 * Benchmark regex operations
 */
async function benchmarkRegexOperations(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const testStrings = [
    "hello world test string",
    "Contact: john.doe@example.com for info",
    "Server IP: 192.168.1.1 is online",
    "Visit https://www.example.com/path?query=value",
    "Phone: 555-123-4567, Email: user@domain.org",
  ];

  for (let index = 0; index < REGEX_PATTERNS.length; index++) {
    const pattern = REGEX_PATTERNS[index];
    const result = await measureExecutionTime(() => {
      const testString = testStrings[index % testStrings.length];
      for (let i = 0; i < 1000; i++) {
        pattern.test(testString);
      }
    });
    results[`pattern_${index}`] = result.duration;
  }

  return results;
}

/**
 * Implement sorting algorithms for benchmarking
 */
function bubbleSort(arr: number[]): void {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}

function quickSort(
  arr: number[],
  low: number = 0,
  high: number = arr.length - 1
): void {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

function insertionSort(arr: number[]): void {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}

function selectionSort(arr: number[]): void {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
}

/**
 * Benchmark sorting algorithms
 */
async function benchmarkSortingAlgorithms(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const size = 1000;

  for (const algorithm of SORTING_ALGORITHMS) {
    const result = await measureExecutionTime(() => {
      const arr = Array.from({ length: size }, () =>
        Math.floor(Math.random() * 1000)
      );

      switch (algorithm) {
        case "bubbleSort":
          bubbleSort([...arr]);
          break;
        case "quickSort":
          quickSort([...arr]);
          break;
        case "mergeSort":
          mergeSort([...arr]);
          break;
        case "insertionSort":
          insertionSort([...arr]);
          break;
        case "selectionSort":
          selectionSort([...arr]);
          break;
      }
    });
    results[algorithm] = result.duration;
  }

  return results;
}

/**
 * Test WebAssembly support and performance
 */
async function testWebAssembly(): Promise<TimingFingerprint["wasmTimings"]> {
  const fallback: TimingFingerprint["wasmTimings"] = {
    isSupported: false,
    compilationTime: 0,
    instantiationTime: 0,
    executionTimings: {},
    memoryOperations: {},
  };

  if (!isBrowser() || typeof WebAssembly === "undefined") {
    return fallback;
  }

  try {
    // Convert WAT to binary
    const wasmBytes = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60,
      0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01,
      0x03, 0x61, 0x64, 0x64, 0x00, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0x20,
      0x00, 0x20, 0x01, 0x6a, 0x0b,
    ]);

    // Measure compilation time
    const compilationResult = await measureExecutionTime(async () => {
      return await WebAssembly.compile(wasmBytes);
    });

    // Measure instantiation time
    const instantiationResult = await measureExecutionTime(async () => {
      return await WebAssembly.instantiate(compilationResult.result);
    });

    const instance = instantiationResult.result;
    const exports = instance.exports as any;

    // Measure execution timings
    const executionTimings: Record<string, number> = {};

    if (exports.add) {
      const addResult = await measureExecutionTime(() => {
        for (let i = 0; i < 10000; i++) {
          exports.add(i, i + 1);
        }
      });
      executionTimings["add"] = addResult.duration;
    }

    // Memory operations
    const memoryOperations: Record<string, number> = {};

    if (exports.memory) {
      const memResult = await measureExecutionTime(() => {
        const memory = new Uint8Array(exports.memory.buffer);
        for (let i = 0; i < 1000; i++) {
          memory[i] = i % 256;
        }
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += memory[i];
        }
        return sum;
      });
      memoryOperations["readWrite"] = memResult.duration;
    }

    return {
      isSupported: true,
      compilationTime: compilationResult.duration,
      instantiationTime: instantiationResult.duration,
      executionTimings,
      memoryOperations,
    };
  } catch {
    return fallback;
  }
}

/**
 * Benchmark CPU operations
 */
async function benchmarkCPU(): Promise<TimingFingerprint["cpuBenchmarks"]> {
  const singleThread = await measureExecutionTime(() => {
    // CPU-intensive single-threaded operation
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    return result;
  });

  // Worker thread benchmark (if supported)
  const workerThread: Record<string, number> = {};
  const concurrency: Record<string, number> = {};

  if (typeof Worker !== "undefined") {
    // Worker support detected, but no production worker fingerprinting implemented.
    // Future: Move timing-sensitive benchmarks to a separate worker file for higher entropy.
    // For now, skip placeholder to avoid demo/incorrect entropy.
  }

  // Concurrency test using Promise.all
  const concurrencyResult = await measureExecutionTime(async () => {
    const promises = Array.from({ length: 4 }, () =>
      Promise.resolve().then(() => {
        let result = 0;
        for (let i = 0; i < 25000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      })
    );
    return await Promise.all(promises);
  });

  return {
    singleThread: { computation: singleThread.duration },
    workerThread,
    concurrency: { parallel: concurrencyResult.duration },
  };
}

/**
 * Benchmark memory operations
 */
async function benchmarkMemory(): Promise<TimingFingerprint["memoryTimings"]> {
  const allocation = await measureExecutionTime(() => {
    const arrays = [];
    for (let i = 0; i < 1000; i++) {
      arrays.push(new Array(1000).fill(i));
    }
    return arrays;
  });

  const access = await measureExecutionTime(() => {
    const arr = new Array(100000).fill(0).map((_, i) => i);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum;
  });

  const garbage = await measureExecutionTime(() => {
    for (let i = 0; i < 1000; i++) {
      const temp = new Array(1000).fill(Math.random());
      temp.length = 0; // Force potential GC
    }
  });

  return {
    allocation: { arrayAllocation: allocation.duration },
    access: { sequentialAccess: access.duration },
    garbage: { garbageCollection: garbage.duration },
  };
}

/**
 * Main timing fingerprinting function
 */
export async function collectTimingFingerprint(): Promise<TimingFingerprint> {
  if (!isBrowser()) {
    return {
      isSupported: false,
      performanceTimings: {
        cryptoOperations: {},
        mathOperations: {},
        arrayOperations: {},
        stringOperations: {},
        regexOperations: {},
        sortingAlgorithms: {},
      },
      wasmTimings: {
        isSupported: false,
        compilationTime: 0,
        instantiationTime: 0,
        executionTimings: {},
        memoryOperations: {},
      },
      cpuBenchmarks: {
        singleThread: {},
        workerThread: {},
        concurrency: {},
      },
      memoryTimings: {
        allocation: {},
        access: {},
        garbage: {},
      },
      clockResolution: 1,
      performanceApiPrecision: 1,
      entropy: 0,
    };
  }

  try {
    const clockResolution = measureClockResolution();
    const performanceApiPrecision = testPerformanceApiPrecision();

    const cryptoOperations = await benchmarkCryptoOperations();
    const mathOperations = await benchmarkMathOperations();
    const arrayOperations = await benchmarkArrayOperations();
    const stringOperations = await benchmarkStringOperations();
    const regexOperations = await benchmarkRegexOperations();
    const sortingAlgorithms = await benchmarkSortingAlgorithms();

    const wasmTimings = await testWebAssembly();
    const cpuBenchmarks = await benchmarkCPU();
    const memoryTimings = await benchmarkMemory();

    // Calculate entropy
    const combinedData = JSON.stringify({
      performanceTimings: {
        cryptoOperations,
        mathOperations,
        arrayOperations,
        stringOperations,
        regexOperations,
        sortingAlgorithms,
      },
      wasmTimings,
      cpuBenchmarks,
      memoryTimings,
      clockResolution,
      performanceApiPrecision,
    });

    const entropy = new Set(combinedData).size / combinedData.length;

    return {
      isSupported: true,
      performanceTimings: {
        cryptoOperations,
        mathOperations,
        arrayOperations,
        stringOperations,
        regexOperations,
        sortingAlgorithms,
      },
      wasmTimings,
      cpuBenchmarks,
      memoryTimings,
      clockResolution,
      performanceApiPrecision,
      entropy: Math.round(entropy * 1000) / 1000,
    };
  } catch (error) {
    return {
      isSupported: false,
      performanceTimings: {
        cryptoOperations: {},
        mathOperations: {},
        arrayOperations: {},
        stringOperations: {},
        regexOperations: {},
        sortingAlgorithms: {},
      },
      wasmTimings: {
        isSupported: false,
        compilationTime: 0,
        instantiationTime: 0,
        executionTimings: {},
        memoryOperations: {},
      },
      cpuBenchmarks: {
        singleThread: {},
        workerThread: {},
        concurrency: {},
      },
      memoryTimings: {
        allocation: {},
        access: {},
        garbage: {},
      },
      clockResolution: 1,
      performanceApiPrecision: 1,
      entropy: 0,
    };
  }
}
