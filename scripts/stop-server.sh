#!/usr/bin/env bash
# ICONTROL_STOP_SERVER_V1
# Arrête le serveur iCONTROL

PID_FILE="/tmp/icontrol-server.pid"

if [ -f "$PID_FILE" ]; then
    PID="$(cat "$PID_FILE" 2>/dev/null | tr -d ' \n\r\t')"
    if [ -n "$PID" ]; then
        # Tuer le processus et ses enfants
        kill -TERM "$PID" 2>/dev/null || true
        sleep 2
        kill -KILL "$PID" 2>/dev/null || true
        
        # Tuer aussi par nom
        pkill -f "runtime-config-server.js" 2>/dev/null || true
        pkill -f "local:web:serve" 2>/dev/null || true
        
        echo "Serveur arrêté (PID: $PID)"
    fi
    rm -f "$PID_FILE"
else
    # Essayer de tuer par nom
    pkill -f "runtime-config-server.js" 2>/dev/null && echo "Serveur arrêté" || echo "Aucun serveur actif"
fi

rm -f /tmp/icontrol-local-web.port
