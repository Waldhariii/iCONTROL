#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

ts="$(date +%Y%m%d_%H%M%S)"
OUT="_artifacts/release/rc_${ts}"
mkdir -p "$OUT"

echo "[rc] repo=$REPO"
echo "[rc] out=$OUT"

# 0) Hard fail if working tree dirty
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERR_RC_DIRTY_WORKTREE: working tree must be clean" >&2
  git status -sb >&2 || true
  exit 2
fi

# 1) Hard gates first (fast)
npm run -s gate:root-clean
npm run -s gate:release-rc-artifacts
npm run -s gate:release-artifacts-location
npm run -s verify:prod:fast
npm run -s test
npm run -s gate:preflight:prod

# 2) Build outputs must be under _artifacts only (already enforced by gates)
npm run -s build:app
npm run -s build:cp

# 3) Export tenant runtime snapshot (public tenant) into RC bundle
# (uses existing diagnostics script; fail-closed if missing)
if [[ -f "scripts/diagnostics/export-tenant-runtime.mjs" ]]; then
  node scripts/diagnostics/export-tenant-runtime.mjs --tenant public --out "${OUT}/tenant_runtime_public.json"
else
  echo "ERR_RC_MISSING_EXPORT: scripts/diagnostics/export-tenant-runtime.mjs not found" >&2
  exit 3
fi

# 4) Release bundle manifest (minimal, deterministic)
node - <<NODE
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function sh(cmd){
  return cp.execSync(cmd,{encoding:"utf8"}).trim();
}

const ts = process.env.RC_TS || new Date().toISOString();
const head = sh("git rev-parse HEAD");
const branch = sh("git rev-parse --abbrev-ref HEAD");
const nodev = sh("node -v");
const npmv = sh("npm -v");

const out = process.argv[2];
const m = {
  schemaVersion: 1,
  kind: "release_candidate",
  createdAt: ts,
  head,
  branch,
  toolchain: { node: nodev, npm: npmv },
  artifacts: {
    dist_app: "_artifacts/dist/app",
    dist_cp: "_artifacts/dist/cp",
    tenant_runtime_public: "tenant_runtime_public.json"
  }
};

fs.writeFileSync(path.join(out,"rc.manifest.json"), JSON.stringify(m,null,2)+"\n");
console.log("[rc] wrote rc.manifest.json");
NODE "$OUT"

# 5) Tag (local) — do NOT push automatically
TAG="rc_${ts}"
git tag -a "$TAG" -m "Release Candidate $TAG"
echo "[rc] tagged: $TAG"

echo "OK: RC complete"
echo "OUT: $OUT"
echo "TAG: $TAG"
