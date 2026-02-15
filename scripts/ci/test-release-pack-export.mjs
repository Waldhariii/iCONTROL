import { execSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "pack-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
execSync(`node scripts/maintenance/generate-release-pack.mjs --release ${releaseId} --env dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

const packsDir = join(process.cwd(), "runtime", "reports", "packs");
if (!existsSync(packsDir)) throw new Error("Packs dir missing");
console.log("Release pack export PASS");
temp.cleanup();
