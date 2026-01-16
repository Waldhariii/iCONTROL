#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Prefer node from PATH; fail fast with a clear message.
if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display dialog "Node.js est requis (node introuvable). Installe Node 20+ puis réessaie." buttons {"OK"} default button 1' >/dev/null 2>&1 || true
  exit 1
fi

npm run local:web
