#!/usr/bin/env zsh
set -euo pipefail

echo "=== ICONTROL_GATE_CORE_V1 ==="
./scripts/audit/audit-no-leaks.zsh
( cd app && npm run build )
( cd app && npm run test )
echo "OK: gates pass"
