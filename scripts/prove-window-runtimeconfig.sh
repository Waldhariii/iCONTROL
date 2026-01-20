#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4178}"

for p in 4178 4179 4180 4181 4182; do
  if ! lsof -iTCP:$p -sTCP:LISTEN -nP >/dev/null 2>&1; then PORT=$p; break; fi
done
echo "[INFO] Using PORT=$PORT"

# Build (prod-like) if available
if npm run -s local:web:build >/dev/null 2>&1; then
  npm run -s local:web:build
else
  echo "[WARN] local:web:build not available; proceeding with existing dist/"
fi

ICONTROL_LOCAL_HOST=127.0.0.1 ICONTROL_LOCAL_PORT=$PORT \
  node ./server/runtime-config-server.js --host 127.0.0.1 --port $PORT --dist ./dist > /tmp/icontrol_rc_server.log 2>&1 &
RC_PID=$!
sleep 1

TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
mkdir -p proofs

# Detect Playwright (prefer repo root node_modules)
HAS_PW="0"
node - <<'NODE' >/dev/null 2>&1 || exit 0
try { require.resolve("playwright"); process.exit(0); } catch { process.exit(1); }
NODE
if [ "$?" = "0" ]; then HAS_PW="1"; fi

if [ "$HAS_PW" = "1" ]; then
  echo "[INFO] Playwright detected -> running headless proof for /app/"
  node - <<'NODE'
const fs = require("fs");

(async () => {
  const { chromium } = require("playwright");
  const port = process.env.PORT || "4178";
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load APP entry (base redirect should land under /app/)
  await page.goto(`${base}/app/`, { waitUntil: "domcontentloaded" });

  // Give the boot a moment to fetch config and set window.__runtimeConfig
  await page.waitForTimeout(300);

  const cfg = await page.evaluate(() => (window).__runtimeConfig || null);
  const ok = !!cfg;

  await browser.close();

  const ts = new Date().toISOString();
  const body = JSON.stringify(cfg || {}, null, 2);
  const hash = require("crypto").createHash("sha256").update(body).digest("hex");

  const proof = {
    kind: "ICONTROL_WINDOW_RUNTIME_CONFIG_PROOF_V1",
    ts,
    url: `${base}/app/`,
    ok,
    window_runtime_config_sha256: hash,
    window_runtime_config_sample_first_200: body.replace(/\r?\n/g, " ").slice(0, 200),
  };

  fs.writeFileSync("proofs/PROOFS_WINDOW_RUNTIME_CONFIG.json", JSON.stringify(proof, null, 2) + "\n");
  if (!ok) {
    console.error("[FAIL] window.__runtimeConfig is null/undefined (proof written).");
    process.exit(1);
  }
  console.log("[OK] wrote proofs/PROOFS_WINDOW_RUNTIME_CONFIG.json (window.__runtimeConfig present)");
})().catch((e) => {
  console.error("[FAIL] Playwright proof error:", e && e.stack ? e.stack : String(e));
  process.exit(1);
});
NODE
else
  echo "[WARN] Playwright not installed -> writing SKIPPED proof (non-blocking)."
  cat > proofs/PROOFS_WINDOW_RUNTIME_CONFIG.json <<JSON
{
  "kind": "ICONTROL_WINDOW_RUNTIME_CONFIG_PROOF_V1",
  "ts": "$TS",
  "url": "http://127.0.0.1:${PORT}/app/",
  "ok": false,
  "status": "SKIPPED_PLAYWRIGHT_NOT_INSTALLED",
  "note": "Install playwright (dev-only) to validate window.__runtimeConfig in a real browser boot."
}
JSON
  echo "[OK] wrote proofs/PROOFS_WINDOW_RUNTIME_CONFIG.json (SKIPPED)"
fi

kill "$RC_PID" 2>/dev/null || true
wait "$RC_PID" 2>/dev/null || true
