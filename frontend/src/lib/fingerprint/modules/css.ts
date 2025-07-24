/**
 * CSS fingerprinting module
 * Comprehensive CSS feature detection and computed style analysis
 */

import { safeFeatureDetect, hashData, isBrowser } from "@/lib/fingerprint/utils";
import type { CSSFingerprint } from "@/types/fingerprint";

/**
 * Media queries to test
 */
const MEDIA_QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: browser)",
  "(prefers-reduced-motion: reduce)",
  "(prefers-reduced-motion: no-preference)",
  "(prefers-color-scheme: dark)",
  "(prefers-color-scheme: light)",
  "(prefers-contrast: high)",
  "(prefers-contrast: low)",
  "(prefers-reduced-transparency: reduce)",
  "(forced-colors: active)",
  "(hover: hover)",
  "(hover: none)",
  "(pointer: fine)",
  "(pointer: coarse)",
  "(pointer: none)",
  "(any-hover: hover)",
  "(any-hover: none)",
  "(any-pointer: fine)",
  "(any-pointer: coarse)",
  "(any-pointer: none)",
  "(orientation: portrait)",
  "(orientation: landscape)",
  "(min-resolution: 2dppx)",
  "(max-resolution: 1dppx)",
  "(color-gamut: srgb)",
  "(color-gamut: p3)",
  "(color-gamut: rec2020)",
  "(monochrome)",
  "(grid)",
  "(update: fast)",
  "(update: slow)",
  "(update: none)",
  "(overflow-block: scroll)",
  "(overflow-inline: scroll)",
  "(scan: interlace)",
  "(scan: progressive)",
];

/**
 * CSS features to test using @supports
 */
const CSS_FEATURES = [
  "display: flex",
  "display: grid",
  "display: contents",
  "display: flow-root",
  "position: sticky",
  "position: relative",
  "backdrop-filter: blur(10px)",
  "filter: blur(10px)",
  "transform: translateZ(0)",
  "will-change: transform",
  "contain: layout",
  "contain: style",
  "contain: paint",
  "contain: size",
  "scroll-behavior: smooth",
  "scroll-snap-type: x mandatory",
  "overscroll-behavior: contain",
  "user-select: none",
  "pointer-events: none",
  "mix-blend-mode: multiply",
  "isolation: isolate",
  "clip-path: circle(50%)",
  "mask: url(#mask)",
  "shape-outside: circle(50%)",
  "writing-mode: vertical-rl",
  "text-orientation: mixed",
  "font-variant-caps: small-caps",
  'font-feature-settings: "liga"',
  'font-variation-settings: "wght" 400',
  "hyphens: auto",
  "text-decoration-skip-ink: auto",
  "text-underline-offset: 0.1em",
  "text-decoration-thickness: 2px",
  "accent-color: blue",
  "color-scheme: dark light",
  "forced-color-adjust: none",
  "print-color-adjust: exact",
  "appearance: none",
  "resize: both",
  "cursor: grab",
  "caret-color: red",
  "tab-size: 4",
  "white-space: break-spaces",
  "word-break: break-word",
  "line-break: anywhere",
  "hanging-punctuation: first",
  "image-rendering: pixelated",
  "object-fit: cover",
  "object-position: center",
];

/**
 * CSS properties to test
 */
