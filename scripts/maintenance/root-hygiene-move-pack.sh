#!/usr/bin/env bash
set -euo pipefail

# ====================================================================================
# iCONTROL — ROOT HYGIENE MOVE PACK (STRICT)
# Objectif:
# 1) Analyser 100% de /Users/danygaudreault/iCONTROL (inventaire complet)
# 2) Déplacer chaque élément dans le bon dossier (selon arborescence canonique)
# 3) Si un dossier/fichier ne match pas la structure canonique: le déplacer sous:
#    /Users/danygaudreault/iCONTROL/_archive/unsorted/<TS>/
#
# Contraintes:
# - PAS de suppression (rm) dans ce pack. Uniquement mv (ou git mv si tracked).
# - Ne jamais toucher à: node_modules/, .git/, runtime/reports/
# - Tout déplacement doit être idempotent et loggé (plan + exécution + vérif).
# - Si un déplacement casse des imports/types: STOP et produire un plan de remédiation.
# ====================================================================================

ROOT="/Users/danygaudreault/iCONTROL"
TS="$(date -u +'%Y%m%d-%H%M%S')"
WORK="$ROOT/_audit/work/root_hygiene_move.$TS"
UNSORT="$ROOT/_archive/unsorted/$TS"

mkdir -p "$WORK" "$UNSORT"

echo "========================================"
echo "iCONTROL — ROOT HYGIENE MOVE PACK"
echo "ROOT=$ROOT"
echo "TS=$TS"
echo "WORK=$WORK"
echo "UNSORT=$UNSORT"
echo "========================================"

cd "$ROOT"

echo
echo "0) Preflight — état git"
git status -sb | tee "$WORK/git_status_before.txt" || true

echo
echo "1) Inventaire complet root (niveau 1 + type) — sans xargs (évite 'command line too long')"
while IFS= read -r -d '' p; do
  bn="$(basename "$p")"
  [ "$bn" = ".git" ] || [ "$bn" = "node_modules" ] && continue
  if [ -d "$p" ]; then
    echo "DIR	$bn"
  elif [ -f "$p" ]; then
    echo "FILE	$bn"
  else
    echo "OTHER	$bn"
  fi
done < <(find "$ROOT" -mindepth 1 -maxdepth 1 ! -name ".git" ! -name "node_modules" -print0 2>/dev/null) | sort -u | tee "$WORK/root_inventory_level1.txt"
# Fallback si find -print0 échoue: ls -A
if [ ! -s "$WORK/root_inventory_level1.txt" ]; then
  ls -A "$ROOT" | while read -r bn; do
    [ "$bn" = ".git" ] || [ "$bn" = "node_modules" ] && continue
    p="$ROOT/$bn"
    if [ -d "$p" ]; then echo "DIR	$bn"; elif [ -f "$p" ]; then echo "FILE	$bn"; else echo "OTHER	$bn"; fi
  done | sort -u > "$WORK/root_inventory_level1.txt"
fi

echo
echo "2) Build MOVE PLAN (dry-run only) — classification"
PLAN="$WORK/move_plan.txt"
: > "$PLAN"

plan_add() {
  printf "%s|%s|%s|%s\n" "$1" "$2" "$3" "$4" >> "$PLAN"
}

# Canonical top-level directories allowed to remain at root
ALLOW_DIRS=(
  "_archive" "_audit" "apps" "docs" "infra" "modules" "platform" "runtime" "scripts"
  ".github" ".githooks" ".vscode"
)

# Canonical root files allowed
ALLOW_FILES=(
  "package.json" "pnpm-lock.yaml" "pnpm-workspace.yaml"
  "pages-list.txt" "iCONTROL.code-workspace"
  ".gitignore" ".gitattributes" ".editorconfig"
  "README.md" "LICENSE"
  ".npmrc" ".nvmrc" ".node-version"
  ".eslintrc.cjs" ".env.example" ".pnpmfile.cjs"
  ".cursorignore" ".icontrol_subscriptions.example.json"
)

is_in_list() {
  local needle="$1"; shift
  for x in "$@"; do [ "$x" = "$needle" ] && return 0; done
  return 1
}

while IFS= read -r line; do
  [ -z "$line" ] && continue
  kind="${line%%	*}"
  name="${line#*	}"
  name="${name#"${name%%[![:space:]]*}}"
  name="${name%"${name##*[![:space:]]}"}"
  [ -z "$name" ] && continue
  src="$ROOT/$name"

  if [ "$kind" = "DIR" ]; then
    if is_in_list "$name" "${ALLOW_DIRS[@]}"; then
      plan_add "KEEP" "$src" "$src" "canonical_root_dir"
    else
      plan_add "MOVE" "$src" "$UNSORT/$name" "non_canonical_root_dir"
    fi
  elif [ "$kind" = "FILE" ]; then
    if is_in_list "$name" "${ALLOW_FILES[@]}"; then
      plan_add "KEEP" "$src" "$src" "canonical_root_file"
    else
      plan_add "MOVE" "$src" "$UNSORT/$name" "non_canonical_root_file"
    fi
  else
    plan_add "MOVE" "$src" "$UNSORT/$name" "non_file_non_dir_root_item"
  fi
done < <(cat "$WORK/root_inventory_level1.txt")

echo "✅ Plan écrit: $PLAN"
echo
echo "3) Show PLAN summary (counts)"
awk -F'|' '{c[$1]++} END{for(k in c) print k, c[k]}' "$PLAN" | sort | tee "$WORK/plan_counts.txt"

echo
echo "4) STOP GATE — review obligatoire avant exécution"
echo "Open: $PLAN"
echo
echo "If the plan looks correct, run the APPLY script:"
echo "  bash $WORK/apply_move_plan.sh"
echo

APPLY="$WORK/apply_move_plan.sh"
cat > "$APPLY" <<'APPLYEOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/danygaudreault/iCONTROL"
WORK="$(dirname "$0")"
PLAN="$WORK/move_plan.txt"

echo "========================================"
echo "APPLY MOVE PLAN"
echo "WORK=$WORK"
echo "PLAN=$PLAN"
echo "========================================"

cd "$ROOT"

if [ ! -f "$PLAN" ]; then
  echo "❌ Missing plan: $PLAN"
  exit 1
fi

PROTECT_REGEX='(^|/)(\.git|node_modules|runtime/reports)(/|$)'

while IFS='|' read -r action src dst reason; do
  [ -z "${action:-}" ] && continue

  if [[ "$src" =~ $PROTECT_REGEX ]]; then
    echo "SKIP protected: $src"
    continue
  fi

  if [ "$action" = "KEEP" ]; then
    continue
  fi

  if [ ! -e "$src" ]; then
    echo "SKIP missing: $src"
    continue
  fi

  mkdir -p "$(dirname "$dst")"

  if git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
    echo "GITMV $src -> $dst ($reason)"
    git mv "$src" "$dst"
  else
    echo "MV    $src -> $dst ($reason)"
    mv "$src" "$dst"
  fi
done < "$PLAN"

echo
echo "=== Post — git status ==="
git status -sb

echo
echo "=== IMPORTANT ==="
echo "If any move breaks imports/build, STOP. Fix references in a separate pack."
APPLYEOF

chmod +x "$APPLY"
echo "✅ APPLY script generated: $APPLY"
