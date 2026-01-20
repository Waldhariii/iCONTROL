#!/usr/bin/env bash
# ICONTROL_LAUNCHER_MAC_V1
# Launcher pour Mac - Double-clic pour démarrer iCONTROL

set -euo pipefail

# Déterminer le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Aller dans le répertoire racine
cd "$ROOT"

# Vérifier que Node.js est installé
if ! command -v node >/dev/null 2>&1; then
    osascript -e 'display dialog "Node.js n'\''est pas installé. Veuillez installer Node.js depuis https://nodejs.org/" buttons {"OK"} default button "OK" with title "iCONTROL - Erreur"'
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm >/dev/null 2>&1; then
    osascript -e 'display dialog "npm n'\''est pas installé. Veuillez installer npm." buttons {"OK"} default button "OK" with title "iCONTROL - Erreur"'
    exit 1
fi

# Afficher une notification de démarrage
osascript -e 'display notification "Démarrage de iCONTROL..." with title "iCONTROL"'

# Lancer le script local-web.sh
exec "$SCRIPT_DIR/local-web.sh"
