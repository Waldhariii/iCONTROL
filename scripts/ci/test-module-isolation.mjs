import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const modulesPath = join(ssotDir, "modules", "domain_modules.json");
const mods = JSON.parse(readFileSync(modulesPath, "utf-8"));
const jobs = mods.find((m) => m.module_id === "module:jobs");
if (jobs && !jobs.provides.pages.includes("client-docs-list")) {
  jobs.provides.pages.push("client-docs-list");
}
writeFileSync(modulesPath, JSON.stringify(mods, null, 2) + "\n");

const releaseId = "mod-iso-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

let failed = false;
try {
  execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
    stdio: "ignore",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
  });
} catch {
  failed = true;
}
if (!failed) throw new Error("DomainIsolationGate should fail on cross-module reference");
console.log("Module isolation gate FAIL expected PASS");

temp.cleanup();