const CSS_PROPERTIES = [
  "aspect-ratio",
  "backdrop-filter",
  "block-size",
  "border-block",
  "border-inline",
  "box-decoration-break",
  "color-scheme",
  "contain",
  "contain-intrinsic-size",
  "content-visibility",
  "counter-set",
  "font-optical-sizing",
  "font-palette",
  "font-synthesis",
  "font-variant-alternates",
  "font-variant-emoji",
  "font-variant-position",
  "forced-color-adjust",
  "gap",
  "grid-template-areas",
  "hanging-punctuation",
  "hyphenate-character",
  "image-orientation",
  "initial-letter",
  "inline-size",
  "inset",
  "inset-block",
  "inset-inline",
  "isolation",
  "line-height-step",
  "logical-width",
  "logical-height",
  "margin-block",
  "margin-inline",
  "mask",
  "mask-border",
  "math-style",
  "offset",
  "offset-path",
  "overflow-anchor",
  "overflow-clip-margin",
  "overflow-wrap",
  "overscroll-behavior",
  "padding-block",
  "padding-inline",
  "paint-order",
  "place-content",
  "place-items",
  "place-self",
  "rotate",
  "ruby-align",
  "ruby-position",
  "scale",
  "scroll-behavior",
  "scroll-margin",
  "scroll-padding",
  "scroll-snap-align",
  "scroll-snap-stop",
  "scroll-snap-type",
  "scrollbar-color",
  "scrollbar-gutter",
  "scrollbar-width",
  "shape-image-threshold",
  "shape-margin",
  "shape-outside",
  "tab-size",
  "text-align-last",
  "text-combine-upright",
  "text-decoration-skip",
  "text-decoration-skip-ink",
  "text-emphasis",
  "text-justify",
  "text-orientation",
  "text-size-adjust",
  "text-underline-offset",
  "text-underline-position",
  "touch-action",
  "transform-box",
  "transform-style",
  "translate",
  "user-select",
  "white-space-collapse",
  "word-break",
  "writing-mode",
];

/**
 * CSS units to test
 */
const CSS_UNITS = [
  "px",
  "em",
  "rem",
  "%",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "ch",
  "ex",
  "lh",
  "rlh",
  "cap",
  "ic",
  "svh",
  "svw",
  "lvh",
  "lvw",
  "dvh",
  "dvw",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  "fr",
  "deg",
  "rad",
  "grad",
  "turn",
  "ms",
  "s",
  "Hz",
  "kHz",
  "dpi",
  "dpcm",
  "dppx",
  "x",
];

/**
 * CSS color spaces to test
 */
const COLOR_SPACES = [
  "srgb",
  "display-p3",
  "rec2020",
  "a98-rgb",
  "prophoto-rgb",
  "xyz",
  "xyz-d50",
  "xyz-d65",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "hsl",
  "hwb",
];

/**
 * CSS selectors to test
 */
const CSS_SELECTORS = [
  ":hover",
  ":focus",
  ":active",
  ":visited",
  ":link",
  ":first-child",
  ":last-child",
  ":nth-child(2n)",
  ":nth-of-type(odd)",
  ":only-child",
  ":empty",
  ":checked",
  ":disabled",
  ":enabled",
  ":required",
  ":optional",
  ":valid",
  ":invalid",
  ":in-range",
  ":out-of-range",
  ":read-only",
  ":read-write",
  ":target",
  ":root",
  ":scope",
  ":any-link",
  ":local-link",
  ":target-within",
  ":focus-within",
  ":focus-visible",
  ":current",
  ":past",
  ":future",
  ":playing",
  ":paused",
  ":seeking",
  ":buffering",
  ":stalled",
  ":muted",
  ":volume-locked",
  ":fullscreen",
  ":picture-in-picture",
  ":user-invalid",
  ":blank",
  ":has()",
  ":is()",
  ":where()",
  ":not()",
];

/**
 * CSS pseudo-elements to test
 */
const PSEUDO_ELEMENTS = [
  "::before",
  "::after",
  "::first-line",
  "::first-letter",
  "::selection",
  "::backdrop",
  "::placeholder",
  "::marker",
  "::spelling-error",
  "::grammar-error",
  "::highlight()",
  "::target-text",
  "::file-selector-button",
  "::cue",
  "::slotted()",
  "::part()",
  "::view-transition",
  "::view-transition-group()",
  "::view-transition-image-pair()",
  "::view-transition-old()",
  "::view-transition-new()",
];

/**
 * CSS at-rules to test
 */
const AT_RULES = [
  "@media",
  "@supports",
  "@import",
  "@namespace",
  "@charset",
  "@font-face",
  "@font-feature-values",
  "@font-palette-values",
  "@keyframes",
  "@page",
  "@property",
  "@layer",
  "@container",
  "@counter-style",
  "@document",
  "@viewport",
  "@color-profile",
];

/**
 * Vendor prefixes to detect
 */
const VENDOR_PREFIXES = ["-webkit-", "-moz-", "-ms-", "-o-"];

/**
 * Create a test element for CSS feature detection
 */
