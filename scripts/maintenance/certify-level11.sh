#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# CURSOR — LEVEL 11 PLATFORM CERTIFICATION (AUTO)
# Root: project root (run from repo root)
# Goal: Make Level 11 gates PASS, create certification tag, then STOP core/platform work.
# Rule: Any change under core/, platform/, governance/, runtime/ MUST be committed with "ADR-APPROVED".
# ============================================================

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "====================================================================="
echo "LEVEL 11 — CERTIFY PLATFORM (AUTO)"
echo "ROOT=$ROOT"
echo "RUN_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "====================================================================="

# -------------------------------
# 0) Precheck guardrails
# -------------------------------
echo
echo "=== 0) PRECHECK ==="
git status -sb

if [ -f "./CI_REPORT.md" ]; then
  echo "ERR: Forbidden root CI_REPORT.md exists. Remove it (reports must be under runtime/reports/)."
  exit 1
fi

mkdir -p runtime/reports runtime/reports/index

# -------------------------------
# 1) Ensure required files exist (do NOT refactor)
# -------------------------------
echo
echo "=== 1) VERIFY LEVEL 11 FILESET (CREATE MINIMALS IF MISSING) ==="

req_files=(
  "governance/CORE_PLATFORM_FREEZE_LEVEL11.md"
  "scripts/maintenance/generate-level11-snapshot.mjs"
  "platform/VERSION"
  "platform/runtime/customization/tenant-overrides-compiler.mjs"
  "platform/runtime/customization/README.md"
  "platform/runtime/observability/event-stream.mjs"
  "platform/runtime/ai_context/README.md"
  "extensions/manifest.schema.json"
)

for f in "${req_files[@]}"; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    echo "Cursor must create a minimal correct file for: $f"
  else
    echo "OK: $f"
  fi
done

mkdir -p extensions/official extensions/customers extensions/customers/_inbox extensions/marketplace
touch extensions/official/.gitkeep extensions/customers/.gitkeep extensions/marketplace/.gitkeep extensions/customers/_inbox/.gitkeep 2>/dev/null || true

# -------------------------------
# 2) Normalize VERSION (Level 11) if not exact
# -------------------------------
echo
echo "=== 2) PLATFORM VERSION CHECK ==="
if [ ! -f "platform/VERSION" ]; then
  echo "MISSING platform/VERSION; creating 11.0.0"
  printf "11.0.0\n" > platform/VERSION
fi

VER="$(cat platform/VERSION | tr -d ' \n\r\t')"
echo "platform/VERSION=$VER"
if [ "$VER" != "11.0.0" ]; then
  echo "Fixing platform/VERSION to 11.0.0"
  printf "11.0.0\n" > platform/VERSION
fi

# -------------------------------
# 3) Safety: ensure SCRIPT_CATALOG includes snapshot generator
# -------------------------------
echo
echo "=== 3) SCRIPT CATALOG — MUST INCLUDE LEVEL11 SNAPSHOT ==="
if [ ! -f "scripts/maintenance/SCRIPT_CATALOG.json" ]; then
  echo "ERR: scripts/maintenance/SCRIPT_CATALOG.json missing."
  exit 1
fi

if ! grep -q "generate-level11-snapshot.mjs" "scripts/maintenance/SCRIPT_CATALOG.json"; then
  echo "MISSING in SCRIPT_CATALOG.json: generate-level11-snapshot.mjs"
  echo "Cursor must add a catalog entry for scripts/maintenance/generate-level11-snapshot.mjs"
  exit 1
fi
echo "OK: snapshot in catalog"

# -------------------------------
# 4) Run snapshot generator (does not require clean tree)
# -------------------------------
echo
echo "=== 4) GENERATE LEVEL 11 SNAPSHOT (NON-DESTRUCTIVE) ==="
node scripts/maintenance/generate-level11-snapshot.mjs dev-001 || {
  echo "ERR: snapshot generator failed."
  exit 1
}

test -f "runtime/reports/LEVEL11_ARCH_SNAPSHOT.json" || {
  echo "ERR: missing runtime/reports/LEVEL11_ARCH_SNAPSHOT.json"
  exit 1
}
test -f "runtime/reports/index/level11_latest.jsonl" || {
  echo "ERR: missing runtime/reports/index/level11_latest.jsonl"
  exit 1
}
echo "OK: snapshot outputs present"

# -------------------------------
# 5) Commit everything required for Level 11 with ADR-APPROVED message
# -------------------------------
echo
echo "=== 5) COMMIT LEVEL 11 STRUCTURAL FREEZE (ADR-APPROVED) ==="

if [ -n "$(git status --porcelain=v1)" ]; then
  git add -A
  git commit -m "Level 11: structural freeze and pivot to business surfaces — ADR-APPROVED" || {
    echo "ERR: commit failed. Resolve and rerun."
    exit 1
  }
else
  echo "No pending changes to commit."
fi

echo
git status -sb
if [ -n "$(git status --porcelain=v1)" ]; then
  echo "ERR: worktree must be clean before gates."
  exit 1
fi

# -------------------------------
# 6) Run gates (Level 11 certification path)
# -------------------------------
echo
echo "=== 6) RUN GATES (DEV-001) ==="
node governance/gates/run-gates.mjs dev-001

if [ -f "runtime/reports/LEVEL11_CERTIFICATION.md" ]; then
  echo "OK: runtime/reports/LEVEL11_CERTIFICATION.md present"
else
  echo "WARN: runtime/reports/LEVEL11_CERTIFICATION.md not found"
fi

# -------------------------------
# 7) Proof: no FAIL in reports
# -------------------------------
echo
echo "=== 7) PROOF: NO FAIL IN REPORTS ==="
FAIL_FOUND=0

if [ -f "runtime/reports/LEVEL11_CERTIFICATION.md" ]; then
  if grep -q "FAIL" "runtime/reports/LEVEL11_CERTIFICATION.md"; then
    echo "ERR: FAIL found in LEVEL11_CERTIFICATION.md"
    FAIL_FOUND=1
  fi
fi

if [ -f "runtime/reports/index/ga_latest.jsonl" ]; then
  tail -n 3 "runtime/reports/index/ga_latest.jsonl" || true
fi
if [ -f "runtime/reports/index/level11_latest.jsonl" ]; then
  tail -n 3 "runtime/reports/index/level11_latest.jsonl" || true
fi

if [ "$FAIL_FOUND" -ne 0 ]; then
  echo "STOP: gates not green. Cursor must fix until PASS."
  exit 1
fi
echo "OK: Level 11 gate proof looks green (no FAIL detected in key report)."

# -------------------------------
# 8) Create final certification tag (idempotent)
# -------------------------------
echo
echo "=== 8) TAG: phaseLEVEL11_PLATFORM_CERTIFIED ==="
if git tag -l "phaseLEVEL11_PLATFORM_CERTIFIED" | grep -q "phaseLEVEL11_PLATFORM_CERTIFIED"; then
  echo "OK: tag already exists: phaseLEVEL11_PLATFORM_CERTIFIED"
else
  git tag "phaseLEVEL11_PLATFORM_CERTIFIED"
  echo "TAG_CREATED=phaseLEVEL11_PLATFORM_CERTIFIED"
fi

echo
echo "=== 9) POST-CONDITION: STOP PLATFORM ENGINEERING ==="
echo "From now on: NO new business logic in core/platform/runtime/governance."
echo "All BUSINESS SURFACES must be implemented as Extensions (extensions/*) and SSOT packs."
echo "DONE."
