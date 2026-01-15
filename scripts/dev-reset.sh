#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Default ports
APP_PORT="${APP_PORT:-5176}"
CP_PORT="${CP_PORT:-5177}"

bash ./scripts/kill-port.sh "$APP_PORT" || true
bash ./scripts/kill-port.sh "$CP_PORT" || true

echo "OK: dev ports reset (app=${APP_PORT}, cp=${CP_PORT})"
