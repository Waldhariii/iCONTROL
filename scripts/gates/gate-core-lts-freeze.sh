#!/usr/bin/env bash
set -euo pipefail

# CORE LTS FREEZE — RFC-only enforcement
# If a commit modifies Core paths, it must also modify the RFC file in the same commit range.

RFC_FILE="governance/governance/docs/RFC_CORE_CHANGES.md"

# Core LTS scope (strict by default)
CORE_PATHS=(
  "core/kernel/"
  "core/kernel/shared/"
  "apps/control-plane/src/platform/"
  "apps/control-plane/src/core/"
  "runtime/configs/"
  "scripts/release/"
  "scripts/gates/"
)

# Resolve base for diff range (CI/PR-safe)
# Prefer merge-base with origin/main when available; fallback to HEAD~1.
BASE=""
if git show-ref --verify --quiet refs/remotes/origin/main; then
  BASE="$(git merge-base HEAD origin/main || true)"
fi
if [ -z "${BASE}" ]; then
  BASE="$(git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)"
fi

CHANGED="$(git diff --name-only "${BASE}..HEAD" || true)"

# No changes -> OK
if [ -z "${CHANGED}" ]; then
  echo "[gate][OK] core-lts-freeze: no changes in range ${BASE}..HEAD"
  exit 0
fi

core_hit=0
rfc_hit=0

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if [ "$f" = "$RFC_FILE" ]; then
    rfc_hit=1
  fi
  for p in "${CORE_PATHS[@]}"; do
    case "$f" in
      "$p"*) core_hit=1 ;;
      *) ;;
    esac
  done
done <<< "$CHANGED"

if [ "$core_hit" -eq 1 ] && [ "$rfc_hit" -ne 1 ]; then
  echo "ERR_CORE_LTS_FREEZE: core LTS changed without RFC update."
  echo "Range: ${BASE}..HEAD"
  echo "Expected RFC file changed: ${RFC_FILE}"
  echo ""
  echo "Changed files:"
  echo "$CHANGED"
  exit 1
fi

echo "[gate][OK] core-lts-freeze: compliant (core_hit=${core_hit}, rfc_hit=${rfc_hit})"
