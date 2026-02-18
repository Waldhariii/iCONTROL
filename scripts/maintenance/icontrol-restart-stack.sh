#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

echo "=== 0) Sanity: scripts icontrol:* présents ? ==="
node -e 'const s=require("./package.json").scripts||{}; console.log(Object.keys(s).filter(k=>k.startsWith("icontrol:")).sort().join("\n")||"(none)")'

echo
echo "=== 1) Stop tout (ports 5173/7070 + vite) ==="
pnpm -s icontrol:stop || true

echo
echo "=== 2) Start stack (API 7070 + CP 5173) ==="
pnpm -s icontrol:start

# Si tu veux ouvrir automatiquement:
# open "http://localhost:5173/cp/"
# open "http://localhost:7070/"
