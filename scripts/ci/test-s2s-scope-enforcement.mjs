import { spawn, execSync } from "child_process";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
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

  execSync("node scripts/ci/compile.mjs s2s-scope-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await sleep(500);

  try {
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["runtime.read"] });
    const res = await fetch(`${api}/marketplace/catalog`, { headers: { authorization: `Bearer ${token}` } });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    console.log("S2S scope enforcement PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
