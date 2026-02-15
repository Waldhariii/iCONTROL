import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const activationsPath = join(ssotDir, "modules", "module_activations.json");
writeFileSync(
  activationsPath,
  JSON.stringify([
    { tenant_id: "tenant:test", module_id: "module:billing", state: "active" }
  ], null, 2) + "\n"
);

const releaseId = "mod-billing-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const manifest = JSON.parse(readFileSync(join(outDir, `platform_manifest.${releaseId}.json`), "utf-8"));
const routes = (manifest.routes?.routes || []).map((r) => r.route_id);
if (!routes.includes("route:billing-invoices")) throw new Error("Billing routes missing");
if (routes.includes("route:jobs-list") || routes.includes("route:docs-list")) {
  throw new Error("Inactive module routes present");
}

console.log("Module activation billing PASS");

temp.cleanup();
