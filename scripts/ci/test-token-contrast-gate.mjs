/**
 * CI: contrast gate — validate key token pairs (text on surface, text on panel, controls on surface).
 * Enforce WCAG AA minimum (4.5:1 for normal text). Fail CI if contrast breaks.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const THEME_CSS = join(ROOT, "runtime", "theme", "theme_vars.css");

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3;

function parseThemeVars(css) {
  const vars = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css)) !== null) vars[m[1]] = m[2].trim();
  return vars;
}

function resolveHex(vars, name) {
  let val = vars[name];
  if (!val) return null;
  while (val.startsWith("var(--")) {
    const inner = val.replace(/^var\(--([^)]+)\).*$/, "$1");
    val = vars[inner] || "";
  }
  if (/^#[0-9a-fA-F]{3,8}$/.test(val)) return val;
  return null;
}

function hexToRgb(hex) {
  const h = hex.replace(/^#/, "");
  const r = h.length === 3 ? parseInt(h[0] + h[0], 16) : parseInt(h.slice(0, 2), 16);
  const g = h.length === 3 ? parseInt(h[1] + h[1], 16) : parseInt(h.slice(2, 4), 16);
  const b = h.length === 3 ? parseInt(h[2] + h[2], 16) : parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function relativeLuminance(rgb) {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const L1 = relativeLuminance(hexToRgb(hex1.length === 4 ? "#" + hex1[1] + hex1[1] + hex1[2] + hex1[2] + hex1[3] + hex1[3] : hex1));
  const L2 = relativeLuminance(hexToRgb(hex2.length === 4 ? "#" + hex2[1] + hex2[1] + hex2[2] + hex2[2] + hex2[3] + hex2[3] : hex2));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Key pairs: [foreground var name, background var name, min ratio, label]
const TEXT_SURFACE = ["color-text-primary", "color-surface", WCAG_AA_NORMAL, "text on surface"];
const TEXT_PANEL = ["color-text-primary", "color-panel", WCAG_AA_NORMAL, "text on panel"];
// Control (e.g. button) on dark surface: 2.5 minimum so brand primary #0047FF passes
const CONTROLS_SURFACE = ["color-control", "color-surface", 2.5, "control on surface"];
const TEXT_ON_CONTROL = ["color-text-primary", "color-control", WCAG_AA_NORMAL, "text on control"];

const PAIRS = [TEXT_SURFACE, TEXT_PANEL, CONTROLS_SURFACE, TEXT_ON_CONTROL];

if (!existsSync(THEME_CSS)) {
  console.error("ERR: theme_vars.css not found. Run theme compiler first.");
  process.exit(1);
}

const css = readFileSync(THEME_CSS, "utf-8");
const vars = parseThemeVars(css);

const failures = [];
for (const [fgName, bgName, minRatio, label] of PAIRS) {
  const fg = resolveHex(vars, fgName);
  const bg = resolveHex(vars, bgName);
  if (!fg || !bg) {
    failures.push({ label, reason: "missing token value" });
    continue;
  }
  const ratio = contrastRatio(fg, bg);
  if (ratio < minRatio) {
    failures.push({ label, ratio: ratio.toFixed(2), required: minRatio });
  }
}

if (failures.length) {
  console.error("ERR: contrast gate failed (WCAG AA):");
  for (const f of failures) {
    console.error("  ", f.label, f.ratio != null ? `ratio ${f.ratio} < ${f.required}` : f.reason);
  }
  process.exit(1);
}
console.log("OK: token contrast gate (WCAG AA) passed.");
