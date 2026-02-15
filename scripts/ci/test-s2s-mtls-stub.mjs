import { spawn, execSync } from "child_process";
import { createTempSsot, buildS2SHmacHeaders } from "./test-utils.mjs";
import { mkdirSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const outDir = join(temp.ssotDir, "..", "runtime", "manifests");
  mkdirSync(outDir, { recursive: true });

  execSync("node scripts/ci/compile.mjs s2s-mtls-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      MANIFESTS_DIR: outDir,
      S2S_CP_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy",
      S2S_REQUIRE_MTLS: "1"
    }
  });
  await sleep(500);

  try {
    const body = JSON.stringify({ principal_id: "svc:cp", requested_scopes: ["runtime.read"], audience: "backend-api" });
    const headers = buildS2SHmacHeaders({ principalId: "svc:cp", secret: "dummy", method: "POST", path: "/api/auth/token", body });
    const denied = await fetch(`${api}/auth/token`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
    if (denied.status !== 401) throw new Error(`Expected 401 without mTLS, got ${denied.status}`);

    const ok = await fetch(`${api}/auth/token`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-mtls-verified": "1", ...headers },
      body
    });
    if (!ok.ok) throw new Error(`Expected 200 with mTLS header, got ${ok.status}`);
    console.log("S2S mTLS stub PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
