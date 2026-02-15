import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot, waitForServer } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const runtimeDir = join(dirname(ssotDir), "runtime");
const usageDir = join(runtimeDir, "finops", "usage", "tenant_default");
mkdirSync(usageDir, { recursive: true });
writeFileSync(join(usageDir, "20260215.json"), JSON.stringify({
  tenant_id: "tenant:default",
  date: "20260215",
  requests_per_day: 100,
  cpu_ms_per_day: 5000,
  cost_units_per_day: 100,
  storage_mb: 50,
  ocr_pages_per_month: 10
}, null, 2));

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir }
});

async function run() {
  await waitForServer("http://localhost:7070/api/billing/mode");
  const res = await fetch("http://localhost:7070/api/billing/invoices/compute?tenant=tenant:default&period=20260215", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }).then((r) => r.json());
  if (!res.ok) throw new Error("Compute invoice failed");
  const total = res.invoice?.total_amount || 0;
  if (total <= 0) throw new Error("Invoice total should be > 0");
  console.log("Billing compute invoice PASS");
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
