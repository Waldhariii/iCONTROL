#!/bin/bash
# =========================================================
# TRIAGE WORKING TREE — Diagnostic + stabilisation idempotente
# Objectif: isoler/trier le bruit du working tree sans casser SSOT/gates
# =========================================================
set -euo pipefail
HOME_ROOT="${HOME%/*}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
export LC_ALL=C

# --- numeric sanitizer (prevents bash arithmetic errors) ---
num() { case "${1:-}" in (""|*[!0-9]*) echo 0 ;; (*) echo "$1" ;; esac; }

cd ${REPO_ROOT}

# =========================
# CONFIGURATION (modifier ici pour changer le mode)
# =========================
MODE="${TRIAGE_MODE:-SPLIT}"  # STASH | BRANCH | SPLIT (default: SPLIT = report-only)

# =========================
# PRECHECK: staging doit être vide
# =========================
STAGED="$(git diff --cached --name-only 2>/dev/null | LC_ALL=C sort || echo "")"
if [ -n "$STAGED" ]; then
  echo "ERR: staging non vide. Nettoie d'abord:"
  echo "$STAGED"
  exit 10
fi

# =========================
# SETUP: dossier triage (local, non versionné)
# =========================
TRIAGE_DIR=".triage"
mkdir -p "$TRIAGE_DIR"
TS="$(date +%Y%m%d_%H%M%S)"

# =========================
# DIAGNOSTIC 1: contexte Git
# =========================
echo "============================================================"
echo "DIAGNOSTIC: État Git"
echo "============================================================"
echo "BRANCH: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"
echo "HEAD:   $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo "REMOTE: $(git config --get branch.$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'HEAD').remote 2>/dev/null || echo 'none')"
echo

echo "== LOG (last 5) =="
git --no-pager log --oneline -n 5 2>/dev/null || echo "(no commits)"
echo

# =========================
# DIAGNOSTIC 2: working tree (porcelain v1)
# =========================
echo "== WORKING TREE STATUS (porcelain v1) =="
git status --porcelain=v1 > "$TRIAGE_DIR/status_porcelain_$TS.txt"
cat "$TRIAGE_DIR/status_porcelain_$TS.txt"
echo

# =========================
# DIAGNOSTIC 3: catégorisation (modified / deleted / untracked)
# =========================
MODIFIED=""
DELETED=""
UNTRACKED=""

