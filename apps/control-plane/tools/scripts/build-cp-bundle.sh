#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

OUT_DIR="dist/cp"
STAMP="$(date +%Y%m%d_%H%M%S)"
PKG_VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo '0.0.0')"

mkdir -p "$OUT_DIR" "$OUT_DIR/bundle" "$OUT_DIR/docs"

echo "[cp:bundle] clean out..."
rm -rf "$OUT_DIR/bundle" "$OUT_DIR/docs" "$OUT_DIR"/*.tgz "$OUT_DIR"/*.sha256 "$OUT_DIR"/CP_BUNDLE_MANIFEST*.json "$OUT_DIR"/package.json "$OUT_DIR"/package-lock.json || true
mkdir -p "$OUT_DIR/bundle" "$OUT_DIR/docs"

echo "[cp:bundle] stage root metadata into dist/cp..."
cp -f "package.json" "$OUT_DIR/package.json"
if [ -f "package-lock.json" ]; then cp -f "package-lock.json" "$OUT_DIR/package-lock.json"; fi
if [ -f "docs/CP_COMPLIANCE_REPORT.md" ]; then cp -f "docs/CP_COMPLIANCE_REPORT.md" "$OUT_DIR/docs/CP_COMPLIANCE_REPORT.md"; fi

echo "[cp:bundle] collect artifacts (strict allowlist) into bundle/cp_src.tar.gz..."
# NOTE: on reste volontairement conservateur pour éviter d’embarquer backups / déchets
tar -C . -cf "$OUT_DIR/bundle/cp_src.tar" \
  src/surfaces/cp \
  src/surfaces/cp/_shared \
  src/core/policies \
  src/core/ssot \
  src/dev \
  src/router.ts \
  docs/CP_COMPLIANCE_REPORT.md \
  package.json \
  package-lock.json 2>/dev/null || true
gzip -f "$OUT_DIR/bundle/cp_src.tar"

echo "[cp:bundle] manifest..."
MANIFEST="$OUT_DIR/CP_BUNDLE_MANIFEST_${PKG_VERSION}_${STAMP}.json"
node - <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const outDir = "dist/cp";
const files = [
  "bundle/cp_src.tar.gz",
  "docs/CP_COMPLIANCE_REPORT.md",
  "src/router.ts",           // path relatif dans le tarball (sera depuis root via stage ci-dessous)
  "package.json",
  "package-lock.json",
];

function sha256File(p) {
  const b = fs.readFileSync(p);
  return crypto.createHash("sha256").update(b).digest("hex");
}

const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
const ver = pkg.version || "0.0.0";

// On calcule le manifest sur les fichiers réellement présents sous dist/cp (staged)
const staged = [
  { rel: "bundle/cp_src.tar.gz", abs: path.join(outDir, "bundle/cp_src.tar.gz") },
  { rel: "docs/CP_COMPLIANCE_REPORT.md", abs: path.join(outDir, "docs/CP_COMPLIANCE_REPORT.md") },
  { rel: "package.json", abs: path.join(outDir, "package.json") },
  { rel: "package-lock.json", abs: path.join(outDir, "package-lock.json") },
].filter(x => fs.existsSync(x.abs))
 .map(x => ({ path: x.rel, bytes: fs.statSync(x.abs).size, sha256: sha256File(x.abs) }));

const manifest = {
  marker: "ICONTROL_CP_BUNDLE_MANIFEST_V1",
  ts: Date.now(),
  version: ver,
  artifacts: staged,
};

const out = path.join(outDir, `CP_BUNDLE_MANIFEST_${ver}_${Date.now()}.json`);
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log("Wrote:", out);
NODE

echo "[cp:bundle] tarball deliverable..."
TARBALL="$OUT_DIR/CP_BUNDLE_${PKG_VERSION}_${STAMP}.tgz"

# build file list from inside OUT_DIR so glob expands correctly
(
  cd "$OUT_DIR" || exit 1
  files=(bundle docs package.json)
  [ -f "package-lock.json" ] && files+=(package-lock.json)
  mf=(CP_BUNDLE_MANIFEST_*.json)
  [ -e "${mf[0]:-}" ] && files+=(CP_BUNDLE_MANIFEST_*.json)

  tar -czf "$(basename "$TARBALL")" "${files[@]}"
)

echo "[cp:bundle] checksum..."
shasum -a 256 "$TARBALL" | awk '{print $1}' > "$TARBALL.sha256"

echo "[cp:bundle][OK] $TARBALL"
echo "[cp:bundle][OK] checksum: $(cat "$TARBALL.sha256")"
