import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PAGES = path.join(ROOT, "apps/control-plane/src/pages");

const allowedPatterns = [
  /LEGACY SHIM/,
  /export\s+\*\s+from\s+["'][^"']+(surfaces|platform)\//,
  /export\s+\{\s*default\s*\}\s+from\s+["'][^"']+(surfaces|platform)\//,
];

function isShimOnly(content) {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.some(l => /LEGACY SHIM/.test(l))) return false;

  return lines.every(l =>
    l.startsWith("/**") ||
    l.startsWith("*") ||
    l.startsWith("*/") ||
    allowedPatterns.some(r => r.test(l))
  );
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

if (fs.existsSync(PAGES)) {
  const files = walk(PAGES);
  const offenders = [];

  for (const f of files) {
    const content = fs.readFileSync(f, "utf8");
    if (!isShimOnly(content)) offenders.push(path.relative(ROOT, f));
  }

  if (offenders.length) {
    console.error("FAIL: legacy pages contain non-shim content:");
    offenders.forEach(o => console.error(" -", o));
    process.exit(1);
  }
}

console.log("OK: legacy pages are shim-only.");
