#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

OUT_DIR="dist/cp"
echo "[cp:bundle:verify] scanning $OUT_DIR ..."

# Find latest tgz
TARBALL="$(ls -1t "$OUT_DIR"/CP_BUNDLE_*.tgz 2>/dev/null | head -n 1 || true)"
if [ -z "${TARBALL:-}" ]; then
  echo "[cp:bundle:verify][FAIL] no CP_BUNDLE_*.tgz found in $OUT_DIR"
  exit 1
fi

SHA_FILE="${TARBALL}.sha256"
if [ ! -f "$SHA_FILE" ]; then
  echo "[cp:bundle:verify][FAIL] missing checksum file: $SHA_FILE"
  exit 1
fi

# Verify sha256
want="$(cat "$SHA_FILE" | tr -d '[:space:]')"
got="$(shasum -a 256 "$TARBALL" | awk '{print $1}')"
if [ "$want" != "$got" ]; then
  echo "[cp:bundle:verify][FAIL] sha256 mismatch"
  echo "  want: $want"
  echo "   got: $got"
  exit 1
fi
echo "[cp:bundle:verify][OK] sha256 match: $got"

# Find latest manifest
MANIFEST="$(ls -1t "$OUT_DIR"/CP_BUNDLE_MANIFEST_*.json 2>/dev/null | head -n 1 || true)"
if [ -z "${MANIFEST:-}" ]; then
  echo "[cp:bundle:verify][FAIL] no CP_BUNDLE_MANIFEST_*.json found in $OUT_DIR"
  exit 1
fi

# Minimal manifest checks (marker + artifacts array)
node - <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const outDir = "dist/cp";
const mf = fs.readdirSync(outDir).filter(n => n.startsWith("CP_BUNDLE_MANIFEST_") && n.endsWith(".json")).sort().pop();
if (!mf) { console.error("[cp:bundle:verify][FAIL] manifest missing"); process.exit(1); }
const p = path.join(outDir, mf);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

if (j.marker !== "ICONTROL_CP_BUNDLE_MANIFEST_V1") {
  console.error("[cp:bundle:verify][FAIL] bad marker:", j.marker);
  process.exit(1);
}
if (typeof j.ts !== "number") {
  console.error("[cp:bundle:verify][FAIL] ts must be number");
  process.exit(1);
}
if (!Array.isArray(j.artifacts)) {
  console.error("[cp:bundle:verify][FAIL] artifacts must be array");
  process.exit(1);
}
const required = ["bundle/cp_src.tar.gz", "docs/CP_COMPLIANCE_REPORT.md", "package.json"];
for (const r of required) {
  if (!j.artifacts.some(a => a && a.path === r)) {
    console.error("[cp:bundle:verify][FAIL] missing artifact in manifest:", r);
    process.exit(1);
  }
}
console.log("[cp:bundle:verify][OK] manifest:", mf, "artifacts:", j.artifacts.length);
NODE

echo "[cp:bundle:verify][OK] bundle verified: $(basename "$TARBALL")"
