import { spawn, execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "mp-impact-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
writeFileSync(
  join(ssotDir, "changes", "active_release.json"),
  JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n"
);

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
});

async function run() {
  await sleep(500);
  const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["marketplace.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };
  const res = await fetch("http://localhost:7070/api/marketplace/tenants/tenant:default/impact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ type: "module", id: "module:jobs", version: "1.0.0" })
  }).then((r) => r.json());
  const reportPath = res.report_path;
  if (!reportPath || !reportPath.includes("runtime/reports")) throw new Error("Impact report path invalid");
  const localPath = reportPath.startsWith("/") ? reportPath : join(process.cwd(), reportPath);
  if (!existsSync(localPath)) throw new Error("Impact report missing on disk");
  console.log("Marketplace impact report PASS");
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
    temp.cleanup();
  });
