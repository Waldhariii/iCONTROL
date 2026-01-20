/**
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 *
 * Rule (WARN_ONLY for now):
 * - 'created_at:' must NOT appear in governed files.
 * - Exception: allow in files ending with '.disabled' (legacy snapshots).
 *
 * Exit codes:
 * 0: OK (or WARN_ONLY findings)
 * 1: Hard failure (reserved for future STRICT mode)
 */
const fs = require("fs");
const path = require("path");

function walk(dir, out) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
}

function isTextFile(p) {
  // cheap filter
  const ex = path.extname(p).toLowerCase();
  return [".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".sh", ".zsh", ".css", ".txt"].includes(ex);
}

const root = process.cwd();
const files = [];
walk(root, files);

const hits = [];
for (const f of files) {
  if (!isTextFile(f)) continue;
  if (f.includes(`${path.sep}node_modules${path.sep}`)) continue;
  const rel = path.relative(root, f);
  let s;
  try { s = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (!s.includes("created_at:")) continue;

  // Allow exceptions
  if (rel.endsWith(".disabled")) continue;

  // Hit: created_at outside allowed exception
  const lines = s.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("created_at:")) {
      hits.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
    }
  }
}

if (hits.length === 0) {
  console.log("[OK] created_at governance: no violations (outside *.disabled).");
  process.exit(0);
}

console.log("[WARN_ONLY] created_at governance violations detected (outside *.disabled):");
for (const h of hits.slice(0, 200)) console.log(" -", h);
if (hits.length > 200) console.log(` ... (+${hits.length - 200} more)`);

// WARN_ONLY: do not fail yet
process.exit(0);
