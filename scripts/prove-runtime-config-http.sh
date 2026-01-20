#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4178}"

for p in 4178 4179 4180 4181 4182; do
  if ! lsof -iTCP:$p -sTCP:LISTEN -nP >/dev/null 2>&1; then PORT=$p; break; fi
done

echo "[INFO] Using PORT=$PORT"

ICONTROL_LOCAL_HOST=127.0.0.1 ICONTROL_LOCAL_PORT=$PORT \
  node ./server/runtime-config-server.js --host 127.0.0.1 --port $PORT --dist ./dist > /tmp/icontrol_rc_server.log 2>&1 &
RC_PID=$!
sleep 1

HDR="/tmp/icontrol_rc_hdr.txt"
BODY="/tmp/icontrol_rc_body.json"

curl -sS -D "$HDR" "http://127.0.0.1:${PORT}/api/runtime/config" -o "$BODY" || true

kill "$RC_PID" 2>/dev/null || true
wait "$RC_PID" 2>/dev/null || true

STATUS="$(awk 'NR==1{print $2}' "$HDR" | tr -d '\r')"
CT="$(grep -i '^content-type:' "$HDR" | head -n1 | cut -d: -f2- | xargs || true)"
CC="$(grep -i '^cache-control:' "$HDR" | head -n1 | cut -d: -f2- | xargs || true)"

if [ "${STATUS:-}" != "200" ]; then
  echo "[FAIL] Expected 200, got: ${STATUS:-<none>}"
  echo "---- headers ----"; sed -n '1,80p' "$HDR" || true
  echo "---- body ----"; sed -n '1,120p' "$BODY" || true
  exit 1
fi

echo "[OK] status=200"
echo "[INFO] content-type=$CT"
echo "[INFO] cache-control=$CC"

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
HASH="$(shasum -a 256 "$BODY" | awk '{print $1}')"

SAMPLE="$(node - <<'NODE'
const fs = require("fs");
try {
  let s = fs.readFileSync("/tmp/icontrol_rc_body.json", "utf8");
  s = s.replace(/\r?\n/g, " ");
  process.stdout.write(s.slice(0, 200));
} catch (e) {
  process.stdout.write("unreadable:" + String(e));
}
NODE
)"

mkdir -p proofs
cat > proofs/PROOFS_RUNTIME_CONFIG_HTTP.json <<JSON
{
  "kind": "ICONTROL_RUNTIME_CONFIG_HTTP_PROOF_V1",
  "ts": "$TS",
  "endpoint": "/api/runtime/config",
  "status": 200,
  "headers": {
    "content-type": "$CT",
    "cache-control": "$CC"
  },
  "body_sha256": "$HASH",
  "body_sample_first_200": "$(printf "%s" "$SAMPLE" | sed 's/"/\\"/g')"
}
JSON

echo "[OK] wrote proofs/PROOFS_RUNTIME_CONFIG_HTTP.json"
