#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

echo "=================================================="
echo "iCONTROL — Fix API native deps (better-sqlite3) + relaunch"
echo "=================================================="

echo "=== 0) Stop ports (cleanup) ==="
pnpm -s icontrol:stop || true
pkill -f vite 2>/dev/null || true

echo
echo "=== 1) Node version sanity ==="
node -v
echo "NOTE: Si tu es en Node 25.x et que ça continue de casser, passe en LTS (22)."

echo
echo "=== 2) Install deps (workspace) ==="
pnpm install

echo
echo "=== 3) Allow native build scripts (pnpm security gate) ==="
# IMPORTANT: ce menu te demande d'approuver better-sqlite3/esbuild.
# Choisis better-sqlite3 (et esbuild si tu veux éviter d'autres surprises).
pnpm approve-builds

echo
echo "=== 4) Rebuild native modules (force) ==="
# Recompile les bindings natifs maintenant qu'ils sont approuvés
pnpm rebuild better-sqlite3 || true
pnpm -C platform/api run build

echo
echo "=== 5) Quick proof: binding exists? ==="
ls -la node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build 2>/dev/null || true
ls -la node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/lib/binding 2>/dev/null || true

echo
echo "=== 6) Relaunch full stack (API 7070 + CP 5173) ==="
pnpm -s icontrol:start

echo
echo "DONE."
