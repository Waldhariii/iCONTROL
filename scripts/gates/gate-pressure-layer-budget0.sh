#!/usr/bin/env bash
set -euo pipefail

# Budget: 0 offenders. Strict mode must be deterministic.
: "${PRESSURE_LAYER_STRICT:=1}"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

if npm run -s gate:pressure-layer >"$tmp" 2>&1; then
  echo "OK: gate-pressure-layer-budget0 offenders=0"
  exit 0
fi

# Gate failed — count heuristic for diagnostics
count="$(grep -c -E '(app/|modules/|shared/|platform-services/)' "$tmp" 2>/dev/null || echo "1")"
echo "ERR_PRESSURE_LAYER_BUDGET: offenders>=1"
echo "---- gate output ----"
cat "$tmp"
exit 1
