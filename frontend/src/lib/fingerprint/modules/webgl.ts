/**
 * WebGL fingerprinting module
 * Generates unique fingerprints based on WebGL rendering capabilities
 */

import { safeFeatureDetect, hashData, isBrowser } from "@/lib/fingerprint/utils";
import type { WebGLFingerprint } from "@/types/fingerprint";

/**
 * WebGL context types to test
 */
const WEBGL_CONTEXTS = ["webgl", "experimental-webgl", "webgl2"] as const;

/**
 * Common WebGL parameters to probe
 */
const WEBGL_PARAMETERS = [
  "VERSION",
  "SHADING_LANGUAGE_VERSION",
  "VENDOR",
  "RENDERER",
  "MAX_VERTEX_ATTRIBS",
  "MAX_VERTEX_UNIFORM_VECTORS",
  "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
  "MAX_VARYING_VECTORS",
  "MAX_FRAGMENT_UNIFORM_VECTORS",
  "MAX_TEXTURE_IMAGE_UNITS",
  "MAX_TEXTURE_SIZE",
  "MAX_CUBE_MAP_TEXTURE_SIZE",
  "MAX_RENDERBUFFER_SIZE",
  "MAX_VIEWPORT_DIMS",
  "ALIASED_LINE_WIDTH_RANGE",
  "ALIASED_POINT_SIZE_RANGE",
  "MAX_TEXTURE_MAX_ANISOTROPY_EXT",
  "MAX_COLOR_ATTACHMENTS_WEBGL",
  "MAX_DRAW_BUFFERS_WEBGL",
  "UNMASKED_VENDOR_WEBGL",
  "UNMASKED_RENDERER_WEBGL",
] as const;

/**
 * Texture formats to test
 */
const TEXTURE_FORMATS = [
  "ALPHA",
  "RGB",
  "RGBA",
  "LUMINANCE",
  "LUMINANCE_ALPHA",
  "RGB565",
  "RGBA4",
  "RGB5_A1",
  "DEPTH_COMPONENT16",
  "STENCIL_INDEX8",
  "DEPTH_STENCIL",
] as const;

/**
 * Renderbuffer formats to test
 */
const RENDERBUFFER_FORMATS = [
  "RGBA4",
  "RGB565",
  "RGB5_A1",
  "DEPTH_COMPONENT16",
  "STENCIL_INDEX8",
  "DEPTH_STENCIL",
] as const;

/**
 * Create a WebGL context
 */
function createWebGLContext(
  contextType: string = "webgl"
): WebGLRenderingContext | WebGL2RenderingContext | null {
  if (!isBrowser()) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;

    const contextOptions = {
      alpha: false,
      antialias: false,
      depth: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "default" as WebGLPowerPreference,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
    };

    return canvas.getContext(contextType, contextOptions) as
      | WebGLRenderingContext
      | WebGL2RenderingContext;
  } catch {
    return null;
  }
}

/**
 * Get WebGL context information
 */
function getWebGLInfo(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const info = {
    vendor: "",
    renderer: "",
    unmaskedVendor: "",
    unmaskedRenderer: "",
    version: "",
    shadingLanguageVersion: "",
  };

  try {
    info.vendor = gl.getParameter(gl.VENDOR) || "";
    info.renderer = gl.getParameter(gl.RENDERER) || "";
    info.version = gl.getParameter(gl.VERSION) || "";
    info.shadingLanguageVersion =
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || "";

    // Try to get unmasked vendor and renderer
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      info.unmaskedVendor =
        gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
      info.unmaskedRenderer =
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    }
  } catch {
    // Ignore errors when getting WebGL info
  }

  return info;
}

/**
 * Get WebGL extensions
 */
