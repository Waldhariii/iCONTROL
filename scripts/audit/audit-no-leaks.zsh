#!/bin/zsh
set -euo pipefail

# Root = repo root (2 levels up from this script)
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPORT_DIR="$ROOT/_REPORTS"
TS="$(date +%Y%m%d_%H%M%S)"
REPORT="$REPORT_DIR/ICONTROL_AUDIT_NO_LEAKS_${TS}.md"
TMP="$(mktemp "/tmp/icontrol_audit_${TS}_XXXX.md")"

mkdir -p "$REPORT_DIR"

md(){ echo "$@" >> "$TMP"; }
die(){ echo "FAIL: $1"; echo "Report: $REPORT"; exit "${2:-1}"; }

need_cmd(){ command -v "$1" >/dev/null 2>&1 || die "Missing command: $1" 90; }

need_cmd rg
need_cmd sed
need_cmd head

# Exclusions (do NOT scan backups/reports/deps/git + do NOT scan this script to avoid self-match)
EXCL=(
  --glob '!**/_REPORTS/**'
  --glob '!**/node_modules/**'
  --glob '!**/.git/**'
  --glob '!**/scripts/audit/audit-no-leaks.zsh'
)

# Write header to temp report (we do scans first; we only finalize report at the end)
: > "$TMP"
md "# iCONTROL — Audit no-leaks"
md ""
md "- Date: $(date)"
md "- ROOT: \`$ROOT\`"
md ""

md "## Exclusions"
md '```'
for g in "${EXCL[@]}"; do echo "$g" >> "$TMP"; done
md '```'
md ""

# A1) Ban hardcoded /Users paths
HIT_A1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "/Users/" "$ROOT" || true)"
if [ -n "$HIT_A1" ]; then
  md "## FAIL A1 — Hardcoded path \`/Users/\` detected"
  md '```'
  echo "$HIT_A1" | head -200 >> "$TMP"
  md '```'
  mv -f "$TMP" "$REPORT"
  die "Hardcoded /Users path leak detected (see report)" 11
else
  md "## OK A1 — No hardcoded /Users paths"
fi
md ""

# B1) Ban legacy token "ControlX"
HIT_B1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "ControlX" "$ROOT" || true)"
if [ -n "$HIT_B1" ]; then
  md "## FAIL B1 — Legacy token \`ControlX\` found"
  md '```'
  echo "$HIT_B1" | head -200 >> "$TMP"
  md '```'
  mv -f "$TMP" "$REPORT"
  die "ControlX token found in active source (see report)" 12
else
  md "## OK B1 — No ControlX token in active source"
fi
md ""

# C1) core-kernel must NOT import modules
HIT_C1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "from\s+['\"]/modules/|from\s+['\"]\.\./\.\./modules/" "$ROOT/core-kernel" || true)"
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

# D1) Modules should not import other modules directly (warn only)
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

# Finalize report
mv -f "$TMP" "$REPORT"

echo "OK: AUDIT PASS"
echo "Report: $REPORT"
