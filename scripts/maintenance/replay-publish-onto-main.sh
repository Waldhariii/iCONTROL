#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

PUBLISH_BRANCH="${PUBLISH_BRANCH:-publish/main-20260217_233438}"
BASE_BRANCH="${BASE_BRANCH:-main}"
REPLAY_BRANCH="${REPLAY_BRANCH:-integration/replay-level11-sync-20260217}"

echo "=================================================="
echo "FIX — Cherry-pick bloqué par fichiers *untracked* (overwrite risk)"
echo "GOAL — Park untracked blockers, then replay publish onto origin/main"
echo "=================================================="

echo
echo "=== 0) Fetch refs ==="
git fetch origin --prune

echo
echo "=== 1) Ensure we are on replay branch based on origin/main ==="
git checkout -B "$REPLAY_BRANCH" "origin/${BASE_BRANCH}"

echo
echo "=== 2) Abort any in-progress cherry-pick (safe no-op if none) ==="
git cherry-pick --abort >/dev/null 2>&1 || true

echo
echo "=== 3) Show blockers (if present) ==="
BLOCKERS=(
  "governance/gates/gates-report.md"
  "platform/ssot/governance/audit_ledger.json"
)
for f in "${BLOCKERS[@]}"; do
  if [ -e "$f" ]; then
    echo "BLOCKER_EXISTS: $f"
  else
    echo "OK_MISSING: $f"
  fi
done

echo
echo "=== 4) Park ALL untracked files (so cherry-pick can write them) ==="
# On évite toute suppression: on met en stash -u (inclut untracked)
TS="$(date -u +%Y%m%d_%H%M%S)"
git stash push -u -m "replay-prep:${TS} park untracked blockers before cherry-pick" || true
echo "STASH_TOP=$(git stash list | head -1 || true)"

echo
echo "=== 5) Sanity: working tree must be clean now ==="
git status -sb

echo
echo "=== 6) Build commit list to replay (publish not in origin/main) ==="
COMMITS_FILE="${TMPDIR:-/tmp}/icontrol_replay_commits_${TS}.txt"
git rev-list --reverse "origin/${PUBLISH_BRANCH}" --not "origin/${BASE_BRANCH}" > "$COMMITS_FILE"
COUNT="$(wc -l < "$COMMITS_FILE" | tr -d ' ')"
echo "COMMITS_TO_REPLAY=$COUNT file=$COMMITS_FILE"
if [ "$COUNT" -eq 0 ]; then
  echo "STOP: nothing to replay. Verify branches."
  exit 2
fi

echo
echo "=== 7) Cherry-pick replay (stops on real conflicts) ==="
set +e
git cherry-pick --keep-redundant-commits --allow-empty $(cat "$COMMITS_FILE")
CP_RC=$?
set -e

if [ "$CP_RC" -ne 0 ]; then
  echo
  echo "=================================================="
  echo "CONFLICT: cherry-pick stopped."
  echo "1) Inspect:"
  echo "   git status -sb"
  echo "2) Resolve conflicts, then:"
  echo "   git add -A"
  echo "   git cherry-pick --continue"
  echo
  echo "Abort entirely (rollback):"
  echo "   git cherry-pick --abort"
  echo "=================================================="
  exit 3
fi

echo
echo "=== 8) Push replay branch ==="
git push -u origin "$REPLAY_BRANCH"

echo
echo "=================================================="
echo "OK — Replay branch ready: $REPLAY_BRANCH"
echo "NEXT — Open PR:"
echo "  base: ${BASE_BRANCH}"
echo "  compare: ${REPLAY_BRANCH}"
echo "URL:"
echo "  https://github.com/Waldhariii/iCONTROL/compare/${BASE_BRANCH}...${REPLAY_BRANCH}?expand=1"
echo
echo "NOTE — Untracked stash kept for audit (can drop later):"
echo "  git stash list | head -5"
echo "=================================================="