function getWebGLExtensions(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string[] {
  try {
    return gl.getSupportedExtensions() || [];
  } catch {
    return [];
  }
}

/**
 * Get WebGL parameters
 */
function getWebGLParameters(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): Record<string, any> {
  const parameters: Record<string, any> = {};

  for (const param of WEBGL_PARAMETERS) {
    try {
      const constant = (gl as any)[param];
      if (constant !== undefined) {
        const value = gl.getParameter(constant);
        parameters[param] = value;
      }
    } catch {
      // Ignore errors for unsupported parameters
    }
  }

  return parameters;
}

/**
 * Test WebGL capabilities
 */
function getWebGLCapabilities(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): Record<string, any> {
  const capabilities: Record<string, any> = {};

  try {
    // Test floating point textures
    const floatExt = gl.getExtension("OES_texture_float");
    capabilities.floatingPointTextures = !!floatExt;

    // Test half float textures
    const halfFloatExt = gl.getExtension("OES_texture_half_float");
    capabilities.halfFloatTextures = !!halfFloatExt;

    // Test vertex array objects
    const vaoExt = gl.getExtension("OES_vertex_array_object");
    capabilities.vertexArrayObjects = !!vaoExt;

    // Test instanced arrays
    const instancedExt = gl.getExtension("ANGLE_instanced_arrays");
    capabilities.instancedArrays = !!instancedExt;

    // Test multiple render targets
    const mrtExt = gl.getExtension("WEBGL_draw_buffers");
    capabilities.multipleRenderTargets = !!mrtExt;

    // Test depth textures
    const depthExt = gl.getExtension("WEBGL_depth_texture");
    capabilities.depthTextures = !!depthExt;

    // Test texture compression
    const s3tcExt = gl.getExtension("WEBGL_compressed_texture_s3tc");
    capabilities.s3tcCompression = !!s3tcExt;

    const etcExt = gl.getExtension("WEBGL_compressed_texture_etc1");
    capabilities.etcCompression = !!etcExt;

    const pvrtcExt = gl.getExtension("WEBGL_compressed_texture_pvrtc");
    capabilities.pvrtcCompression = !!pvrtcExt;
  } catch {
    // Ignore errors when testing capabilities
  }

  return capabilities;
}

/**
 * Get supported texture formats
 */
function getSupportedTextureFormats(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string[] {
  const supported: string[] = [];

  for (const format of TEXTURE_FORMATS) {
    try {
      const constant = (gl as any)[format];
      if (constant !== undefined) {
        // Test if format is supported by trying to create a texture
        const texture = gl.createTexture();
        if (texture) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            constant,
            1,
            1,
            0,
            constant,
            gl.UNSIGNED_BYTE,
            null
          );

          if (gl.getError() === gl.NO_ERROR) {
            supported.push(format);
          }

          gl.deleteTexture(texture);
        }
      }
    } catch {
      // Ignore errors for unsupported formats
    }
  }

  return supported;
}

/**
 * Get supported renderbuffer formats
 */
function getSupportedRenderbufferFormats(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string[] {
  const supported: string[] = [];

  for (const format of RENDERBUFFER_FORMATS) {
    try {
      const constant = (gl as any)[format];
      if (constant !== undefined) {
        // Test if format is supported by trying to create a renderbuffer
        const renderbuffer = gl.createRenderbuffer();
        if (renderbuffer) {
          gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
          gl.renderbufferStorage(gl.RENDERBUFFER, constant, 1, 1);

          if (gl.getError() === gl.NO_ERROR) {
            supported.push(format);
          }

          gl.deleteRenderbuffer(renderbuffer);
        }
      }
    } catch {
      // Ignore errors for unsupported formats
    }
  }

  return supported;
}

/**
 * Get maximum values for WebGL parameters
 */
function getWebGLMaxValues(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): Record<string, number> {
  const maxValues: Record<string, number> = {};

  const maxParams = [
    "MAX_TEXTURE_SIZE",
    "MAX_CUBE_MAP_TEXTURE_SIZE",
    "MAX_RENDERBUFFER_SIZE",
    "MAX_VERTEX_ATTRIBS",
    "MAX_VERTEX_UNIFORM_VECTORS",
    "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
    "MAX_VARYING_VECTORS",
    "MAX_FRAGMENT_UNIFORM_VECTORS",
    "MAX_TEXTURE_IMAGE_UNITS",
    "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
  ];

  for (const param of maxParams) {
    try {
      const constant = (gl as any)[param];
      if (constant !== undefined) {
        const value = gl.getParameter(constant);
        if (typeof value === "number") {
          maxValues[param] = value;
        }
      }
    } catch {
      // Ignore errors for unsupported parameters
    }
  }

  return maxValues;
}

/**
 * Create and compile a shader
 */
function createShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  try {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  } catch {
    return null;
  }
}

/**
 * Create a shader program
 */
function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  try {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    return program;
  } catch {
    return null;
  }
}

/**
 * Render a basic scene for fingerprinting
 */
function renderBasicScene(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string {
  try {
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return "";

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return "";

    // Create buffer
    const buffer = gl.createBuffer();
    if (!buffer) return "";

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Use program
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels
    const pixels = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Clean up
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return Array.from(pixels).join(",");
  } catch {
    return "";
  }
}

/**
 * Render a triangle for fingerprinting
 */
function renderTriangle(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string {
  try {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      varying vec3 v_color;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 v_color;
      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return "";

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return "";

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    if (!positionBuffer || !colorBuffer) return "";

    // Position data
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]),
      gl.STATIC_DRAW
    );

    // Color data
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]),
      gl.STATIC_DRAW
    );

    // Use program
    gl.useProgram(program);

    // Set up position attribute
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set up color attribute
    const colorLocation = gl.getAttribLocation(program, "a_color");
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Read pixels from center
    const pixels = new Uint8Array(4);
    gl.readPixels(128, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Clean up
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return Array.from(pixels).join(",");
  } catch {
    return "";
  }
}

/**
 * Render a gradient for fingerprinting
 */
