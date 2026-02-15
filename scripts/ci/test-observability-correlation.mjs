import { spawn, execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot, getReportsDir, waitForServer } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "obs-001";
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
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

async function run() {
  await waitForServer("http://localhost:7070/api/runtime/active-release", 5000);
  const impactRes = await fetch("http://localhost:7070/api/marketplace/tenants/tenant:default/impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "module", id: "module:jobs", version: "1.0.0" })
  });
  if (!impactRes.headers.get("x-request-id")) throw new Error("Missing x-request-id header");
  await impactRes.json();

  const billRes = await fetch("http://localhost:7070/api/billing/invoices/compute?tenant=tenant:default&period=20260101", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!billRes.headers.get("x-request-id")) throw new Error("Missing x-request-id header on billing");
  await billRes.json();

  const reportsDir = getReportsDir();
  const mpIndex = join(reportsDir, "index", "marketplace_events.jsonl");
  const billingIndex = join(reportsDir, "index", "billing_drafts.jsonl");
  if (!existsSync(mpIndex)) throw new Error("Marketplace events index missing");
  if (!existsSync(billingIndex)) throw new Error("Billing drafts index missing");
  console.log("Observability correlation PASS");
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
