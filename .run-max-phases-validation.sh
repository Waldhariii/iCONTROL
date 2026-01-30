#!/usr/bin/env bash
# =====================================================================
# MAX PHASES VALIDATION — End-to-end execution with pre/post checks
# =====================================================================
set -euo pipefail
HOME_ROOT="${HOME%/*}"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 1

FILE=".max-phases.sh"

echo "== REPO =="
git rev-parse --show-toplevel
echo "== BRANCH =="
git rev-parse --abbrev-ref HEAD
echo

echo "== 0) Preconditions: script present =="
ls -la "$FILE"
head -40 "$FILE" | cat
echo

echo "== 1) Ensure executable =="
chmod +x "$FILE"
echo "OK: chmod +x $FILE"
echo

echo "== 2) Preconditions: index must be empty =="
if [[ -n "$(git diff --cached --name-only 2>/dev/null || true)" ]]; then
  echo "ERR: staging not empty. Aborting."
  git diff --cached --name-only | cat
  exit 10
fi
echo "OK: staging empty"
echo

echo "== 3) Sanity: no /Users leak already staged (should be empty) =="
if git diff --cached 2>/dev/null | grep -n "" >/dev/null 2>&1; then
  echo "ERR: local home-root leak in STAGED diff"
  git diff --cached | grep -n "" | head -n 50
  exit 20
fi
echo "OK: no /Users leak in staged diff"
echo

echo "== 4) Snapshot current worktree (top 120) =="
git status --porcelain | head -n 120
echo

echo "== 5) Run .triage-working-tree.sh once (baseline buckets) =="
if [[ -x ".triage-working-tree.sh" ]]; then
  bash .triage-working-tree.sh >/dev/null 2>&1 || true
  echo "OK: triage baseline executed (or skipped errors if any)"
else
  echo "WARN: .triage-working-tree.sh not executable/missing; script may regenerate internally"
fi
echo

echo "== 6) Execute MAX PHASES (hooks ON) =="
bash "$FILE"
echo

echo "== 7) Post: ensure staging empty =="
if [[ -n "$(git diff --cached --name-only 2>/dev/null || true)" ]]; then
  echo "ERR: staging not empty after run"
  git diff --cached --name-only | cat
  exit 30
fi
echo "OK: staging empty"
echo

echo "== 8) Post: show latest max-phases run folder =="
if [[ -d "_REPORTS/max-phases" ]]; then
  LATEST_RUN="$(ls -1dt _REPORTS/max-phases/* 2>/dev/null | head -n 1 || true)"
  echo "LATEST_RUN=${LATEST_RUN:-<none>}"
  if [[ -n "${LATEST_RUN:-}" && -d "$LATEST_RUN" ]]; then
    echo "== contents (top 80) =="
    ls -la "$LATEST_RUN" | head -n 80
    echo
    if [[ -f "$LATEST_RUN/phase_plan.txt" ]]; then
      echo "== phase_plan.txt (top 120) =="
      head -n 120 "$LATEST_RUN/phase_plan.txt" | cat
      echo
    fi
    if [[ -f "$LATEST_RUN/committed_files.txt" ]]; then
      echo "== committed_files.txt (top 120) =="
      head -n 120 "$LATEST_RUN/committed_files.txt" | cat
      echo
      echo "Committed files count: $(wc -l < "$LATEST_RUN/committed_files.txt" | tr -d ' ')"
      echo
    fi
    if ls "$LATEST_RUN"/cmd_*.log >/dev/null 2>&1; then
      echo "== last 5 command logs =="
      ls -1t "$LATEST_RUN"/cmd_*.log | head -n 5 | cat
      echo
      echo "== tail of last command log =="
      tail -n 80 "$(ls -1t "$LATEST_RUN"/cmd_*.log | head -n 1)" | cat
      echo
    fi
    if ls "$LATEST_RUN"/proof_light_*.log >/dev/null 2>&1; then
      echo "== last 3 proof_light logs =="
      ls -1t "$LATEST_RUN"/proof_light_*.log | head -n 3 | cat
      echo
      echo "== tail of last proof_light log =="
      tail -n 80 "$(ls -1t "$LATEST_RUN"/proof_light_*.log | head -n 1)" | cat
      echo
    fi
    if [[ -f "$LATEST_RUN/proofs_all.log" ]]; then
      echo "== tail proofs_all.log =="
      tail -n 120 "$LATEST_RUN/proofs_all.log" | cat
      echo
    fi
  fi
else
  echo "WARN: _REPORTS/max-phases does not exist (unexpected if script ran)."
fi
echo

echo "== 9) Executive diff summary (last 20 commits) =="
git --no-pager log --oneline -n 20
echo

echo "== 10) Working tree status (top 120) =="
git status --porcelain | head -n 120
echo

echo "OK: max-phases executed end-to-end with post-checks."
