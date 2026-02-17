/**
 * Color engine: parse hex, normalize, convert to HSL/OKLCH, generate scale 50..950 and states.
 * No hardcoded palettes — all derived from base color(s).
 */

const HEX_3 = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
const HEX_6 = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
const HEX_8 = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;

/**
 * Parse any valid hex (#RGB, #RRGGBB, #RRGGBBAA). Returns { r, g, b } 0–255 or null.
 * Alpha is ignored for palette generation.
 */
export function parseHex(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return null;
  const s = hex.slice(1).trim();
  let r, g, b;
  const m3 = s.match(/^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  const m6 = s.match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  const m8 = s.match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (m3) {
    r = parseInt(m3[1] + m3[1], 16);
    g = parseInt(m3[2] + m3[2], 16);
    b = parseInt(m3[3] + m3[3], 16);
  } else if (m6 || m8) {
    const parts = (m6 || m8);
    r = parseInt(parts[1], 16);
    g = parseInt(parts[2], 16);
    b = parseInt(parts[3], 16);
  } else return null;
  return { r, g, b };
}

/**
 * Normalize to #RRGGBB (lowercase).
 */
export function normalizeHex(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const pad = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + pad(rgb.r) + pad(rgb.g) + pad(rgb.b);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHex(r, g, b) {
  const pad = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + pad(r) + pad(g) + pad(b);
}

/**
 * Generate scale 50..950 from a single base hex. Base is placed at 500.
 * Uses HSL: fixed hue/saturation, lightness steps. No hardcoded palette.
 */
export function generateScale(baseColor) {
  const rgb = parseHex(baseColor);
  if (!rgb) return null;
  const { h, s, l: baseL } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const steps = {
    50: 98, 100: 95, 200: 90, 300: 82, 400: 70, 500: baseL,
    600: 52, 700: 42, 800: 32, 900: 22, 950: 14,
  };
  const out = {};
  const baseHex = normalizeHex(baseColor);
  for (const [key, light] of Object.entries(steps)) {
    if (key === "500") {
      out[key] = baseHex;
      continue;
    }
    const { r, g, b } = hslToRgb(h, s, light);
    out[key] = rgbToHex(r, g, b);
  }
  return out;
}

/**
 * Generate hover/active/focus/disabled variants from a scale (e.g. for primary control).
 * Uses scale entries; disabled uses gray-like contrast reduction in practice via semantic tokens.
 */
export function generateStates(scale) {
  if (!scale || typeof scale !== "object") return {};
  const get = (key) => scale[key] || scale["500"];
  return {
    default: get("500"),
    hover: get("600"),
    active: get("700"),
    focus: get("500"),
    disabled: get("400"),
  };
}

/**
 * Full brand output: scale 50..950 plus optional primary alias.
 * Shape: { brand: { "50":"#...", ..., "950":"#...", primary: "#..." } }
 */
export function buildBrandPalette(brandSource = {}) {
  const primaryHex = brandSource.brand_primary || brandSource.brand_secondary || "#0047FF";
  const scale = generateScale(primaryHex);
  if (!scale) return { brand: {} };
  return {
    brand: {
      ...scale,
      primary: scale["500"],
      ...(brandSource.brand_secondary ? { secondary: normalizeHex(brandSource.brand_secondary) } : {}),
    },
  };
}