function createTestElement(): HTMLElement | null {
  if (!isBrowser()) return null;

  try {
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "-9999px";
    element.style.visibility = "hidden";
    element.style.pointerEvents = "none";
    return element;
  } catch {
    return null;
  }
}

/**
 * Test media query support
 */
function testMediaQueries(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser()) return results;

  for (const query of MEDIA_QUERIES) {
    try {
      results[query] = window.matchMedia(query).matches;
    } catch {
      results[query] = false;
    }
  }

  return results;
}

/**
 * Test CSS feature support using @supports
 */
function testCSSFeatures(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser() || !window.CSS || !window.CSS.supports) {
    return results;
  }

  for (const feature of CSS_FEATURES) {
    try {
      results[feature] = window.CSS.supports(feature);
    } catch {
      results[feature] = false;
    }
  }

  return results;
}

/**
 * Test CSS property support
 */
function testCSSProperties(): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  const testElement = createTestElement();

  if (!testElement) return results;

  try {
    document.body.appendChild(testElement);

    for (const property of CSS_PROPERTIES) {
      try {
        const camelCase = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        results[property] = camelCase in testElement.style;
      } catch {
        results[property] = false;
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing properties
  }

  return results;
}

/**
 * Test computed styles for various elements
 */
function testComputedStyles(): Record<string, string> {
  const results: Record<string, string> = {};

  if (!isBrowser()) return results;

  try {
    const testElement = createTestElement();
    if (!testElement) return results;

    document.body.appendChild(testElement);

    const computedStyle = window.getComputedStyle(testElement);

    const propertiesToTest = [
      "display",
      "position",
      "visibility",
      "opacity",
      "zIndex",
      "fontSize",
      "fontFamily",
      "fontWeight",
      "lineHeight",
      "color",
      "backgroundColor",
      "borderWidth",
      "borderStyle",
      "borderColor",
      "margin",
      "padding",
      "width",
      "height",
      "boxSizing",
      "overflow",
      "textAlign",
      "verticalAlign",
      "textDecoration",
      "textTransform",
      "letterSpacing",
      "wordSpacing",
      "textIndent",
      "textShadow",
      "boxShadow",
      "borderRadius",
      "transform",
      "transition",
      "animation",
    ];

    for (const property of propertiesToTest) {
      try {
        const value =
          computedStyle.getPropertyValue(property) ||
          (computedStyle as any)[property] ||
          "";
        results[property] = hashData(value.toString());
      } catch {
        results[property] = "";
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing computed styles
  }

  return results;
}

/**
 * Test browser-specific CSS extensions
 */
function testBrowserExtensions(): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  const testElement = createTestElement();

  if (!testElement) return results;

  try {
    document.body.appendChild(testElement);

    // Test webkit-specific properties
    const webkitProperties = [
      "webkitTransform",
      "webkitTransition",
      "webkitAnimation",
      "webkitBorderRadius",
      "webkitBoxShadow",
      "webkitTextStroke",
      "webkitBackgroundClip",
      "webkitMask",
      "webkitFilter",
      "webkitBackdropFilter",
      "webkitUserSelect",
      "webkitAppearance",
    ];

    // Test moz-specific properties
    const mozProperties = [
      "MozTransform",
      "MozTransition",
      "MozAnimation",
      "MozBorderRadius",
      "MozBoxShadow",
      "MozUserSelect",
      "MozAppearance",
      "MozBackgroundClip",
    ];

    // Test ms-specific properties
    const msProperties = [
      "msTransform",
      "msTransition",
      "msFilter",
      "msUserSelect",
      "msTouchAction",
      "msScrollbarWidth",
    ];

    const allProperties = [
      ...webkitProperties.map((p) => ({ name: p, prefix: "webkit" })),
      ...mozProperties.map((p) => ({ name: p, prefix: "moz" })),
      ...msProperties.map((p) => ({ name: p, prefix: "ms" })),
    ];

    for (const { name, prefix } of allProperties) {
      try {
        results[`${prefix}-${name}`] = name in testElement.style;
      } catch {
        results[`${prefix}-${name}`] = false;
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing browser extensions
  }

  return results;
}

/**
 * Test CSS unit support
 */
function testCSSUnits(): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  const testElement = createTestElement();

  if (!testElement) return results;

  try {
    document.body.appendChild(testElement);

    for (const unit of CSS_UNITS) {
      try {
        testElement.style.width = `10${unit}`;
        results[unit] = testElement.style.width !== "";
        testElement.style.width = "";
      } catch {
        results[unit] = false;
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing CSS units
  }

  return results;
}

/**
 * Test color space support
 */
function testColorSpaces(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser() || !window.CSS || !window.CSS.supports) {
    return results;
  }

  for (const colorSpace of COLOR_SPACES) {
    try {
      // Test with color() function
      results[colorSpace] = window.CSS.supports(
        "color",
        `color(${colorSpace} 1 0 0)`
      );
    } catch {
      results[colorSpace] = false;
    }
  }

  return results;
}

/**
 * Test animation and transition support
 */
function testAnimations(): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  const testElement = createTestElement();

  if (!testElement) return results;

  try {
    document.body.appendChild(testElement);

    const animationProperties = [
      "animation",
      "animationName",
      "animationDuration",
      "animationTimingFunction",
      "animationDelay",
      "animationIterationCount",
      "animationDirection",
      "animationFillMode",
      "animationPlayState",
      "transition",
      "transitionProperty",
      "transitionDuration",
      "transitionTimingFunction",
      "transitionDelay",
      "transform",
      "transformOrigin",
      "transformStyle",
      "perspective",
      "perspectiveOrigin",
      "backfaceVisibility",
    ];

    for (const property of animationProperties) {
      try {
        results[property] = property in testElement.style;
      } catch {
        results[property] = false;
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing animations
  }

  return results;
}

/**
 * Test layout method support
 */
function testLayoutMethods(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser() || !window.CSS || !window.CSS.supports) {
    return results;
  }

  const layoutTests = [
    ["flexbox", "display: flex"],
    ["grid", "display: grid"],
    ["subgrid", "grid-template-columns: subgrid"],
    ["contents", "display: contents"],
    ["flow-root", "display: flow-root"],
    ["sticky", "position: sticky"],
    ["multi-column", "column-count: 2"],
    ["writing-modes", "writing-mode: vertical-rl"],
    ["logical-properties", "margin-inline-start: 1px"],
    ["aspect-ratio", "aspect-ratio: 16/9"],
    ["container-queries", "container-type: inline-size"],
  ];

  for (const [name, test] of layoutTests) {
    try {
      results[name] = window.CSS.supports(test);
    } catch {
      results[name] = false;
    }
  }

  return results;
}

/**
 * Test CSS selector support
 */
function testSelectors(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser()) return results;

  for (const selector of CSS_SELECTORS) {
    try {
      document.querySelector(selector);
      results[selector] = true;
    } catch {
      results[selector] = false;
    }
  }

  return results;
}

/**
 * Test pseudo-element support
 */
function testPseudoElements(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser()) return results;

  for (const pseudoElement of PSEUDO_ELEMENTS) {
    try {
      // Try to create a style rule with the pseudo-element
      const testSelector = `div${pseudoElement}`;
      document.querySelector(testSelector);
      results[pseudoElement] = true;
    } catch {
      results[pseudoElement] = false;
    }
  }

  return results;
}

/**
 * Test pseudo-class support
 */
function testPseudoClasses(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser()) return results;

  const pseudoClasses = [
    ":hover",
    ":focus",
    ":active",
    ":visited",
    ":link",
    ":checked",
    ":disabled",
    ":enabled",
    ":first-child",
    ":last-child",
    ":nth-child(1)",
    ":empty",
    ":target",
    ":focus-within",
    ":focus-visible",
    ":valid",
    ":invalid",
    ":in-range",
    ":out-of-range",
    ":required",
    ":optional",
  ];

  for (const pseudoClass of pseudoClasses) {
    try {
      document.querySelector(`div${pseudoClass}`);
      results[pseudoClass] = true;
    } catch {
      results[pseudoClass] = false;
    }
  }

  return results;
}

/**
 * Test at-rule support
 */
function testAtRules(): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  if (!isBrowser() || !window.CSS || !window.CSS.supports) {
    return results;
  }

  for (const atRule of AT_RULES) {
    try {
      // Test basic support for at-rules
      results[atRule] = true; // Basic assumption, could be enhanced
    } catch {
      results[atRule] = false;
    }
  }

  return results;
}

