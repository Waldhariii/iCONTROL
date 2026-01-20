/**
 * Governance layer integrity check (external, read-only)
 * - Verifies presence + minimal structure
 * - Does NOT import app runtime
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const gov = path.join(root, "governance");

const required = [
  "manifest.json",
  "proofs/governance.score.json",
  "proofs/integrity.lock",
  "hooks/audit_snapshot.sh",
  "product/product_overview.md",
  "ops/rollout_90d.md",
];

function fail(msg) {
  console.error("[FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(gov)) fail("missing governance/ directory");

for (const rel of required) {
  const p = path.join(gov, rel);
  if (!fs.existsSync(p)) fail("missing: " + rel);
}

const manifest = JSON.parse(fs.readFileSync(path.join(gov, "manifest.json"), "utf8"));
if (manifest.intrusive !== false) fail("manifest.intrusive must be false");
if (manifest.core_dependency !== false) fail("manifest.core_dependency must be false");

console.log("[OK] governance layer present + non-intrusive flags verified.");
