import { execSync } from "child_process";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";
import { pickLatestPackDir } from "../maintenance/release-pack-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "pack-dr-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
execSync(`node scripts/maintenance/generate-release-pack.mjs --release ${releaseId} --env dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

const packDir = pickLatestPackDir();
execSync(`node scripts/maintenance/dr-drill-from-pack.mjs --pack ${packDir}`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

console.log("DR drill from pack PASS");
temp.cleanup();
