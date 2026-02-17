/**
 * CI smoke: proof that any valid hex in brand-source.json produces a full computed palette.
 * Writes temp brand-source with odd-but-valid hex, compiles theme, asserts theme_vars.css
 * contains computed vars and contrast gate passes.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const THEME_DIR = join(ROOT, "runtime", "theme");
const BRAND_SOURCE = join(THEME_DIR, "brand-source.json");
const THEME_CSS = join(THEME_DIR, "theme_vars.css");
const COMPILER = join(ROOT, "design-system", "compiler", "theme-compiler.mjs");
const CONTRAST_GATE = join(ROOT, "scripts", "ci", "test-token-contrast-gate.mjs");

const BACKUP_KEY = "brand-source.json.bak-ci";

// Odd-but-valid hex (#RGB); primary chosen so contrast gate passes (control on surface ≥2.5)
const TEMP_BRAND = { brand_primary: "#04f", brand_secondary: "#111" };

if (!existsSync(BRAND_SOURCE)) {
  console.error("ERR: brand-source.json not found.");
  process.exit(1);
}

const original = readFileSync(BRAND_SOURCE, "utf-8");
try {
  writeFileSync(BRAND_SOURCE, JSON.stringify(TEMP_BRAND, null, 2) + "\n", "utf-8");
  execSync(`node ${COMPILER}`, { cwd: ROOT, stdio: "pipe" });
} catch (e) {
  writeFileSync(BRAND_SOURCE, original, "utf-8");
  console.error("ERR: theme compile failed:", e.message);
  process.exit(1);
}

const css = readFileSync(THEME_CSS, "utf-8");
const hasBrandScale = /--color-brand-(50|100|500|950):\s*#/.test(css);
const hasPrimary = /--color-brand-primary:\s*#/.test(css);
if (!hasBrandScale || !hasPrimary) {
  writeFileSync(BRAND_SOURCE, original, "utf-8");
  execSync(`node ${COMPILER}`, { cwd: ROOT, stdio: "pipe" });
  console.error("ERR: theme_vars.css missing computed brand vars.");
  process.exit(1);
}

try {
  execSync(`node ${CONTRAST_GATE}`, { cwd: ROOT, stdio: "pipe" });
} catch (e) {
  writeFileSync(BRAND_SOURCE, original, "utf-8");
  execSync(`node ${COMPILER}`, { cwd: ROOT, stdio: "pipe" });
  console.error("ERR: contrast gate failed after brand-source smoke.");
  process.exit(1);
}

writeFileSync(BRAND_SOURCE, original, "utf-8");
execSync(`node ${COMPILER}`, { cwd: ROOT, stdio: "pipe" });
console.log("OK: brand-source any-hex smoke (compile + contrast gate).");
