#!/usr/bin/env bash
# ICONTROL_REBUILD_AND_SERVE_V1
# Reconstruit l'application et relance le serveur automatiquement

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "🔨 Reconstruction de l'application..."
npm run local:web:build

echo ""
echo "🛑 Arrêt du serveur existant (s'il y en a un)..."
bash scripts/stop-server.sh || true

echo ""
echo "🚀 Lancement du serveur..."
# Lancer le serveur en arrière-plan
npm run local:web:serve > /tmp/icontrol-server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > /tmp/icontrol-server.pid

# Attendre que le serveur démarre
echo "⏳ Attente du démarrage du serveur (max 15 secondes)..."
for i in {1..15}; do
  sleep 1
  if grep -q "ICONTROL_LOCAL_WEB_READY" /tmp/icontrol-server.log 2>/dev/null; then
    echo "✅ Serveur démarré avec succès (PID: $SERVER_PID)"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "⚠️  Le serveur semble prendre plus de temps que prévu."
    echo "   Vérifiez les logs: tail -f /tmp/icontrol-server.log"
  fi
done

echo ""
echo "🌐 Ouverture du navigateur..."
sleep 2
if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:4176/app/#/login" 2>/dev/null && echo "✅ Navigateur ouvert" || echo "⚠️  Ouvrez manuellement: http://127.0.0.1:4176/app/#/login"
else
  echo "⚠️  Commande 'open' non disponible. Ouvrez manuellement: http://127.0.0.1:4176/app/#/login"
fi

echo ""
echo "📋 URLs disponibles:"
echo "   - Client: http://127.0.0.1:4176/app/#/login"
echo "   - Administration: http://127.0.0.1:4176/cp/#/login"
echo ""
echo "📝 Logs du serveur: tail -f /tmp/icontrol-server.log"
echo "🛑 Pour arrêter: bash scripts/stop-server.sh"