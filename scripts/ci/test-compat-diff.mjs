import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { diffManifests } from "../../platform/runtime/compat/diff.mjs";

function run() {
  const temp = mkdtempSync(join(tmpdir(), "icontrol-compat-"));
  const ssotDir = "./platform/ssot";
  const outDir = join(temp, "manifests");
  execSync(`node scripts/ci/compile.mjs from-001 dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir } });
  execSync(`node scripts/ci/compile.mjs to-001 dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir } });
  const fromPath = join(outDir, "platform_manifest.from-001.json");
  const toPath = join(outDir, "platform_manifest.to-001.json");
  const result = diffManifests({ fromPath, toPath });
  if (!result.report) throw new Error("Diff report not generated");
  console.log("Compat diff PASS");
  rmSync(temp, { recursive: true, force: true });
}

run();