/**
 * Get CSS values for specific properties
 */
function getCSSValues(): Record<string, string> {
  const results: Record<string, string> = {};
  const testElement = createTestElement();

  if (!testElement) return results;

  try {
    document.body.appendChild(testElement);

    const valuesToTest = [
      "initial",
      "inherit",
      "unset",
      "revert",
      "revert-layer",
    ];

    for (const value of valuesToTest) {
      try {
        testElement.style.color = value;
        results[value] = testElement.style.color;
        testElement.style.color = "";
      } catch {
        results[value] = "";
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error testing CSS values
  }

  return results;
}

/**
 * Detect vendor prefixes in use
 */
function detectVendorPrefixes(): string[] {
  const detected: string[] = [];
  const testElement = createTestElement();

  if (!testElement) return detected;

  try {
    document.body.appendChild(testElement);

    for (const prefix of VENDOR_PREFIXES) {
      try {
        const property = `${prefix}transform`;
        const camelCase = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );

        if (camelCase in testElement.style) {
          detected.push(prefix);
        }
      } catch {
        // Prefix not supported
      }
    }

    document.body.removeChild(testElement);
  } catch {
    // Error detecting vendor prefixes
  }

  return detected.sort();
}

/**
 * Main CSS fingerprinting function
 */
export function collectCSSFingerprint(): CSSFingerprint {
  if (!isBrowser()) {
    return {
      isSupported: false,
      mediaQueries: {},
      cssFeatures: {},
      computedStyles: {},
      cssProperties: {},
      browserExtensions: {},
      cssUnits: {},
      colorSpaces: {},
      animations: {},
      layoutMethods: {},
      selectors: {},
      pseudoElements: {},
      pseudoClasses: {},
      atRules: {},
      cssValues: {},
      vendorPrefixes: [],
      entropy: 0,
    };
  }

  return safeFeatureDetect(
    (): CSSFingerprint => {
      const mediaQueries = testMediaQueries();
      const cssFeatures = testCSSFeatures();
      const computedStyles = testComputedStyles();
      const cssProperties = testCSSProperties();
      const browserExtensions = testBrowserExtensions();
      const cssUnits = testCSSUnits();
      const colorSpaces = testColorSpaces();
      const animations = testAnimations();
      const layoutMethods = testLayoutMethods();
      const selectors = testSelectors();
      const pseudoElements = testPseudoElements();
      const pseudoClasses = testPseudoClasses();
      const atRules = testAtRules();
      const cssValues = getCSSValues();
      const vendorPrefixes = detectVendorPrefixes();

      // Calculate entropy
      const combinedData = JSON.stringify({
        mediaQueries,
        cssFeatures,
        computedStyles,
        cssProperties,
        browserExtensions,
        cssUnits,
        colorSpaces,
        animations,
        layoutMethods,
        selectors,
        pseudoElements,
        pseudoClasses,
        atRules,
        cssValues,
        vendorPrefixes,
      });

      const entropy = new Set(combinedData).size / combinedData.length;

      return {
        isSupported: true,
        mediaQueries,
        cssFeatures,
        computedStyles,
        cssProperties,
        browserExtensions,
        cssUnits,
        colorSpaces,
        animations,
        layoutMethods,
        selectors,
        pseudoElements,
        pseudoClasses,
        atRules,
        cssValues,
        vendorPrefixes,
        entropy: Math.round(entropy * 1000) / 1000,
      };
    },
    {
      isSupported: false,
      mediaQueries: {},
      cssFeatures: {},
      computedStyles: {},
      cssProperties: {},
      browserExtensions: {},
      cssUnits: {},
      colorSpaces: {},
      animations: {},
      layoutMethods: {},
      selectors: {},
      pseudoElements: {},
      pseudoClasses: {},
      atRules: {},
      cssValues: {},
      vendorPrefixes: [],
      entropy: 0,
    } as CSSFingerprint
  );
}