function renderGradient(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string {
  try {
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_position = a_position;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_position;
      void main() {
        gl_FragColor = vec4(v_position * 0.5 + 0.5, 0.0, 1.0);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return "";

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return "";

    // Create buffer
    const buffer = gl.createBuffer();
    if (!buffer) return "";

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Use program
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels from multiple points
    const pixels1 = new Uint8Array(4);
    const pixels2 = new Uint8Array(4);
    const pixels3 = new Uint8Array(4);

    gl.readPixels(64, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels1);
    gl.readPixels(128, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels2);
    gl.readPixels(192, 96, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels3);

    // Clean up
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return [
      Array.from(pixels1).join(","),
      Array.from(pixels2).join(","),
      Array.from(pixels3).join(","),
    ].join("|");
  } catch {
    return "";
  }
}

/**
 * Test floating point rendering
 */
function renderFloatingPoint(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): string {
  try {
    const floatExt = gl.getExtension("OES_texture_float");
    if (!floatExt) return "";

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      void main() {
        float value = 1.0 / 3.0;
        gl_FragColor = vec4(value, value * 2.0, value * 3.0, 1.0);
      }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return "";

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return "";

    // Create buffer
    const buffer = gl.createBuffer();
    if (!buffer) return "";

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Use program
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels
    const pixels = new Uint8Array(4);
    gl.readPixels(128, 64, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Clean up
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return Array.from(pixels).join(",");
  } catch {
    return "";
  }
}

/**
 * Main WebGL fingerprinting function
 */
export function collectWebGLFingerprint(): WebGLFingerprint {
  if (!isBrowser()) {
    return {
      isSupported: false,
      vendor: "",
      renderer: "",
      version: "",
      shadingLanguageVersion: "",
      extensions: [],
      parameters: {},
      capabilities: {},
      renderHashes: {
        basic: "",
        triangle: "",
        gradient: "",
        floating: "",
      },
      supportedFormats: {
        textures: [],
        renderbuffers: [],
      },
      maxValues: {},
      entropy: 0,
    } as WebGLFingerprint;
  }

  return safeFeatureDetect(
    (): WebGLFingerprint => {
      // Try different WebGL context types
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

      for (const contextType of WEBGL_CONTEXTS) {
        gl = createWebGLContext(contextType);
        if (gl) break;
      }

      if (!gl) {
        return {
          isSupported: false,
          vendor: "",
          renderer: "",
          version: "",
          shadingLanguageVersion: "",
          extensions: [],
          parameters: {},
          capabilities: {},
          renderHashes: {
            basic: "",
            triangle: "",
            gradient: "",
            floating: "",
          },
          supportedFormats: {
            textures: [],
            renderbuffers: [],
          },
          maxValues: {},
          entropy: 0,
        } as WebGLFingerprint;
      }

      // Collect WebGL information
      const info = getWebGLInfo(gl);
      const extensions = getWebGLExtensions(gl);
      const parameters = getWebGLParameters(gl);
      const capabilities = getWebGLCapabilities(gl);
      const maxValues = getWebGLMaxValues(gl);

      // Test supported formats
      const supportedTextures = getSupportedTextureFormats(gl);
      const supportedRenderbuffers = getSupportedRenderbufferFormats(gl);

      // Render different scenes for fingerprinting
      const renderHashes = {
        basic: hashData(renderBasicScene(gl)),
        triangle: hashData(renderTriangle(gl)),
        gradient: hashData(renderGradient(gl)),
        floating: hashData(renderFloatingPoint(gl)),
      };

      // Calculate entropy
      const combinedData = JSON.stringify({
        info,
        extensions,
        parameters,
        capabilities,
        renderHashes,
        supportedFormats: {
          textures: supportedTextures,
          renderbuffers: supportedRenderbuffers,
        },
        maxValues,
      });

      const entropy = new Set(combinedData).size / combinedData.length;

      return {
        isSupported: true,
        vendor: info.vendor,
        renderer: info.renderer,
        unmaskedVendor: info.unmaskedVendor,
        unmaskedRenderer: info.unmaskedRenderer,
        version: info.version,
        shadingLanguageVersion: info.shadingLanguageVersion,
        extensions: extensions.sort(),
        parameters,
        capabilities,
        renderHashes,
        supportedFormats: {
          textures: supportedTextures.sort(),
          renderbuffers: supportedRenderbuffers.sort(),
        },
        maxValues,
        entropy: Math.round(entropy * 1000) / 1000,
      };
    },
    {
      isSupported: false,
      vendor: "",
      renderer: "",
      version: "",
      shadingLanguageVersion: "",
      extensions: [],
      parameters: {},
      capabilities: {},
      renderHashes: {
        basic: "",
        triangle: "",
        gradient: "",
        floating: "",
      },
      supportedFormats: {
        textures: [],
        renderbuffers: [],
      },
      maxValues: {},
      entropy: 0,
    } as WebGLFingerprint
  );
}
