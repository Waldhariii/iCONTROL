#!/usr/bin/env zsh
set -euo pipefail

echo "=== ICONTROL_GATE_CORE_V1 ==="
./scripts/audit/audit-no-leaks.zsh
npm run build:app
npm test
echo "OK: gates pass"
