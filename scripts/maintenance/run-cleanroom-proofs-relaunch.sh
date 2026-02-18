#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

echo "=================================================="
echo "iCONTROL — RUN single-root cleanroom + proofs + relaunch"
echo "ROOT=$ROOT"
echo "=================================================="

echo
echo "=== 0) Run cleanroom (default OLD=/Users/danygaudreault/iCONTROL, NEW=$ROOT) ==="
./scripts/maintenance/single-root-cleanroom.sh

echo
echo "=== 1) Show latest report path ==="
LATEST="$(ls -1t "$ROOT/runtime/reports"/ROOT_CLEANROOM_*.log 2>/dev/null | head -1 || true)"
echo "LATEST_REPORT=$LATEST"
if [ -n "$LATEST" ]; then
  echo
  echo "=== 1b) Key signals in report (hardcoded path + iCONTROL mentions) ==="
  grep -nE "/Users/danygaudreault/iCONTROL|\biCONTROLapp\b|OK: scripts patched|OK: docs patched|CHANGED FILES" "$LATEST" | head -120 || true
fi

echo
echo "=== 2) Git delta summary (what changed) ==="
git status -sb || true
echo
git diff --name-only | sed -n '1,200p' || true

echo
echo "=== 3) Proof: who serves :5173 and :7070 (PID + CWD) ==="
for PORT in 5173 7070; do
  echo
  echo "--- PORT=$PORT ---"
  PID="$(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t 2>/dev/null | head -1 || true)"
  if [ -z "$PID" ]; then
    echo "No listener on $PORT"
    continue
  fi
  echo "PID=$PID"
  ps -p "$PID" -o pid,ppid,comm,args 2>/dev/null || true
  CWD="$(lsof -p "$PID" 2>/dev/null | awk '/ cwd /{print $NF; exit}' || true)"
  echo "CWD=$CWD"
  case "$CWD" in
    *"/Users/danygaudreault/iCONTROL"*) echo "⚠️ SERVED BY iCONTROL (legacy root)";;
    *"/Users/danygaudreault/iCONTROL"*)   echo "✅ SERVED BY iCONTROL";;
    *) echo "WARN: CWD outside both roots";;
  esac
done

echo
echo "=== 4) Visual implantation proof (CP entrypoints) ==="
echo "--- main.ts (first 30 lines) ---"
nl -ba apps/control-plane/src/main.ts 2>/dev/null | sed -n '1,35p' || true
echo
echo "--- vite.config.ts server/open + aliases ---"
nl -ba apps/control-plane/vite.config.ts 2>/dev/null | sed -n '95,140p' || true
echo
echo "--- generated CSS present? ---"
ls -la apps/control-plane/src/styles/*generated*.css 2>/dev/null || true

echo
echo "=== 5) Relaunch stack (API 7070 + CP 5173) ==="
# Stop old listeners best-effort (portable: no xargs -r on macOS)
pkill -f "vite" 2>/dev/null || true
P5173="$(lsof -tiTCP:5173 -sTCP:LISTEN 2>/dev/null || true)"
[ -n "$P5173" ] && echo "$P5173" | xargs kill -9 2>/dev/null || true
P7070="$(lsof -tiTCP:7070 -sTCP:LISTEN 2>/dev/null || true)"
[ -n "$P7070" ] && echo "$P7070" | xargs kill -9 2>/dev/null || true

# Start via launcher (already installed)
pnpm -s icontrol:start

echo
echo "DONE."
