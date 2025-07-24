/**
 * Canvas fingerprinting module
 * Generates unique fingerprints based on canvas rendering capabilities
 */

import { safeFeatureDetect, hashData, isBrowser } from "@/lib/fingerprint/utils";
import type { CanvasFingerprint } from "@/types/fingerprint";

/**
 * Font list for canvas text rendering tests
 */
const CANVAS_FONTS = [
  "Arial",
  "Helvetica",
  "Times",
  "Times New Roman",
  "Courier",
  "Courier New",
  "Verdana",
  "Georgia",
  "Palatino",
  "Garamond",
  "Bookman",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Impact",
  "Tahoma",
  "Geneva",
  "Lucida Console",
  "Monaco",
  "Andale Mono",
  "Consolas",
  "Menlo",
  "DejaVu Sans",
  "Liberation Sans",
  "Ubuntu",
  "Roboto",
  "Open Sans",
  "Source Sans Pro",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "PT Sans",
  "Source Code Pro",
  "Inconsolata",
  "Fira Code",
  "JetBrains Mono",
  "Cascadia Code",
  "SF Pro Display",
  "SF Mono",
  "Segoe UI",
  "System",
  "-apple-system",
  "BlinkMacSystemFont",
];

/**
 * Text samples for canvas rendering
 */
const TEXT_SAMPLES = [
  "Cwm fjord bank glyphs vext quiz 😀🔒🌟",
  "The quick brown fox jumps over the lazy dog",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
  "1234567890!@#$%^&*()",
  "🚀💻🎨🔬🌍💡🎵📱⚡🎯",
  "αβγδεζηθικλμνξοπρστυφχψω",
  "中文测试文本한국어テスト",
  "مرحبا بالعالم",
];

/**
 * Create a canvas element with specified dimensions
 */
function createCanvas(
  width: number = 200,
  height: number = 50
): HTMLCanvasElement | null {
  if (!isBrowser()) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  } catch {
    return null;
  }
}

/**
 * Get canvas 2D rendering context
 */
function getContext2D(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext("2d");
  } catch {
    return null;
  }
}

/**
 * Generate canvas fingerprint using basic shapes and text
 */
function generateBasicCanvasFingerprint(): string {
  const canvas = createCanvas(200, 50);
  if (!canvas) return "";

  const ctx = getContext2D(canvas);
  if (!ctx) return "";

  try {
    // Set canvas properties
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";

    // Draw rectangle
    ctx.fillRect(125, 1, 62, 20);

    // Set text color and draw text
    ctx.fillStyle = "#069";
    ctx.fillText("Hello, world! 🌍", 2, 15);

    // Draw another text with different styling
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18px Arial";
    ctx.fillText("Canvas fingerprint test", 4, 25);

    // Add some geometric shapes
    ctx.beginPath();
    ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL();
  } catch {
    return "";
  }
}

/**
 * Generate advanced canvas fingerprint with gradients and complex shapes
 */
function generateAdvancedCanvasFingerprint(): string {
  const canvas = createCanvas(300, 150);
  if (!canvas) return "";

  const ctx = getContext2D(canvas);
  if (!ctx) return "";

  try {
    // Create linear gradient
    const gradient = ctx.createLinearGradient(0, 0, 300, 0);
    gradient.addColorStop(0, "#ff0000");
    gradient.addColorStop(0.5, "#00ff00");
    gradient.addColorStop(1, "#0000ff");

    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 50);

    // Create radial gradient
    const radialGradient = ctx.createRadialGradient(75, 100, 5, 75, 100, 50);
    radialGradient.addColorStop(0, "#ffff00");
    radialGradient.addColorStop(1, "#ff00ff");

    // Draw circle with radial gradient
    ctx.fillStyle = radialGradient;
    ctx.beginPath();
    ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Draw complex path
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 50);
    ctx.lineTo(200, 100);
    ctx.lineTo(250, 50);
    ctx.lineTo(275, 100);
    ctx.lineTo(225, 125);
    ctx.lineTo(175, 125);
    ctx.closePath();
    ctx.stroke();

    // Add shadow effects
    ctx.shadowColor = "#333333";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Draw text with shadow
    ctx.fillStyle = "#333333";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Advanced Canvas Test", 150, 120);

    return canvas.toDataURL();
  } catch {
    return "";
  }
}

/**
 * Generate font-specific canvas fingerprints
 */
function generateFontFingerprints(): Record<string, string> {
  const results: Record<string, string> = {};

  for (const font of CANVAS_FONTS.slice(0, 20)) {
    // Limit to prevent performance issues
    const canvas = createCanvas(200, 30);
    if (!canvas) continue;

    const ctx = getContext2D(canvas);
    if (!ctx) continue;

    try {
      ctx.font = `16px ${font}`;
      ctx.fillStyle = "#000";
      ctx.textBaseline = "top";
      ctx.fillText("Font test: Mmw", 2, 2);

      results[font] = hashData(canvas.toDataURL());
    } catch {
      // Skip fonts that cause errors
    }
  }

  return results;
}

