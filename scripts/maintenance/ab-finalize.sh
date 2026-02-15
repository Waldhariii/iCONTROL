#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT"

echo "====================================================================="
echo "AB FINALIZE — CLEAN WORKTREE + CI FULL PASS + OPTIONAL PATCH TAG"
echo "ROOT=$ROOT"
echo "====================================================================="

echo
echo "=== 0) Assert we're on the expected milestone tag ==="
git fetch --tags --quiet 2>/dev/null || true
git tag -l "phaseAB_studio_designer_complete_20260215_1605" | grep -q "phaseAB_studio_designer_complete_20260215_1605" \
  && echo "OK: AB tag exists" \
  || { echo "ERR: AB tag missing"; exit 1; }

echo
echo "=== 1) Preflight status (must be clean or explainable) ==="
git status -sb || true

echo
echo "=== 2) Identify uncommitted files precisely ==="
git status --porcelain=v1 || true

echo
echo "=== 3) Fix: ensure Designer AB1/AB2 UI is committed if still untracked/modified ==="
if git status --porcelain=v1 | grep -q "^ M apps/control-plane/public/app.js\|^?? apps/control-plane/public/app.js"; then
  echo "Detected pending changes in apps/control-plane/public/app.js — committing as AB patch."
  git add apps/control-plane/public/app.js
  git commit -m "phase AB: designer UI wiring (commit missing AB1/AB2)" || true
else
  echo "OK: no pending changes for apps/control-plane/public/app.js"
fi

echo
echo "=== 4) Enforce generated/runtime files are NOT tracked and do not dirty worktree ==="
cat > .gitignore.tmp <<'EOF'
# --- Generated / runtime reports (must not be committed) ---
governance/gates/gates-report.md
governance/gates/gates-report.json
runtime/reports/
platform/runtime/reports/
# --- Runtime ledgers / indices ---
platform/ssot/governance/audit_ledger.json
# --- pnpm store (local) ---
.pnpm-store/
EOF

touch .gitignore
while IFS= read -r line; do
  grep -Fqx "$line" .gitignore 2>/dev/null || echo "$line" >> .gitignore
done < .gitignore.tmp
rm -f .gitignore.tmp

# Stop tracking generated/runtime files so worktree can be clean
git rm --cached governance/gates/gates-report.md 2>/dev/null || true
git rm --cached governance/gates/gates-report.json 2>/dev/null || true
git rm --cached platform/ssot/governance/audit_ledger.json 2>/dev/null || true

echo
echo "=== 5) If .gitignore or index changed, commit as chore patch ==="
git add .gitignore 2>/dev/null || true
if ! git diff --cached --quiet 2>/dev/null; then
  git commit -m "chore: ignore and stop tracking generated reports and runtime ledgers" || true
else
  echo "OK: .gitignore and index unchanged"
fi

echo
echo "=== 6) Hard clean any generated files (do NOT delete SSOT; only generated outputs) ==="
rm -f governance/gates/gates-report.md governance/gates/gates-report.json 2>/dev/null || true

echo
echo "=== 7) Final worktree must be clean before CI ==="
git status -sb
if [ -n "$(git status --porcelain=v1)" ]; then
  echo "ERR: worktree not clean. Refusing to run CI."
  git status --porcelain=v1
  exit 1
fi

echo
echo "=== 8) Run full CI (single source of truth) ==="
node scripts/ci/ci-all.mjs

echo
echo "=== 9) Proof: CI report path and final tag plan ==="
test ! -f "./CI_REPORT.md" && echo "OK: no root CI_REPORT" || { echo "ERR: root CI_REPORT exists"; exit 1; }
test -f "./runtime/reports/CI_REPORT.md" && echo "OK: runtime CI_REPORT exists" || { echo "ERR: runtime CI_REPORT missing"; exit 1; }
tail -n 20 ./runtime/reports/CI_REPORT.md || true

echo
echo "=== 10) Optional patch tag if we created new commits ==="
BASE="$(git rev-list -n 1 phaseAB_studio_designer_complete_20260215_1605)"
HEAD="$(git rev-parse HEAD)"
if [ "$BASE" != "$HEAD" ]; then
  TS="$(date -u +%Y%m%d_%H%M)"
  TAG="phaseAB_studio_designer_complete_20260215_1605_p1_${TS}"
  git tag "$TAG"
  echo "Tagged patch: $TAG"
else
  echo "No new commits since AB tag; no patch tag created."
fi

echo
echo "=== 11) Final status ==="
git status -sb
git log -3 --oneline
git tag --list "phaseAB*" | tail -n 10
echo "DONE"