if [ -f "$TRIAGE_DIR/status_porcelain_$TS.txt" ] && [ -s "$TRIAGE_DIR/status_porcelain_$TS.txt" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    # Format porcelain v1: XY filename (X=index, Y=working tree)
    x="${line:0:1}"
    y="${line:1:1}"
    file="${line:3}"
    
    # Modified in working tree (Y = M)
    if [ "$y" = "M" ]; then
      MODIFIED="$MODIFIED$file"$'\n'
    fi
    # Deleted in working tree (Y = D)
    if [ "$y" = "D" ]; then
      DELETED="$DELETED$file"$'\n'
    fi
    # Untracked (XY = ??)
    if [ "$x" = "?" ] && [ "$y" = "?" ]; then
      UNTRACKED="$UNTRACKED$file"$'\n'
    fi
  done < "$TRIAGE_DIR/status_porcelain_$TS.txt"
fi

MODIFIED="$(echo "$MODIFIED" | LC_ALL=C sort | grep -v '^$' || echo '')"
DELETED="$(echo "$DELETED" | LC_ALL=C sort | grep -v '^$' || echo '')"
UNTRACKED="$(echo "$UNTRACKED" | LC_ALL=C sort | grep -v '^$' || echo '')"

echo "$MODIFIED" > "$TRIAGE_DIR/modified_$TS.txt"
echo "$DELETED" > "$TRIAGE_DIR/deleted_$TS.txt"
echo "$UNTRACKED" > "$TRIAGE_DIR/untracked_$TS.txt"

echo "== STATS =="
mod_count=$(echo "$MODIFIED" | grep -v '^$' | wc -l | tr -d ' ' || echo '0')
del_count=$(echo "$DELETED" | grep -v '^$' | wc -l | tr -d ' ' || echo '0')
unt_count=$(echo "$UNTRACKED" | grep -v '^$' | wc -l | tr -d ' ' || echo '0')
echo "MODIFIED: $mod_count"
echo "DELETED:  $del_count"
echo "UNTRACKED: $unt_count"
echo

# =========================
# DIAGNOSTIC 4: stats par répertoire top-level
# =========================
echo "== STATS PAR RÉPERTOIRE =="
for dir in app modules scripts server platform-services docs config; do
  if [ -d "$dir" ]; then
    mod_count=$(echo "$MODIFIED"  | grep -c "^$dir/" 2>/dev/null || true)
    del_count=$(echo "$DELETED"   | grep -c "^$dir/" 2>/dev/null || true)
    unt_count=$(echo "$UNTRACKED" | grep -c "^$dir/" 2>/dev/null || true)

    # Ensure numeric values (avoid arithmetic errors)
    mod_count=$(num "$mod_count")
    del_count=$(num "$del_count")
    unt_count=$(num "$unt_count")
    # S'assurer que les valeurs sont des nombres valides
    mod_count=${mod_count:-0}
    del_count=${del_count:-0}
    unt_count=${unt_count:-0}
    # Convertir en entiers (enlever tout caractère non numérique)
    mod_count=$(echo "$mod_count" | tr -cd '0-9' || echo "0")
    del_count=$(echo "$del_count" | tr -cd '0-9' || echo "0")
    unt_count=$(echo "$unt_count" | tr -cd '0-9' || echo "0")
    # Valeurs par défaut si vides
    [ -z "$mod_count" ] && mod_count=0
    [ -z "$del_count" ] && del_count=0
    [ -z "$unt_count" ] && unt_count=0
    total=$((mod_count + del_count + unt_count))
    if [ "$total" -gt 0 ]; then
      printf "  %-20s: M=%3d D=%3d U=%3d (total=%3d)\n" "$dir/" "$mod_count" "$del_count" "$unt_count" "$total"
    fi
  fi
done
echo

# =========================
# DIAGNOSTIC 5: diff names (non staged)
# =========================
echo "== DIFF NAMES (non staged) =="
git diff --name-only 2>/dev/null | LC_ALL=C sort > "$TRIAGE_DIR/diff_names_$TS.txt" || touch "$TRIAGE_DIR/diff_names_$TS.txt"
cat "$TRIAGE_DIR/diff_names_$TS.txt" | head -20
[ "$(wc -l < "$TRIAGE_DIR/diff_names_$TS.txt" | tr -d ' ')" -gt 20 ] && echo "... (voir $TRIAGE_DIR/diff_names_$TS.txt pour la liste complète)"
echo

# =========================
# STRATÉGIE: exécution selon MODE
# =========================
echo "============================================================"
echo "STRATÉGIE: MODE=$MODE"
echo "============================================================"

case "$MODE" in
  STASH)
    echo "== MODE: STASH (freeze working tree) =="
    if [ -z "$MODIFIED$DELETED$UNTRACKED" ]; then
      echo "OK: working tree déjà clean, rien à stasher"
    else
      echo "Stashing working tree (incluant untracked)..."
      git stash push -u -m "triage: freeze working tree (pre-split) - $TS"
      echo "OK: stash créé"
      echo
      echo "== VÉRIFICATION: working tree doit être clean =="
      if [ -z "$(git status --porcelain 2>/dev/null || echo '')" ]; then
        echo "OK: working tree clean après stash"
      else
        echo "WARN: working tree non vide après stash"
        git status --porcelain | head -10
      fi
    fi
    ;;
    
  BRANCH)
    echo "== MODE: BRANCH (quarantine) =="
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'HEAD')"
    WIP_BRANCH="wip/triage-$TS"
    
    echo "CURRENT_BRANCH: $CURRENT_BRANCH"
    echo "WIP_BRANCH: $WIP_BRANCH"
    echo
    
    if [ -z "$MODIFIED$DELETED$UNTRACKED" ]; then
      echo "OK: working tree déjà clean, pas besoin de branche quarantine"
    else
      echo "Création branche quarantine (sans commit)..."
      git checkout -b "$WIP_BRANCH" 2>/dev/null || git checkout "$WIP_BRANCH"
      echo "OK: branche $WIP_BRANCH créée/checkout"
      echo
      echo "NOTE: working tree non modifié (fichiers restent en working tree)"
      echo "Pour isoler: faire un stash ou commit manuel sur cette branche"
      echo "Pour revenir: git checkout $CURRENT_BRANCH"
    fi
    ;;
    
  SPLIT)
    echo "== MODE: SPLIT (report-only, buckets scopés) =="
    echo "Génération des buckets de triage (suggestions git add)..."
    echo
    
    # Bucket: app UI core
    {
      echo "$MODIFIED" | grep "^app/src/core/ui/" || true
      echo "$MODIFIED" | grep "^app/src/styles/" || true
      echo "$UNTRACKED" | grep "^app/src/core/ui/" || true
      echo "$UNTRACKED" | grep "^app/src/styles/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_app_ui_$TS.txt" || touch "$TRIAGE_DIR/bucket_app_ui_$TS.txt"
    
    # Bucket: app pages CP
    {
      echo "$MODIFIED" | grep "^app/src/pages/cp/" || true
      echo "$DELETED" | grep "^app/src/pages/cp/" || true
      echo "$UNTRACKED" | grep "^app/src/pages/cp/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_app_pages_cp_$TS.txt" || touch "$TRIAGE_DIR/bucket_app_pages_cp_$TS.txt"
    
    # Bucket: app pages APP
    {
      echo "$MODIFIED" | grep "^app/src/pages/app/" || true
      echo "$DELETED" | grep "^app/src/pages/app/" || true
      echo "$UNTRACKED" | grep "^app/src/pages/app/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_app_pages_app_$TS.txt" || touch "$TRIAGE_DIR/bucket_app_pages_app_$TS.txt"
    
    # Bucket: modules UI
    {
      echo "$MODIFIED" | grep "^modules/core-system/ui/" || true
      echo "$UNTRACKED" | grep "^modules/core-system/ui/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_modules_ui_$TS.txt" || touch "$TRIAGE_DIR/bucket_modules_ui_$TS.txt"
    
    # Bucket: scripts gates
    {
      echo "$MODIFIED" | grep "^scripts/gates/" || true
      echo "$UNTRACKED" | grep "^scripts/gates/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_scripts_gates_$TS.txt" || touch "$TRIAGE_DIR/bucket_scripts_gates_$TS.txt"
    
    # Bucket: server
    {
      echo "$MODIFIED" | grep "^server/" || true
      echo "$UNTRACKED" | grep "^server/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_server_$TS.txt" || touch "$TRIAGE_DIR/bucket_server_$TS.txt"
    
    # Bucket: docs
    {
      echo "$MODIFIED" | grep "^docs/" || true
      echo "$DELETED" | grep "^docs/" || true
      echo "$UNTRACKED" | grep "^docs/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_docs_$TS.txt" || touch "$TRIAGE_DIR/bucket_docs_$TS.txt"
    
    # Bucket: config
    {
      echo "$MODIFIED" | grep "^config/" || true
      echo "$UNTRACKED" | grep "^config/" || true
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_config_$TS.txt" || touch "$TRIAGE_DIR/bucket_config_$TS.txt"
    
    # Bucket: autres (catch-all) - fichiers non couverts par les buckets ci-dessus
    {
      if [ -n "$MODIFIED" ]; then
        echo "$MODIFIED" | grep -v "^app/src/core/ui/" | grep -v "^app/src/styles/" | grep -v "^app/src/pages/" | grep -v "^modules/core-system/ui/" | grep -v "^scripts/gates/" | grep -v "^server/" | grep -v "^docs/" | grep -v "^config/" || true
      fi
      if [ -n "$DELETED" ]; then
        echo "$DELETED" | grep -v "^app/src/pages/" | grep -v "^docs/" || true
      fi
      if [ -n "$UNTRACKED" ]; then
        echo "$UNTRACKED" | grep -v "^app/src/core/ui/" | grep -v "^app/src/styles/" | grep -v "^app/src/pages/" | grep -v "^modules/core-system/ui/" | grep -v "^scripts/gates/" | grep -v "^server/" | grep -v "^docs/" | grep -v "^config/" || true
      fi
    } | LC_ALL=C sort | grep -v '^$' > "$TRIAGE_DIR/bucket_other_$TS.txt" || touch "$TRIAGE_DIR/bucket_other_$TS.txt"
    
    echo "== BUCKETS GÉNÉRÉS (suggestions git add) =="
    for bucket in app_ui app_pages_cp app_pages_app modules_ui scripts_gates server docs config other; do
      file="$TRIAGE_DIR/bucket_${bucket}_$TS.txt"
      count=$(wc -l < "$file" | tr -d ' ')
      if [ "$count" -gt 0 ]; then
        echo
        echo "--- bucket_${bucket} ($count fichiers) ---"
        head -10 "$file"
        [ "$count" -gt 10 ] && echo "... (+$((count - 10)) fichiers, voir $file)"
        echo
        echo "# SUGGESTION (ne pas exécuter automatiquement):"
        if [ "$count" -le 10 ]; then
          files_list="$(cat "$file" | tr '\n' ' ' | sed 's/ $//')"
          [ -n "$files_list" ] && echo "git add $files_list" || echo "# (fichiers vides)"
        else
          files_list="$(head -5 "$file" | tr '\n' ' ' | sed 's/ $//')"
          [ -n "$files_list" ] && echo "git add $files_list" || echo "# (fichiers vides)"
          echo "# ... et $(($count - 5)) autres (voir $file pour la liste complète)"
        fi
      fi
    done
    echo
    echo "== FICHIERS DE TRIAGE =="
    echo "Tous les buckets et diagnostics dans: $TRIAGE_DIR/"
    ls -lh "$TRIAGE_DIR"/*"$TS"* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    ;;
    
  *)
    echo "ERR: MODE invalide: $MODE (doit être STASH|BRANCH|SPLIT)"
    exit 20
    ;;
esac

echo
echo "============================================================"
echo "TRIAGE COMPLET"
echo "============================================================"
echo "MODE: $MODE"
echo "TIMESTAMP: $TS"
echo "OUTPUTS: $TRIAGE_DIR/"
echo
echo "OK: Diagnostic + triage exécuté (idempotent, aucun changement de contenu)."
