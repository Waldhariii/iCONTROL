#!/usr/bin/env bash
# =============================================================================
# iCONTROL — Lancer API (7070) + Cockpit CP (5173)
# Racine: depuis la racine du repo iCONTROL.
# =============================================================================
# Usage:
#   Terminal 1 — API :
#     PORT=7070 npm run server:dev
#   Terminal 2 — Cockpit :
#     VITE_APP_KIND=CONTROL_PLANE npm --prefix apps/control-plane run dev -- --host 127.0.0.1 --port 5173 --strictPort
#
# URLs:
#   API  : http://127.0.0.1:7070
#   CP   : http://127.0.0.1:5173
# =============================================================================

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"
cd "$ROOT"

echo "iCONTROL — API 7070 + CP 5173"
echo "ROOT=$ROOT"
echo
echo "Terminal 1 (API) :"
echo "  PORT=7070 npm run server:dev"
echo
echo "Terminal 2 (Cockpit) :"
echo "  VITE_APP_KIND=CONTROL_PLANE npm --prefix apps/control-plane run dev -- --host 127.0.0.1 --port 5173 --strictPort"
echo
echo "URLs: API http://127.0.0.1:7070  |  CP http://127.0.0.1:5173"
echo "DONE."
