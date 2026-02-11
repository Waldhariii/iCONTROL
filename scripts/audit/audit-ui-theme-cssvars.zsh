#!/usr/bin/env zsh
set -euo pipefail

MARKER="ICONTROL_THEME_CSSVARS_BOOTSTRAP_V1"
FILE="apps/control-plane/src/main.ts"
REPORT="_REPORTS/ICONTROL_AUDIT_UI_THEME_CSSVARS_$(date +%Y%m%d_%H%M%S).md"

mkdir -p _REPORTS

ok=1
{
  echo "=== AUDIT: P14 UI theme css vars bootstrap ==="
  echo "File: $FILE"
  echo "Marker: $MARKER"
  echo ""
  if [[ ! -f "$FILE" ]]; then
    echo "FAIL: missing $FILE"
    ok=0
  else
    if ! rg -n --fixed-strings "$MARKER" "$FILE" >/dev/null; then
      echo "FAIL: marker missing"
      ok=0
    else
      echo "OK: marker present"
    fi
    if ! rg -n "applyThemeTokensToCSSVars\s*\(" "$FILE" >/dev/null; then
      echo "FAIL: applyThemeTokensToCSSVars() call missing"
      ok=0
    else
      echo "OK: applyThemeTokensToCSSVars() call present"
    fi
  fi
  echo ""
  if [[ "$ok" == "1" ]]; then
    echo "OK: UI theme css vars audit PASS"
  else
    echo "ERROR: UI theme css vars audit FAIL"
  fi
} | tee "$REPORT"

[[ "$ok" == "1" ]]
