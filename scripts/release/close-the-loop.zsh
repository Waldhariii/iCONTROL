#!/usr/bin/env zsh
set -euo pipefail

TAG="${TAG:-}"
if [[ -z "$TAG" ]]; then
  echo "ERROR: TAG not set. Usage: TAG=vX.Y.Z[-rcN] ./scripts/release/close-the-loop.zsh"
  exit 2
fi

NOTES="_RELEASE_NOTES_${TAG}.md"
PWD_REPO="$(pwd)"

echo "=== 0) CONTEXT ==="
echo "TAG=$TAG"
echo "PWD=$PWD_REPO"
echo ""

echo "=== 1) GIT HYGIENE (must be clean) ==="
if [[ -n "$(git status --porcelain=v1)" ]]; then
  echo "BLOCKED: dirty working tree"
  git status --porcelain=v1
  exit 1
fi
echo "OK: clean working tree"
echo ""

echo "=== 2) TAG INTEGRITY (tag -> HEAD) ==="
git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null || { echo "BLOCKED: missing tag $TAG"; exit 1; }
TAG_OBJ="$(git rev-parse "$TAG")"
TAG_COMMIT="$(git rev-parse "${TAG}^{}")"
HEAD_COMMIT="$(git rev-parse HEAD)"
echo "TAG object = $TAG_OBJ"
echo "TAG commit = $TAG_COMMIT"
echo "HEAD commit= $HEAD_COMMIT"
if [[ "$TAG_COMMIT" != "$HEAD_COMMIT" ]]; then
  echo "BLOCKED: $TAG does not point to HEAD"
  exit 1
fi
echo "OK: $TAG points to HEAD"
echo ""

echo "=== 3) RELEASE NOTES PRESENT ==="
if [[ ! -f "$NOTES" ]]; then
  echo "BLOCKED: missing $NOTES"
  exit 1
fi
echo "OK: found $NOTES"
echo ""

echo "=== 4) TEST GATE (app) ==="
( cd app && npm run test )
echo "OK: tests green"
echo ""

echo "=== 5) AUDIT GATES ==="
./scripts/audit/audit-subscription-no-ui-coupling.zsh
./scripts/audit/audit-no-node-builtins-in-app.zsh
./scripts/audit/audit-no-node-builtins-in-client-surface.zsh
echo "OK: audits green"
echo ""

echo "=== 6) BUILD GATE (app) ==="
npm run build:app
echo "OK: build green"
echo ""

echo "=== 7) DIST LEAK CHECK (must be empty) ==="
setopt NULL_GLOB 2>/dev/null || true
ASSETS=( apps/control-plane/dist/assets/*FileSubscriptionStore* )
if (( ${#ASSETS[@]} > 0 )); then
  echo "BLOCKED: FileSubscriptionStore asset(s) present:"
  printf '%s\n' "${ASSETS[@]}"
  exit 1
fi
echo "OK: no FileSubscriptionStore assets"
echo ""

echo "=== 8) GITHUB RELEASE (optional) ==="
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "OK: gh authenticated"
    gh release view "$TAG" --web || true
  else
    echo "SKIP: gh not authenticated (run: gh auth login)"
  fi
else
  echo "SKIP: gh not installed"
fi
echo ""

echo "=== 9) FINAL ==="
echo "OK: Close-the-loop PASS for $TAG"
git --no-pager log --oneline -n 6
