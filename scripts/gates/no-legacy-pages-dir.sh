#!/usr/bin/env bash
set -euo pipefail
# Interdit de re-créer un répertoire pages/ qui devient un dumping ground.
# Si tu en as encore, tu le gardes temporairement mais tu dois planifier sa migration.
# Ici on check "app/src/pages" (legacy). Si présent et non vide => WARN (pas FAIL) pour démarrer.
if [[ -d "app/src/pages" ]]; then
  cnt="$(find app/src/pages -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$cnt" != "0" ]]; then
    echo "[gate][WARN] legacy app/src/pages contains $cnt TS/TSX files. Target is surfaces/**."
    exit 0
  fi
fi
echo "[gate][OK] no surfaces baseline content detected."
