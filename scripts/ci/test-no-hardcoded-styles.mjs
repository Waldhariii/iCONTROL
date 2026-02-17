/**
 * Token hard-code gate: fail if hex colors, rgb(), inline styles outside design-system.
 * No hardcoded colors anywhere. Tokens ONLY.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = [join(ROOT, "apps"), join(ROOT, "extensions"), join(ROOT, "platform"), join(ROOT, "design-system")];

/** Raw colors allowed ONLY in these paths. Fail everywhere else. */
const ALLOWED_RAW_COLOR_PREFIXES = [
  "design-system/color-engine/",
  "design-system/tokens/",
  "design-system/compiler/",
  "runtime/theme/",
];
/** Generated theme outputs (theme_vars*.css) under runtime/platform are allowed. */
function isGeneratedThemeOutput(norm) {
  return (norm.includes("/theme_vars") || norm.includes("theme_vars.")) && (norm.startsWith("runtime/") || norm.startsWith("platform/runtime/"));
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /rgb\s*\(/g;
const RGBA = /rgba\s*\(/g;
const INLINE_STYLE = /style\s*=\s*["']/g;

function collectFiles(dir, exts, out = []) {
  try {
    if (!statSync(dir).isDirectory()) return out;
  } catch {
    return out;
  }
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    try {
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name !== "node_modules" && name !== ".git") collectFiles(full, exts, out);
      } else if (exts.some((e) => name.endsWith(e))) out.push(full);
    } catch {}
  }
  return out;
}

function isAllowedRawColor(filePath) {
  const norm = filePath.replace(ROOT + "/", "").replace(/\\/g, "/");
  if (ALLOWED_RAW_COLOR_PREFIXES.some((p) => norm.startsWith(p))) return true;
  if (isGeneratedThemeOutput(norm)) return true;
  return false;
}

const violations = [];
for (const dir of SCAN_DIRS) {
  if (!existsSync(dir)) continue;
  const files = collectFiles(dir, [".css", ".html", ".js", ".mjs", ".ts", ".tsx", ".vue"]);
  for (const file of files) {
    if (isAllowedRawColor(file)) continue;
    const content = readFileSync(file, "utf-8");
    const rel = file.replace(ROOT + "/", "").replace(/\\/g, "/");
    if (HEX.test(content)) violations.push({ file: rel, kind: "hex color" });
    if (RGB.test(content)) violations.push({ file: rel, kind: "rgb()" });
    if (RGBA.test(content)) violations.push({ file: rel, kind: "rgba()" });
    if (INLINE_STYLE.test(content)) violations.push({ file: rel, kind: "inline style" });
  }
}

const seen = new Set();
const unique = violations.filter((v) => {
  const k = v.file + ":" + v.kind;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

if (unique.length) {
  console.error("ERR: hardcoded styles outside design-system (tokens only):");
  for (const { file, kind } of unique) console.error("  ", file, "—", kind);
  process.exit(1);
}
console.log("OK: no hardcoded colors/rgb/inline styles outside color-engine/tokens/compiler/runtime-theme.");