/**
 * Generate text rendering fingerprints with different samples
 */
function generateTextFingerprints(): Record<string, string> {
  const results: Record<string, string> = {};

  for (let i = 0; i < Math.min(TEXT_SAMPLES.length, 5); i++) {
    const text = TEXT_SAMPLES[i];
    const canvas = createCanvas(300, 40);
    if (!canvas) continue;

    const ctx = getContext2D(canvas);
    if (!ctx) continue;

    try {
      ctx.font = "14px Arial";
      ctx.fillStyle = "#000";
      ctx.textBaseline = "top";
      ctx.fillText(text, 2, 2);

      results[`sample_${i}`] = hashData(canvas.toDataURL());
    } catch {
      // Skip problematic text samples
    }
  }

  return results;
}

/**
 * Measure text metrics for various fonts
 */
function measureTextMetrics(): Record<string, any> {
  const canvas = createCanvas(200, 50);
  if (!canvas) return {};

  const ctx = getContext2D(canvas);
  if (!ctx) return {};

  const results: Record<string, any> = {};

  try {
    const testText = "Mmw";

    for (const font of CANVAS_FONTS.slice(0, 10)) {
      try {
        ctx.font = `16px ${font}`;
        const metrics = ctx.measureText(testText);

        results[font] = {
          width: metrics.width,
          actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
          actualBoundingBoxRight: metrics.actualBoundingBoxRight || 0,
          actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || 0,
          actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || 0,
        };
      } catch {
        // Skip problematic fonts
      }
    }
  } catch {
    // Return empty if measurements fail
  }

  return results;
}

/**
 * Test canvas blend modes and composite operations
 */
function testBlendModes(): Record<string, string> {
  const blendModes = [
    "source-over",
    "source-in",
    "source-out",
    "source-atop",
    "destination-over",
    "destination-in",
    "destination-out",
    "destination-atop",
    "lighter",
    "copy",
    "xor",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
  ];

  const results: Record<string, string> = {};

  for (const mode of blendModes) {
    const canvas = createCanvas(100, 50);
    if (!canvas) continue;

    const ctx = getContext2D(canvas);
    if (!ctx) continue;

    try {
      // Draw base shape
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(10, 10, 30, 30);

      // Set blend mode and draw overlapping shape
      ctx.globalCompositeOperation = mode as GlobalCompositeOperation;
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(20, 20, 30, 30);

      results[mode] = hashData(canvas.toDataURL());
    } catch {
      // Skip unsupported blend modes
    }
  }

  return results;
}

/**
 * Test canvas image data manipulation
 */
function testImageData(): string {
  const canvas = createCanvas(50, 50);
  if (!canvas) return "";

  const ctx = getContext2D(canvas);
  if (!ctx) return "";

  try {
    // Create a simple pattern
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 25, 25);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(25, 0, 25, 25);
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 25, 25, 25);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(25, 25, 25, 25);

    // Get image data
    const imageData = ctx.getImageData(0, 0, 50, 50);

    // Manipulate some pixels
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = (imageData.data[i] + 50) % 256; // Red
      imageData.data[i + 1] = (imageData.data[i + 1] + 100) % 256; // Green
    }

    // Put image data back
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  } catch {
    return "";
  }
}

/**
 * Main canvas fingerprinting function
 */
export function collectCanvasFingerprint(): CanvasFingerprint {
  if (!isBrowser()) {
    return {
      isSupported: false,
      basic: "",
      advanced: "",
      fonts: {},
      textSamples: {},
      textMetrics: {},
      blendModes: {},
      imageData: "",
      entropy: 0,
    };
  }

  return safeFeatureDetect(
    (): CanvasFingerprint => {
      const basic = generateBasicCanvasFingerprint();
      const advanced = generateAdvancedCanvasFingerprint();
      const fonts = generateFontFingerprints();
      const textSamples = generateTextFingerprints();
      const textMetrics = measureTextMetrics();
      const blendModes = testBlendModes();
      const imageData = testImageData();

      // Calculate entropy based on the uniqueness of the canvas data
      const combinedData =
        basic +
        advanced +
        JSON.stringify(fonts) +
        JSON.stringify(textSamples) +
        JSON.stringify(textMetrics) +
        JSON.stringify(blendModes) +
        imageData;

      // Simple entropy calculation - in production, use a more sophisticated algorithm
      const entropy = new Set(combinedData).size / combinedData.length;

      return {
        isSupported: true,
        basic: hashData(basic),
        advanced: hashData(advanced),
        fonts,
        textSamples,
        textMetrics,
        blendModes,
        imageData: hashData(imageData),
        entropy: Math.round(entropy * 1000) / 1000,
      };
    },
    {
      isSupported: false,
      basic: "",
      advanced: "",
      fonts: {},
      textSamples: {},
      textMetrics: {},
      blendModes: {},
      imageData: "",
      entropy: 0,
    } as CanvasFingerprint
  );
}
