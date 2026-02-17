#!/usr/bin/env bash
set -euo pipefail

# GOAL:
# - Ensure repo has a valid 'origin' remote (via discovery or GIT_URL override)
# - Push main + tags safely (requires explicit PUSH=1 unless already configured)
# - Optionally materialize latest stash into a WIP branch and push it
#
# QUICK OPS:
#   export GIT_URL='git@github.com:<org>/<repo>.git'   # recommended (SSH)
#   PUSH=1 ./scripts/maintenance/remote-rebind-and-push.sh
#
# If you don't know the URL: in Cursor -> Source Control -> Remote/Publish -> copy SSH URL.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ROOT="${ROOT:-$DEFAULT_ROOT}"

TS="$(date -u +%Y%m%d_%H%M%S)"
LOG="${ROOT}/runtime/reports/REMOTE_REBIND_AND_PUSH_${TS}.log"
mkdir -p "${ROOT}/runtime/reports"
exec > >(tee -a "$LOG") 2>&1

echo "====================================================================="
echo "REMOTE REBIND + PUSH"
echo "RUN_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "ROOT=$ROOT"
echo "LOG=$LOG"
echo "====================================================================="

cd "$ROOT"

DRY="${DRY:-0}"
PUSH="${PUSH:-0}"
ALLOW_DIRTY_MAIN="${ALLOW_DIRTY_MAIN:-0}"

run() {
  if [ "$DRY" = "1" ]; then
    echo "[DRY] $*"
  else
    eval "$@"
  fi
}

echo
echo "=== 0) Repo identity ==="
git status -sb || true
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
HEAD="$(git rev-parse HEAD)"
echo "BRANCH=$BRANCH"
echo "HEAD=$HEAD"
echo "--- remotes ---"
git remote -v || true
echo "--- recent tags ---"
git tag --sort=-creatordate | head -5 || true
echo "--- stash top ---"
git stash list | head -3 || true

echo
echo "=== 1) Safety gate: main must be clean unless ALLOW_DIRTY_MAIN=1 ==="
if [ "$BRANCH" = "main" ] && [ "$ALLOW_DIRTY_MAIN" != "1" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "ERR: main is dirty. Refusing to push."
    echo "If intentional: ALLOW_DIRTY_MAIN=1 PUSH=1 $0"
    exit 3
  fi
fi

echo
echo "=== 2) Ensure origin exists ==="
if git remote | grep -qx "origin"; then
  ORIGIN_URL="$(git config --get remote.origin.url || true)"
  echo "OK: origin exists: ${ORIGIN_URL:-"(unknown)"}"
else
  echo "origin missing -> discovery/override"
  CAND=""

  # A) operator override
  if [ -n "${GIT_URL:-}" ]; then CAND="$GIT_URL"; fi

  # B) best-effort discovery in repo text (non-fatal)
  if [ -z "$CAND" ]; then
    CAND="$(grep -RhoE '(https|ssh)://[^[:space:]]+|git@[^[:space:]]+:[^[:space:]]+' . 2>/dev/null \
      | grep -Ei '(github|gitlab|bitbucket|azure|devops).*(\.git)?' \
      | head -n 1 || true)"
  fi

  echo "DISCOVERED_CANDIDATE=${CAND:-"(none)"}"
  if [ -z "$CAND" ]; then
    echo
    echo "ERR: cannot infer remote URL."
    echo "Provide one:"
    echo "  export GIT_URL='git@github.com:<org>/<repo>.git'  # recommended"
    echo "  PUSH=1 $0"
    exit 2
  fi

  run "git remote add origin \"${CAND}\""
  git remote -v
fi

echo
echo "=== 3) If GIT_URL is set, enforce it matches origin (no silent mismatch) ==="
if [ -n "${GIT_URL:-}" ]; then
  ORIGIN_URL="$(git config --get remote.origin.url || true)"
  if [ -n "$ORIGIN_URL" ] && [ "$ORIGIN_URL" != "$GIT_URL" ]; then
    echo "ERR: origin URL differs from GIT_URL"
    echo "origin=$ORIGIN_URL"
    echo "GIT_URL=$GIT_URL"
    echo "Fix with:"
    echo "  git remote set-url origin \"$GIT_URL\""
    exit 4
  fi
fi

echo
echo "=== 4) Push main + tags (explicit PUSH=1 required) ==="
if [ "$PUSH" != "1" ]; then
  echo "SKIP: not pushing (set PUSH=1)."
  echo "Next:"
  echo "  PUSH=1 $0"
else
  run "git push -u origin main"
  run "git push origin --tags"
  echo "OK: pushed main + tags"
fi

echo
echo "=== 5) Optional: move latest stash to WIP branch + push (requires PUSH=1) ==="
if git stash list | head -1 | grep -q .; then
  if [ "$PUSH" != "1" ]; then
    echo "Stash exists but PUSH!=1, skipping WIP branch push."
  else
    WIP_BRANCH="wip/post-v10-${TS}"
    echo "WIP_BRANCH=$WIP_BRANCH"
    run "git checkout -b \"$WIP_BRANCH\""
    run "git stash apply stash@{0}"
    run "git add -A"
    run "git commit -m \"wip: park post-v10 artifacts (snapshot)\""
    run "git stash drop stash@{0}"
    run "git push -u origin \"$WIP_BRANCH\""
    echo "OK: WIP branch pushed: $WIP_BRANCH"
  fi
else
  echo "No stash found."
fi

echo
echo "DONE."
