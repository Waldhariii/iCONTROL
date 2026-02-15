/**
 * Phase AC: assert manifest includes domain module registry entries for the 4 business-docs modules (no new pages).
 */
import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const REQUIRED_MODULES = ["module:documents", "module:pdf_exports", "module:ocr_pipeline", "module:accounting_sync"];

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const manifestPath = join(outDir, "platform_manifest.dev-001.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const domainModules = manifest.domain_modules || [];
const moduleIds = new Set(domainModules.map((m) => m.module_id));

for (const mid of REQUIRED_MODULES) {
  if (!moduleIds.has(mid)) {
    throw new Error(`Manifest missing domain module: ${mid}`);
  }
}

console.log("Business docs modules present PASS", { modules: REQUIRED_MODULES });
temp.cleanup();
