#!/usr/bin/env bash
set -euo pipefail

# OBJECTIF
# - Tu as un working tree avec des centaines de "D" (suppressions) + des dossiers "??" (nouveaux).
# - Ce script te met en mode "pilotage contrôlé" avec 2 options:
#   MODE=revert : on revient EXACTEMENT à HEAD (annule suppressions/modifs) + nettoyage untracked (sauf ce que tu whitelistes)
#   MODE=adopt  : on assume la refonte (rename/move) => on stage tout (add -A) pour que Git puisse détecter les renommages, puis commit

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT"

TS="$(date -u +"%Y%m%d_%H%M%S")"
LOG="$ROOT/_audit/WIP_TREE_DECISION_${TS}.log"
mkdir -p "$ROOT/_audit"
exec > >(tee -a "$LOG") 2>&1

echo "====================================================================="
echo "RUN: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "ROOT=$ROOT"
echo "BRANCH=$(git rev-parse --abbrev-ref HEAD)"
echo "HEAD=$(git rev-parse HEAD)"
echo "LOG=$LOG"
echo "====================================================================="

MODE="${MODE:-}"
if [[ -z "$MODE" ]]; then
  echo "ERR: MODE non défini."
  echo "Utilise l'une des commandes suivantes:"
  echo "  MODE=revert bash $0"
  echo "  MODE=adopt  bash $0"
  exit 2
fi

echo
echo "=== 0) Snapshot avant action ==="
git status -sb || true
echo
echo "Counts:"
git status --porcelain | awk '
  $1 ~ /^D/ {d++}
  $1 ~ /^\?\?/ {u++}
  $1 ~ /^M/ {m++}
  END {printf("  D=%d  ??=%d  M=%d\n", d+0, u+0, m+0)}
' || true

case "$MODE" in
  revert)
    echo
    echo "=== MODE=revert : retour strict à HEAD + nettoyage untracked ==="
    echo "1) Annule toutes les suppressions/modifs tracked"
    git restore -SW . || true   # -S=staged, -W=worktree (si dispo)
    git reset --hard HEAD

    echo
    echo "2) Nettoyage des untracked (safe list) :"
    echo "   -> Par défaut on garde _audit/ (logs) et tout ce que tu veux whitelister."
    echo "   -> Ajuste la liste -e si tu veux préserver d'autres dossiers."
    git clean -fd \
      -e "_audit/" \
      -e ".env" \
      -e ".env.*" \
      -e "runtime/configs/" \
      -e "config/brand/brand.override.local.json" \
      -e "node_modules/" \
      || true

    echo
    echo "=== Post-check (revert) ==="
    git status -sb || true
    ;;

  adopt)
    echo
    echo "=== MODE=adopt : on assume la refonte (delete+add => rename detection) ==="
    echo "1) Stage complet (Git détectera les moves/renames au commit)"
    git add -A

    echo
    echo "2) Post-stage status + résumé"
    git status -sb || true
    echo
    git diff --cached --stat | sed -n '1,200p' || true

    echo
    echo "3) Commit (message standardisé)"
    MSG="${MSG:-"chore(repo): adopt new structure (moves/renames) + sync gates/docs"}"
    git commit -m "$MSG" || {
      echo "WARN: commit non créé (peut-être rien à commit)."
    }

    echo
    echo "=== Post-check (adopt) ==="
    git status -sb || true
    ;;

  *)
    echo "ERR: MODE invalide: $MODE (attendu: revert|adopt)"
    exit 3
    ;;
esac

echo
echo "DONE. Log: $LOG"
