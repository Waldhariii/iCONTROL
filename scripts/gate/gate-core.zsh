#!/usr/bin/env zsh
set -euo pipefail


run_tests_with_kind_matrix() {
  local cmd=("$@")
  if [[ -n "${VITE_APP_KIND:-}" ]]; then
    echo "[gate] VITE_APP_KIND preset: ${VITE_APP_KIND}"
    "${cmd[@]}"
  else
    echo "[gate] VITE_APP_KIND missing -> running APP + CONTROL_PLANE"
    VITE_APP_KIND=APP "${cmd[@]}"
    VITE_APP_KIND=CONTROL_PLANE "${cmd[@]}"
  fi
}

echo "=== ICONTROL_GATE_CORE_V1 ==="
./scripts/audit/audit-no-leaks.zsh
npm run build:app
run_tests_with_kind_matrix npm test
echo "OK: gates pass"
