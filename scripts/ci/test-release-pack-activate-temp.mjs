import { execSync } from "child_process";
import { mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";
import { pickLatestPackDir } from "../maintenance/release-pack-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "pack-act-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
execSync(`node scripts/maintenance/generate-release-pack.mjs --release ${releaseId} --env dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

const packDir = pickLatestPackDir();
execSync(`node scripts/maintenance/import-release-pack.mjs --pack ${packDir} --mode activate`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

const active = JSON.parse(readFileSync(join(ssotDir, "changes", "active_release.json"), "utf-8"));
if (active.active_release_id !== releaseId) throw new Error("Active release not updated");
console.log("Release pack activate PASS");
temp.cleanup();
