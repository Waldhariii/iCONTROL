#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT"

TS="$(date -u +%Y%m%d_%H%M%S)"
LOG="runtime/reports/DEV_COCKPIT_CORS_RESCUE_${TS}.log"
mkdir -p runtime/reports

( set -x
  echo "====================================================================="
  echo "DEV COCKPIT CORS RESCUE (no-crash + loopback preflight) RUN_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "ROOT=$ROOT"
  echo "LOG=$LOG"
  echo "====================================================================="

  test ! -f ./CI_REPORT.md || { echo "ERR: root CI_REPORT.md forbidden"; exit 1; }

  echo
  echo "=== 1) Patch apps/backend-api/server.mjs (CORS preflight + json guard) ==="
  node --input-type=module - << "NODE"
import fs from "node:fs";

const p = "apps/backend-api/server.mjs";
let s = fs.readFileSync(p, "utf8");

function patchJsonGuard(src){
  const re = /function\s+json\s*\(\s*res\s*,\s*status\s*,\s*obj\s*(?:,\s*headers\s*)?\)\s*\{[\s\S]*?\n\}/m;
  const m = src.match(re);
  if (!m) return { src, changed:false, note:"json() not found" };
  const block = m[0];
  if (block.includes("res.writableEnded") || block.includes("res.headersSent")) {
    return { src, changed:false, note:"json() already guarded" };
  }
  let patched = block.replace(/\{\n/, "{\n  if (res.writableEnded) return;\n");
  patched = patched.replace(/res\.writeHead\s*\(/, "if (!res.headersSent) res.writeHead(");
  src = src.replace(block, patched);
  return { src, changed:true, note:"json() guarded" };
}

let changedAny = false;
const jg = patchJsonGuard(s);
s = jg.src; changedAny = changedAny || jg.changed;

const MARK_HELPER_BEGIN = "/* __IC_DEV_CORS_HELPER_BEGIN__ */";
const MARK_HELPER_END   = "/* __IC_DEV_CORS_HELPER_END__ */";

const helperBlock = MARK_HELPER_BEGIN + "\nfunction __icIsLoopbackHost(h) {\n  return h === \"127.0.0.1\" || h === \"localhost\" || h === \"::1\";\n}\nfunction __icDevCorsApply(req, res) {\n  const origin = String(req.headers[\"origin\"] || \"\");\n  const dev = String(req.headers[\"x-ic-dev\"] || \"\") === \"1\";\n  if (!dev) return { ok:false, handled:false };\n  try {\n    const u = new URL(origin);\n    if (!__icIsLoopbackHost(u.hostname)) return { ok:false, handled:false };\n  } catch {\n    return { ok:false, handled:false };\n  }\n  res.setHeader(\"Access-Control-Allow-Origin\", origin);\n  res.setHeader(\"Vary\", \"Origin\");\n  res.setHeader(\"Access-Control-Allow-Credentials\", \"true\");\n  res.setHeader(\"Access-Control-Allow-Headers\", \"content-type,x-ic-dev,x-ic-role-ids,authorization\");\n  res.setHeader(\"Access-Control-Allow-Methods\", \"GET,POST,PUT,PATCH,DELETE,OPTIONS\");\n  if (req.method === \"OPTIONS\") {\n    res.statusCode = 204;\n    res.end(\"\");\n    return { ok:true, handled:true };\n  }\n  return { ok:true, handled:false };\n}\n" + MARK_HELPER_END;

if (s.includes(MARK_HELPER_BEGIN) && s.includes(MARK_HELPER_END)) {
  s = s.replace(new RegExp(MARK_HELPER_BEGIN.replace(/[.*+?^${}()|[\]\\\\]/g, "\\\\$&") + "[\\\\s\\\\S]*?" + MARK_HELPER_END.replace(/[.*+?^${}()|[\]\\\\]/g, "\\\\$&"), "m"), helperBlock);
  changedAny = true;
} else if (!s.includes(MARK_HELPER_BEGIN)) {
  const anchor = "\n\n/* IC_BIND_CFG */";
  const idx = s.indexOf(anchor);
  if (idx !== -1) {
    s = s.slice(0, idx) + "\n\n" + helperBlock + anchor + s.slice(idx + anchor.length);
    changedAny = true;
  } else {
    s = helperBlock + "\n" + s;
    changedAny = true;
  }
}

const handlerRe = /(createServer\s*\(\s*(?:async\s*)?\(\s*req\s*,\s*res\s*\)\s*=>\s*\{)/m;
const hm = s.match(handlerRe);
if (hm && !s.includes("/* __IC_DEV_CORS_HANDLER_HOOK__ */")) {
  const head = hm[1];
  const hook = "/* __IC_DEV_CORS_HANDLER_HOOK__ */\n  const __icDev = __icDevCorsApply(req, res);\n  if (__icDev.handled) return;\n";
  s = s.replace(head, head + "\n" + hook);
  changedAny = true;
}

fs.writeFileSync(p, s, "utf8");
console.log("OK: patched", p, "changed=", changedAny, "json_guard=", jg.note);
NODE

  echo
  echo "=== 2) Syntax check ==="
  node --check apps/backend-api/server.mjs

  echo
  echo "=== 3) Restart API on 7070 and prove browser-safe preflight + feeds ==="
  lsof -nP -iTCP:7070 -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $2}' | sort -u | while read -r pid; do test -n "${pid:-}" && kill -9 "$pid" 2>/dev/null || true; done

  OUT="runtime/reports/API_DEV_7070.${TS}.stdout.log"
  ERR="runtime/reports/API_DEV_7070.${TS}.stderr.log"
  PORT=7070 HOST=127.0.0.1 CI=false nohup node apps/backend-api/server.mjs >"$OUT" 2>"$ERR" &
  API_PID=$!
  echo "API_PID=$API_PID"
  sleep 1.2

  curl -fsS "http://127.0.0.1:7070/api/health" >/dev/null || { echo "ERR: health not reachable"; tail -120 "$OUT" 2>/dev/null || true; tail -200 "$ERR" 2>/dev/null || true; kill -9 "$API_PID" 2>/dev/null || true; exit 1; }
  echo "OK: /api/health"

  code="$(curl -sS -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: http://127.0.0.1:5173" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: x-ic-dev,content-type" "http://127.0.0.1:7070/api/reports/latest?kind=gates" 2>/dev/null || echo "000")"
  echo "OPTIONS preflight -> HTTP $code"
  test "$code" = "204" || { echo "ERR: expected 204"; tail -160 "$ERR" 2>/dev/null || true; kill -9 "$API_PID" 2>/dev/null || true; exit 1; }

  body="/tmp/ic_body.$$"
  for path in "/api/releases/active" "/api/reports/latest?kind=gates" "/api/reports/latest?kind=workflows" "/api/reports/latest?kind=marketplace" "/api/reports/latest?kind=billing"; do
    url="http://127.0.0.1:7070${path}"
    http="$(curl -sS -o "$body" -w "%{http_code}" -H "Origin: http://127.0.0.1:5173" -H "x-ic-dev: 1" "$url" 2>/dev/null || echo "000")"
    echo "GET ${path} -> HTTP ${http}"
    head -c 220 "$body" 2>/dev/null | tr '\n' ' '; echo
    rm -f "$body" 2>/dev/null || true
    test "$http" = "200" || { echo "ERR: expected 200"; tail -80 "$OUT" 2>/dev/null || true; tail -200 "$ERR" 2>/dev/null || true; kill -9 "$API_PID" 2>/dev/null || true; exit 1; }
  done
  rm -f "$body" 2>/dev/null || true
  kill -9 "$API_PID" 2>/dev/null || true
  echo "OK: DEV CORS + preflight stable and feeds are reachable (200)."

  echo
  echo "=== 4) Gates quick proof ==="
  ADR_APPROVED=1 node governance/gates/run-gates.mjs dev-001

  echo
  echo "=== 5) Next steps ==="
  echo "=== 5) Next steps ==="
  echo "Now run:"
  echo "  pnpm api:dev"
  echo "  pnpm cp:dev"
  echo "Open http://127.0.0.1:5173 then Refresh (API Base URL: http://127.0.0.1:7070)"
  echo
  echo "If you want to commit+tag:"
  echo '  git add apps/backend-api/server.mjs'
  echo '  git commit -m "fix(dev): loopback-only CORS preflight + no-crash json guard for CP cockpit (x-ic-dev) — ADR-APPROVED"'
  echo "  git tag \"phaseCP_COCKPIT_DEV_CORS_PREFLIGHT_${TS}\""
  echo
  echo "DONE."
) 2>&1 | tee -a "$LOG"

exit "${PIPESTATUS[0]}"
