#!/bin/bash

echo "=========================================="
echo "🚀 DÉMARRAGE TEST iCONTROL"
echo "=========================================="
echo ""

cleanup() {
  echo ""
  echo "Arrêt des serveurs..."
  kill $(jobs -p) 2>/dev/null
  exit
}

trap cleanup SIGINT SIGTERM

# Démarrer le serveur API
echo "1. Démarrage Server API (port 3001)..."
cd server && npm start &
sleep 3

# Démarrer APP en mode CP (correction : c'est app/ pas control-plane/)
echo "2. Démarrage APP en mode CP (port 5177)..."
cd ../app && VITE_APP_KIND=CONTROL_PLANE npm run dev -- --port 5177 &
sleep 5

echo ""
echo "=========================================="
echo "✅ SERVEURS DÉMARRÉS"
echo "=========================================="
echo ""
echo "📍 URLs:"
echo "  API: http://localhost:3001"
echo "  CP:  http://127.0.0.1:5177"
echo ""
echo "🧪 Test de la page dynamique:"
echo "  http://127.0.0.1:5177/#/dynamic-test"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

wait
