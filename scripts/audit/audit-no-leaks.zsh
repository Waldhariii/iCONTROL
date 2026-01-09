#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NOW="$(date +%Y%m%d_%H%M%S)"
REPORT_DIR="$ROOT/_REPORTS"
REPORT="$REPORT_DIR/ICONTROL_AUDIT_NO_LEAKS_${NOW}.md"
TMP="$REPORT_DIR/.tmp_audit_${NOW}.md"

mkdir -p "$REPORT_DIR"

# Important: exclusions must avoid self-match + reports + deps
EXCL=(
  --glob '!**/_REPORTS/**'
  --glob '!**/node_modules/**'
  --glob '!**/.git/**'
  --glob '!**/scripts/audit/**'
  --glob '!**/scripts/maintenance/**'
)

# Build legacy token without writing it contiguously in this file
LEGACY_TOKEN="C""ontrolX"

md(){ echo "$*" >> "$TMP"; }
die(){ echo "FAIL: $1"; echo "Report: $REPORT"; exit "$2"; }

# Header (scan-first report; writing after checks)
: > "$TMP"
md "# iCONTROL Audit — no-leaks"
md ""
md "- Root: \`$ROOT\`"
md "- Timestamp: \`$NOW\`"
md ""

echo "=== AUDIT: A1 Hardcoded /Users path ==="
HIT_A1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "/Users/" "$ROOT" || true)"
if [ -n "$HIT_A1" ]; then
  md "## FAIL A1 — Hardcoded path \`/Users/\` detected"
  md '```'
  echo "$HIT_A1" | head -200 >> "$TMP"
  md '```'
  mv -f "$TMP" "$REPORT"

  die "Hardcoded /Users path leak detected (see report)" 11
else
  md "## OK A1 — No hardcoded \`/Users/\` paths"
fi
md ""

echo "=== AUDIT: B1 Legacy token banned ==="
HIT_B1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"
if [ -n "$HIT_B1" ]; then
  md "## FAIL B1 — Legacy brand token found (banned)"
  md '```'
  echo "$HIT_B1" | head -200 >> "$TMP"
  md '```'
  mv -f "$TMP" "$REPORT"

  die "Legacy token found in active source (see report)" 12
else
  md "## OK B1 — No legacy token in active source"
fi
md ""

echo "=== AUDIT: C1 core-kernel isolation ==="
HIT_C1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "from\\s+['\"]/modules/|from\\s+['\"]\\.\\./\\.\\./modules/" "$ROOT/core-kernel" || true)"
if [ -n "$HIT_C1" ]; then
  md "## FAIL C1 — core-kernel importing modules (forbidden)"
  md '```'
  echo "$HIT_C1" | head -200 >> "$TMP"
  md '```'
  mv -f "$TMP" "$REPORT"

  die "core-kernel imports modules (see report)" 13
else
  md "## OK C1 — core-kernel does not import modules"
fi
md ""

echo "=== AUDIT: D1 module->module (warn) ==="
HIT_D1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "modules/[^/]+/.*modules/[^/]+" "$ROOT/modules" || true)"
if [ -n "$HIT_D1" ]; then
  md "## WARN D1 — module→module reference patterns found (review isolation)"
  md '```'
  echo "$HIT_D1" | head -200 >> "$TMP"
  md '```'
else
  md "## OK D1 — No obvious module→module direct references"
fi
md ""

md "## Result"
md "- Status: **PASS**"
md ""

mv -f "$TMP" "$REPORT"

# UPDATE_REPORTS_INDEX_V1
./scripts/maintenance/rebuild-reports-index.zsh
# END UPDATE_REPORTS_INDEX_V1
echo "OK: AUDIT PASS"
echo "Report: $REPORT"
