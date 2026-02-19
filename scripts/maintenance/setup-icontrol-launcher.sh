#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

echo "=== 0) Preflight ==="
test -f package.json || { echo "ERR: package.json introuvable dans $ROOT"; exit 1; }
test -f scripts/maintenance/full-local-stack-boot.sh || { echo "ERR: script manquant: scripts/maintenance/full-local-stack-boot.sh"; exit 1; }

echo
echo "=== 1) Rendre le launcher exécutable + sanity ==="
chmod +x scripts/maintenance/full-local-stack-boot.sh
bash -n scripts/maintenance/full-local-stack-boot.sh

echo
echo "=== 2) Injecter scripts pnpm (idempotent) ==="
python3 - <<'PY'
import json, pathlib
p = pathlib.Path("package.json")
data = json.loads(p.read_text(encoding="utf-8"))
scripts = data.setdefault("scripts", {})

# Launcher principal
scripts.setdefault("icontrol:start", "bash scripts/maintenance/full-local-stack-boot.sh")

# Entrées "single-service" utiles (exécution directe)
scripts.setdefault("icontrol:cp", "cd apps/control-plane && VITE_APP_KIND=CONTROL_PLANE pnpm dev -- --port 5173 --strictPort")
scripts.setdefault("icontrol:api:build", "cd platform/api && pnpm run build")
scripts.setdefault("icontrol:api:start", "cd platform/api && PORT=7070 node dist/index.js")

# Ops / diagnostics rapides
scripts.setdefault("icontrol:ports", "bash -lc 'lsof -nP -iTCP:5173 -sTCP:LISTEN || true; lsof -nP -iTCP:7070 -sTCP:LISTEN || true'")
scripts.setdefault("icontrol:stop", "bash -lc 'lsof -ti:5173 | xargs kill -9 2>/dev/null || true; lsof -ti:7070 | xargs kill -9 2>/dev/null || true; pkill -f vite 2>/dev/null || true'")

p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("OK: scripts ajoutés/confirmés dans package.json")
PY

echo
echo "=== 3) Afficher les scripts icontrol:* ==="
node -e "
const p = require('./package.json');
const s = p.scripts || {};
Object.keys(s).filter(k => k.startsWith('icontrol:')).sort().forEach(k => console.log(k + ' -> ' + s[k]));
"

echo
echo "=================================================="
echo "LAUNCHER READY ✅"
echo "Run:"
echo "  pnpm icontrol:start"
echo
echo "Ops:"
echo "  pnpm icontrol:ports"
echo "  pnpm icontrol:stop"
echo "=================================================="
