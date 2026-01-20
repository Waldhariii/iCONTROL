#!/usr/bin/env bash
# ICONTROL_APP_CLIENT_LAUNCHER_V1
# Lance l'application CLIENT et ouvre le navigateur

# Désactiver la sortie immédiate en cas d'erreur
set +euo pipefail 2>/dev/null || true

# Charger le PATH complet (Homebrew sur Mac)
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Log file pour debug
LOG_FILE="/tmp/icontrol-client.log"
echo "=== iCONTROL Client Launch $(date) ===" > "$LOG_FILE"

# Charger le profil shell si disponible (pour nvm, etc.)
if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc" 2>>"$LOG_FILE" || true
elif [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile" 2>>"$LOG_FILE" || true
elif [ -f "$HOME/.profile" ]; then
    source "$HOME/.profile" 2>>"$LOG_FILE" || true
fi

# Obtenir le chemin absolu du projet (chemin fixe)
ROOT="/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL"

echo "ROOT: $ROOT" >> "$LOG_FILE"
echo "PATH: $PATH" >> "$LOG_FILE"

# Vérifier que le répertoire existe
if [ ! -d "$ROOT" ]; then
    osascript -e "display dialog \"Le répertoire du projet iCONTROL est introuvable:\n\n$ROOT\n\nVérifiez que le projet est bien installé à cet emplacement.\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\"" 2>>"$LOG_FILE"
    cat "$LOG_FILE"
    sleep 3
    exit 1
fi

cd "$ROOT" 2>>"$LOG_FILE" || {
    osascript -e "display dialog \"Impossible de changer vers le répertoire:\n\n$ROOT\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\"" 2>>"$LOG_FILE"
    cat "$LOG_FILE"
    sleep 3
    exit 1
}

# Vérifier Node.js avec chemin complet ou PATH
NODE_CMD=""
if [ -x "/opt/homebrew/bin/node" ]; then
    NODE_CMD="/opt/homebrew/bin/node"
    echo "Node.js trouvé: $NODE_CMD" >> "$LOG_FILE"
elif command -v node >/dev/null 2>&1; then
    NODE_CMD="$(command -v node)"
    echo "Node.js trouvé via PATH: $NODE_CMD" >> "$LOG_FILE"
else
    echo "ERREUR: Node.js introuvable" >> "$LOG_FILE"
    cat "$LOG_FILE"
    osascript -e 'display dialog "Node.js n'\''est pas installé.\nVeuillez installer Node.js depuis https://nodejs.org/\n\nOu installez via Homebrew:\nbrew install node" buttons {"OK"} default button "OK" with title "iCONTROL Client - Erreur"'
    sleep 3
    exit 1
fi

"$NODE_CMD" --version >> "$LOG_FILE" 2>&1

# Vérifier npm
NPM_CMD=""
if [ -x "/opt/homebrew/bin/npm" ]; then
    NPM_CMD="/opt/homebrew/bin/npm"
elif command -v npm >/dev/null 2>&1; then
    NPM_CMD="$(command -v npm)"
else
    echo "ERREUR: npm introuvable" >> "$LOG_FILE"
    cat "$LOG_FILE"
    osascript -e 'display dialog "npm n'\''est pas installé.\nVeuillez installer npm avec Node.js." buttons {"OK"} default button "OK" with title "iCONTROL Client - Erreur"'
    sleep 3
    exit 1
fi

export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"

# Port par défaut
PORT="${ICONTROL_LOCAL_PORT:-4176}"
HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"

# Vérifier si le serveur tourne déjà
if [ -f "$PORT_FILE" ]; then
    PORT="$(cat "$PORT_FILE" 2>/dev/null | tr -d ' \n\r\t' || echo "$PORT")"
fi

echo "Port: $PORT" >> "$LOG_FILE"

# Vérifier si le serveur répond
if curl -s "http://${HOST}:${PORT}/app/" >/dev/null 2>&1; then
    echo "Serveur déjà actif, ouverture du navigateur" >> "$LOG_FILE"
    open "http://${HOST}:${PORT}/app/#/login" 2>>"$LOG_FILE" || true
    sleep 1
    exit 0
fi

# Afficher notification
osascript -e 'display notification "Démarrage du serveur iCONTROL Client..." with title "iCONTROL"' 2>>"$LOG_FILE" || true

# Démarrer le serveur en arrière-plan si nécessaire
if ! pgrep -f "runtime-config-server.js" >/dev/null 2>&1; then
    echo "Démarrage du serveur..." >> "$LOG_FILE"
    
    # Vérifier dans le bon répertoire
    cd "$ROOT" || exit 1
    echo "Répertoire actuel: $(pwd)" >> "$LOG_FILE"
    
    # ICONTROL_AUTO_REBUILD_V1: Toujours reconstruire pour s'assurer d'avoir la dernière version
    echo "Reconstruction automatique de l'application..." >> "$LOG_FILE"
    
    # Arrêter le serveur existant avant le rebuild
    echo "Arrêt du serveur existant..." >> "$LOG_FILE"
    bash "$ROOT/scripts/stop-server.sh" >> "$LOG_FILE" 2>&1 || true
    sleep 1
    
    # Note: Le build utilise --prefix app, donc dist/ est créé dans app/dist/ ou ROOT/dist/
    DIST_APP="$ROOT/dist/app"
    DIST_CP="$ROOT/dist/cp"
    DIST_APP_ALT="$ROOT/app/dist/app"
    DIST_CP_ALT="$ROOT/app/dist/cp"
    
    # Toujours reconstruire pour avoir la dernière version
    echo "Build en cours..." >> "$LOG_FILE"
    osascript -e 'display notification "Reconstruction en cours... Cela peut prendre quelques secondes" with title "iCONTROL"' 2>>"$LOG_FILE" || true
    echo "Lancement du build depuis: $(pwd)" >> "$LOG_FILE"
    PATH="/opt/homebrew/bin:$PATH" "$NPM_CMD" run local:web:build >>"$LOG_FILE" 2>&1
    BUILD_EXIT=$?
    echo "Build terminé avec code: $BUILD_EXIT" >> "$LOG_FILE"
        
    # Vérifier à nouveau dans le bon répertoire après le build
    cd "$ROOT" || exit 1
    echo "Vérification après build dans: $(pwd)" >> "$LOG_FILE"
    ls -la "$ROOT/dist/" >> "$LOG_FILE" 2>&1 || echo "dist/ n'existe toujours pas" >> "$LOG_FILE"
    
    if [ $BUILD_EXIT -ne 0 ]; then
        echo "ERREUR: Build a échoué avec code $BUILD_EXIT" >> "$LOG_FILE"
        cat "$LOG_FILE"
        osascript -e "display dialog \"Erreur lors du build (code $BUILD_EXIT).\n\nConsultez le log:\n$LOG_FILE\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\"" 2>>"$LOG_FILE" || true
        sleep 5
        exit 1
    fi
        
    # Vérifier les deux emplacements possibles
    if [ -d "$DIST_APP" ]; then
        ACTUAL_DIST_APP="$DIST_APP"
    elif [ -d "$DIST_APP_ALT" ]; then
        ACTUAL_DIST_APP="$DIST_APP_ALT"
    else
        ACTUAL_DIST_APP=""
    fi
    
    if [ -d "$DIST_CP" ]; then
        ACTUAL_DIST_CP="$DIST_CP"
    elif [ -d "$DIST_CP_ALT" ]; then
        ACTUAL_DIST_CP="$DIST_CP_ALT"
    else
        ACTUAL_DIST_CP=""
    fi
    
    if [ -z "$ACTUAL_DIST_APP" ] || [ -z "$ACTUAL_DIST_CP" ] || [ ! -f "$ACTUAL_DIST_APP/index.html" ] || [ ! -f "$ACTUAL_DIST_CP/index.html" ]; then
        echo "ERREUR: Fichiers manquants après build" >> "$LOG_FILE"
        echo "Recherche dist/app dans $ROOT/dist/app:" >> "$LOG_FILE"
        ls -la "$ROOT/dist/app/" >> "$LOG_FILE" 2>&1 || echo "ROOT/dist/app/ n'existe pas" >> "$LOG_FILE"
        echo "Recherche dist/app dans $ROOT/app/dist/app:" >> "$LOG_FILE"
        ls -la "$ROOT/app/dist/app/" >> "$LOG_FILE" 2>&1 || echo "ROOT/app/dist/app/ n'existe pas" >> "$LOG_FILE"
        echo "Recherche dist/cp dans $ROOT/dist/cp:" >> "$LOG_FILE"
        ls -la "$ROOT/dist/cp/" >> "$LOG_FILE" 2>&1 || echo "ROOT/dist/cp/ n'existe pas" >> "$LOG_FILE"
        echo "Recherche dist/cp dans $ROOT/app/dist/cp:" >> "$LOG_FILE"
        ls -la "$ROOT/app/dist/cp/" >> "$LOG_FILE" 2>&1 || echo "ROOT/app/dist/cp/ n'existe pas" >> "$LOG_FILE"
        cat "$LOG_FILE"
        osascript -e "display dialog \"Les fichiers dist/ ne sont pas présents après le build.\n\nConsultez le log:\n$LOG_FILE\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\"" 2>>"$LOG_FILE" || true
        sleep 5
        exit 1
    fi
    
    echo "Build réussi! Fichiers présents dans:" >> "$LOG_FILE"
    echo "  - $ACTUAL_DIST_APP" >> "$LOG_FILE"
    echo "  - $ACTUAL_DIST_CP" >> "$LOG_FILE"
    
    # Si dist/ est dans app/, créer un lien symbolique vers la racine
    if [ "$ACTUAL_DIST_APP" = "$DIST_APP_ALT" ]; then
        echo "dist/ est dans app/, création d'un lien symbolique..." >> "$LOG_FILE"
        ln -sf "$ROOT/app/dist" "$ROOT/dist" 2>>"$LOG_FILE" || true
        ACTUAL_DIST_APP="$ROOT/dist/app"
        ACTUAL_DIST_CP="$ROOT/dist/cp"
    fi
    osascript -e 'display notification "Build terminé!" with title "iCONTROL"' 2>>"$LOG_FILE" || true
    
    # Démarrer le serveur en arrière-plan avec nohup pour le garder actif
    echo "Démarrage du serveur avec nohup..." >> "$LOG_FILE"
    cd "$ROOT" || exit 1
    
    # S'assurer que le lien symbolique dist/ existe
    if [ ! -d "$ROOT/dist" ] && [ -d "$ROOT/app/dist" ]; then
        echo "Création du lien symbolique dist/..." >> "$LOG_FILE"
        ln -sf "$ROOT/app/dist" "$ROOT/dist" 2>>"$LOG_FILE" || true
    fi
    
    # Vérifier que dist/ existe avant de démarrer le serveur
    if [ ! -d "$ROOT/dist/app" ] && [ ! -d "$ROOT/app/dist/app" ]; then
        echo "ERREUR: dist/app n'existe ni dans ROOT/dist ni dans ROOT/app/dist" >> "$LOG_FILE"
        osascript -e "display dialog \"Le répertoire dist/app est introuvable.\n\nConsultez le log:\n$LOG_FILE\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\"" 2>>"$LOG_FILE" || true
        cat "$LOG_FILE"
        sleep 5
        exit 1
    fi
    
    nohup bash -c "PATH='/opt/homebrew/bin:$PATH' '$NPM_CMD' run local:web:serve" >>/tmp/icontrol-server.log 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > /tmp/icontrol-server.pid
    echo "$PORT" > /tmp/icontrol-local-web.port
    echo "Serveur démarré avec PID: $SERVER_PID" >> "$LOG_FILE"
    
    # Attendre que le serveur soit prêt (optimisé pour démarrage rapide)
    MAX_WAIT=15
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if curl -s "http://${HOST}:${PORT}/app/" >/dev/null 2>&1; then
            echo "Serveur prêt après $WAITED secondes" >> "$LOG_FILE"
            break
        fi
        sleep 0.5
        WAITED=$((WAITED + 1))
        if [ $((WAITED % 2)) -eq 0 ]; then
            echo "En attente du serveur... ($WAITED/$MAX_WAIT secondes)" >> "$LOG_FILE"
        fi
    done
    
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "ERREUR: Serveur non démarré après $MAX_WAIT secondes" >> "$LOG_FILE"
        echo "Vérification du processus:" >> "$LOG_FILE"
        ps -p $SERVER_PID >> "$LOG_FILE" 2>&1 || echo "Processus $SERVER_PID non trouvé" >> "$LOG_FILE"
        echo "Dernières lignes du log serveur:" >> "$LOG_FILE"
        tail -20 /tmp/icontrol-server.log >> "$LOG_FILE" 2>&1
        osascript -e "display dialog \"Le serveur n'a pas démarré après $MAX_WAIT secondes.\n\nConsultez les logs:\n$LOG_FILE\n\n/tmp/icontrol-server.log\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\""
        cat "$LOG_FILE"
        sleep 5
        # Ne pas sortir, ouvrir quand même le navigateur
    fi
fi

# Attendre un peu pour s'assurer que le serveur répond
sleep 1

# Vérifier que le serveur répond avant d'ouvrir
if curl -s "http://${HOST}:${PORT}/app/" >/dev/null 2>&1; then
    echo "Serveur répond, ouverture du navigateur..." >> "$LOG_FILE"
    open "http://${HOST}:${PORT}/app/#/login" 2>>"$LOG_FILE" || true
else
    echo "ERREUR: Serveur ne répond toujours pas" >> "$LOG_FILE"
    osascript -e "display dialog \"Le serveur ne répond pas.\n\nURL: http://${HOST}:${PORT}/app/\n\nConsultez les logs:\n$LOG_FILE\n\n/tmp/icontrol-server.log\" buttons {\"OK\"} default button \"OK\" with title \"iCONTROL Client - Erreur\""
    cat "$LOG_FILE"
fi

# Ne pas fermer immédiatement, laisser un moment
sleep 1

# Sortir sans erreur (le serveur continue en arrière-plan)
exit 0
