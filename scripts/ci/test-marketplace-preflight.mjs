import { execSync, spawn } from "child_process";
import { mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot, waitForServer, getS2SToken } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

async function run() {
  const temp = createTempSsot();
  const ssotDir = temp.ssotDir;
  const root = join(ssotDir, "..", "..");
  const manifestsDir = join(root, "runtime", "manifests");
  mkdirSync(manifestsDir, { recursive: true });

  execSync("node scripts/ci/compile.mjs dev-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: manifestsDir } });
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: manifestsDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await waitForServer(`${api}/runtime/active-release`);

  try {
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["marketplace.*"] });
    const res = await fetch(`${api}/marketplace/tenants/tenant:default/preflight`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Expected preflight OK, got ${res.status}`);
    const payload = await res.json();
    if (!payload.plan_effective || !payload.approved_extension_versions || !payload.recommendations) {
      throw new Error("Missing preflight keys");
    }
    if (payload.recommendations.template_recommended !== "tmpl:marketplace-free") {
      throw new Error("Unexpected template recommendation for free plan");
    }
    console.log("Marketplace preflight PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
