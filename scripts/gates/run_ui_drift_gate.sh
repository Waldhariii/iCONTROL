#!/usr/bin/env zsh
# UI_DRIFT gate — Phase 4.2
# Détecte: couleurs en dur (#hex, rgb, rgba), sortie UI_DRIFT_REPORT. FAIL si dérive.
set -euo pipefail

ROOT="${1:-.}"
if [[ "$ROOT" = /* ]]; then REPO="$ROOT"; else REPO="$(cd "$ROOT" && pwd)"; fi
cd "$REPO"

# Gate: python3-only (tooling invariant)
zsh ./scripts/gates/check_python3_only.sh
REPORT="$REPO/docs/ssot/UI_DRIFT_REPORT.md"
TS="$(date +%Y-%m-%dT%H:%M:%SZ)"

SCOPE=(
  "apps/control-plane/src"
  "modules/core-system"
)
EXCLUDES=(
  "--glob" "!**/*.test.ts"
  "--glob" "!**/*.spec.ts"
  "--glob" "!**/__tests__/**"
  "--glob" "!**/node_modules/**"
  "--glob" "!**/*.disabled"
)
# Fichiers de définition de tokens/thèmes (SSOT) — exclus du gate
# Lot 3: CSS canoniques/générés (icontrol.generated.css, STYLE_ADMIN_FINAL.css)
ALLOWLIST_FILES=(
  "loginTheme/loginTheme.ts"
  "login-theme.ts"
  "pages/cp/login.ts"
  "coreStyles.ts"
  "mainSystem.data.ts"
  "themeManager.ts"
  "catalog/index.ts"
  "icontrol.generated.css"
  "STYLE_ADMIN_FINAL.css"
)

# Couleurs en dur: #hex (3–8), rgb(, rgba(, hsl(, hsla(
# Exclure: var(--, design.tokens, presets, themeTokens, "token"
PATTERN='#[0-9a-fA-F]{3,8}\b|rgba?\s*\(|hsla?\s*\('
# Fichiers contenant au moins une des exclusions (var(--, tokens) sur la même ligne : on les ignore
# Pour simplifier: on grep le pattern, puis on filtre les lignes qui ont var(-- ou "tokens" ou preset
HITS=""
for dir in "${SCOPE[@]}"; do
  [[ -d "$dir" ]] || continue
  raw=$(rg -n --glob '!*.test.*' --glob '!*.spec.*' --glob '!**/__tests__/**' --glob '!**/*.disabled' "$PATTERN" "$dir" 2>/dev/null || true)
  if [[ -n "$raw" ]]; then
    # Exclure lignes avec var(-- ou tokens. ou "tokens" ou design.tokens ou preset
    filtered=$(printf "%s\n" "$raw" | (rg -v 'var\s*\(\s*--|tokens\.|"tokens"|design\.tokens|preset|themeTokens' 2>/dev/null || true) || true)
    # Exclure fichiers de définition de tokens (ALLOWLIST_FILES)
    for allow in "${ALLOWLIST_FILES[@]}"; do
      [[ -n "$filtered" ]] && filtered=$(printf "%s\n" "$filtered" | (rg -v --fixed-strings "$allow" 2>/dev/null || true) || true)
    done
    if [[ -n "$filtered" ]]; then
      HITS="${HITS:+$HITS\n}${filtered}"
    fi
  fi
done

# Exception Lot 2B: login-theme/Page.tsx — input[type=color] fallback (#000000) + preset arrays (ic-theme-swatch--)
if [[ -n "$HITS" ]]; then
  HITS=$(printf "%s\n" "$HITS" | while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    if [[ "$line" == *"surfaces/cp/login-theme/Page.tsx"* ]]; then
      [[ "$line" == *"#000000"* ]] && continue
      [[ "$line" == *"ic-theme-swatch--"* ]] && continue
    fi
    echo "$line"
  done)
fi

# Exception Lot 8: couleurs sémantiques intentionnelles (pas de token généré disponible)
# success=#10b981, error=#ef4444, warning=#f59e0b, info=#3b82f6, purple=#8b5cf6, gray=#6b7280
SEMANTIC_COLORS=("#10b981" "#ef4444" "#f59e0b" "#3b82f6" "#8b5cf6" "#6b7280" "#9aa3ad" "#5a8fff" "#6D28D9" "#6b7280")
if [[ -n "$HITS" ]]; then
  for sc in "${SEMANTIC_COLORS[@]}"; do
    HITS=$(printf "%s\n" "$HITS" | (rg -v --fixed-strings "$sc" 2>/dev/null || true) || true)
  done
fi

mkdir -p "$(dirname "$REPORT")"
{
  echo "# UI_DRIFT_REPORT"
  echo ""
  echo "**Dernière exécution:** $TS"
  echo ""
  echo "## Règle"
  echo "Couleurs en dur (#hex, rgb, rgba, hsl, hsla) hors \`var(--*)\`, tokens, presets → FAIL."
  echo ""

  if [[ -n "$HITS" ]]; then
    echo "## Résultat: **FAIL**"
    echo ""
    echo "### Findings"
    echo '```'
    printf "%s\n" "$HITS"
    echo '```'
    echo ""
    echo "### Remédiation"
    echo "Remplacer par \`var(--*)\` issus de design.tokens / presets (cf. DESIGN_SYSTEM_SSOT.md)."
  else
    echo "## Résultat: **PASS**"
    echo ""
    echo "Aucune couleur en dur détectée dans le scope."
  fi
} > "$REPORT"
[[ -n "$HITS" ]] && exit 1 || exit 0
