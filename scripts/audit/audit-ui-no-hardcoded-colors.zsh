#!/usr/bin/env zsh
set -euo pipefail

resolve_tracked() {
  # Deterministic tracked-file resolver (never use `rg -n` because it prefixes line numbers)
  git ls-files 2>/dev/null || rg --files
}


ROOT="modules/core-system/ui/frontend-ts/pages"
NAME="AUDIT_UI_NO_HARDCODED_COLORS"
REPORT_DIR="_REPORTS"
TS="$(date +%Y%m%d_%H%M%S)"
REPORT="${REPORT_DIR}/ICONTROL_${NAME}_${TS}.md"

mkdir -p "$REPORT_DIR"

echo "=== AUDIT: P11 UI no hardcoded colors (inline) ===" | tee "$REPORT"
echo "Scope: ${ROOT}/**/*.ts" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

# Exclusions:
# - tests (they can contain literals)
# - generated / dist (shouldn't be under ROOT anyway)
EXCLUDES=(
  "--glob" "!**/*.test.ts"
  "--glob" "!**/__tests__/**"
)

# Patterns to block:
# - rgba()/rgb()/hsla()/hsl()
# - hex colors: #RGB, #RRGGBB, #RRGGBBAA
# - we restrict to inline style strings contexts to avoid false positives in docs/strings
PATTERN='(setAttribute\("style",[[:space:]]*".*(rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b).*\")|(style="[^"]*(rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b)[^"]*")'

echo "Blocked patterns (inline style contexts):" | tee -a "$REPORT"
echo "- rgba()/rgb()/hsl()/hsla()" | tee -a "$REPORT"
echo "- #hex (3-8 digits)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

# Allowlist (keep tight). Add exact file paths or globs ONLY when justified.
ALLOWLIST=(
  # Example (commented):
  # "${ROOT}/settings/branding.ts"
)

# Collect hits
HITS="$(rg -n -S --pcre2 "$PATTERN" "$ROOT" "${EXCLUDES[@]}" || true)"

# Remove allowlisted hits (if any)
if [ "${#ALLOWLIST[@]}" -gt 0 ] && [ -n "$HITS" ]; then
  for f in "${ALLOWLIST[@]}"; do
    HITS="$(printf "%s\n" "$HITS" | rg -v -S --fixed-strings "$f" || true)"
  done
fi

if [ -n "$HITS" ]; then
  echo "FAIL: hardcoded colors found in inline styles." | tee -a "$REPORT"
  echo "" | tee -a "$REPORT"
  echo "Findings:" | tee -a "$REPORT"
  echo '```' | tee -a "$REPORT"
  printf "%s\n" "$HITS" | tee -a "$REPORT"
  echo '```' | tee -a "$REPORT"
  echo "" | tee -a "$REPORT"
  echo "Remediation: replace inline literals with MAIN_SYSTEM_THEME.tokens.* (card/panel/border/text/mutedText/etc.)." | tee -a "$REPORT"
  echo "Report: ${REPORT}" | tee -a "$REPORT"
  exit 1
fi

echo "OK: no hardcoded colors in inline styles." | tee -a "$REPORT"
echo "Report: ${REPORT}" | tee -a "$REPORT"
exit 0
