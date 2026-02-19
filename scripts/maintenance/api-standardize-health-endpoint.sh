#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
API_DIR="$ROOT/platform/api"
cd "$API_DIR"

TS_FILE="$API_DIR/src/index.ts"

# rg or grep
if command -v rg >/dev/null 2>&1; then
  SEARCH() { rg -n "$@" "$TS_FILE" || true; }
else
  SEARCH() { grep -n "$1" "$TS_FILE" || true; }
fi

echo "=================================================="
echo "iCONTROL API — Standardize health endpoint to /api/v1/health"
echo "Keep /health and /api/health as aliases"
echo "Target: $TS_FILE"
echo "=================================================="

echo "=== 1) Pre-check: show current health routes ==="
SEARCH "app\.get\('/health'|app\.get\('/api/health'|app\.get\('/api/v1/health'"
echo

echo "=== 2) Patch src/index.ts (idempotent) ==="
python3 - <<'PY'
import re, pathlib

# Run from API_DIR (script did cd "$API_DIR")
p = pathlib.Path("src/index.ts")
if not p.exists():
    raise SystemExit("ERR: src/index.ts not found (run from platform/api)")
s = p.read_text(encoding="utf-8")

has_v1 = re.search(r"app\.get\(\s*['\"]/api/v1/health['\"]", s) is not None

# Match /health then /api/health blocks (flexible whitespace)
pattern = re.compile(
    r"app\.get\(\s*['\"]/health['\"][\s\S]*?\n\}\);\s*\n\s*"
    r"app\.get\(\s*['\"]/api/health['\"][\s\S]*?\n\}\);\s*\n",
    re.M
)

replacement = """
// --------------------------------------------------
// Health endpoints (SSOT)
// Canonical: /api/v1/health
// Aliases  : /health, /api/health (backward compatibility)
// --------------------------------------------------
function healthPayload(dbOk: boolean) {
  return { status: "ok", db: dbOk ? "connected" : "degraded" };
}

function healthHandler(req: any, res: any) {
  let dbOk = true;
  try {
    (globalThis as any).__ICONTROL_HEALTH_LAST__ = Date.now();
    if (typeof db !== "undefined" && db && typeof db.prepare === "function") {
      (db as any).prepare("SELECT 1 as ok").get();
    }
  } catch {
    dbOk = false;
  }
  return res.status(200).json(healthPayload(dbOk));
}

app.get("/api/v1/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

"""

m = pattern.search(s)
if m:
  s2 = s[:m.start()] + replacement + s[m.end():]
else:
  anchor = re.search(r"app\.use\(\s*express\.json\(\)\s*\);\s*", s)
  if not anchor:
    raise SystemExit("ERR: could not find anchor app.use(express.json()); to insert health endpoints")
  insert_at = anchor.end()
  s2 = s[:insert_at] + "\n" + replacement + "\n" + s[insert_at:]

# If original had /api/v1/health but not aliases, add alias lines after it
if has_v1 and re.search(r"app\.get\(\s*['\"]/api/health['\"]", s2) is None:
  s2 = re.sub(
    r"(app\.get\(\s*['\"]/api/v1/health['\"][^\n]*\);)",
    r"\1\napp.get(\"/api/health\", healthHandler);\napp.get(\"/health\", healthHandler);",
    s2,
    count=1
  )

p.write_text(s2, encoding="utf-8")
print("OK: patched src/index.ts")
PY

echo
echo "=== 3) Verify routes now present ==="
SEARCH 'app\.get\("/api/v1/health"|app\.get\("/api/health"|app\.get\("/health"'
echo

echo "=== 4) Build API (dist/) ==="
pnpm -C "$API_DIR" run build

echo
echo "=== 5) Quick smoke (run start in foreground) ==="
echo "Tip: if API already running on 7070, stop it first."
P7070="$(lsof -nP -iTCP:7070 -sTCP:LISTEN -t 2>/dev/null | head -n 5 | tr '\n' ' ' || true)"
if [ -n "$P7070" ]; then
  echo "Killing PIDs on 7070: $P7070"
  echo "$P7070" | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

PORT=7070 pnpm -C "$API_DIR" run start &
API_PID=$!

sleep 1
echo
echo "=== 6) Probe endpoints ==="
set +e
for u in \
  "http://localhost:7070/api/v1/health" \
  "http://localhost:7070/api/health" \
  "http://localhost:7070/health"
do
  code="$(curl -sS -o /tmp/_health.out -w "%{http_code}" "$u" 2>/dev/null || true)"
  echo "$u -> HTTP $code"
  head -5 /tmp/_health.out 2>/dev/null || true
  echo "----"
done
set -e

echo
echo "=== 7) Keep API running? ==="
echo "API_PID=$API_PID"
echo "If you want to stop it now: kill $API_PID"
echo "DONE."
