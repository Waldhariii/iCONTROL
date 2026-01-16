#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Prefer node from PATH; fail fast with a clear message.
if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display dialog "Node.js est requis (node introuvable). Installe Node 20+ puis réessaie." buttons {"OK"} default button 1' >/dev/null 2>&1 || true
  exit 1
fi

PORT="${ICONTROL_LOCAL_PORT:-4176}"
HOST="127.0.0.1"
BASE="http://${HOST}:${PORT}"

# Start server in background (detached)
# NOTE: assumes P0.9 server entry exists at server/runtime-config-server.ts compiled or runnable.
# We run via node on built JS if present; else fallback to ts-node is not assumed.
# Preferred: a package.json script "local:web" should exist; if not, we run a minimal node command.
if npm run -s | grep -qE '(^| )local:web( |$)'; then
  nohup npm run -s local:web -- --host "$HOST" --port "$PORT" >/tmp/icontrol-local-web.log 2>&1 &
else
  # Fallback: try node entry if provided by repo (adjust if your server file differs)
  if [ -f "server/runtime-config-server.js" ]; then
    nohup node "server/runtime-config-server.js" --host "$HOST" --port "$PORT" >/tmp/icontrol-local-web.log 2>&1 &
  else
    osascript -e 'display dialog "Script local:web manquant. Ajoute le script package.json (local:web) ou un server/runtime-config-server.js." buttons {"OK"} default button 1' >/dev/null 2>&1 || true
    exit 1
  fi
fi

# Small delay for server boot
sleep 0.4

# Open both surfaces
open "${BASE}/app/#/login" >/dev/null 2>&1 || true
open "${BASE}/cp/#/login" >/dev/null 2>&1 || true

exit 0
