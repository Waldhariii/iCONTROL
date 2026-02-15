import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { join } from "path";
import { mkdirSync, existsSync, readdirSync } from "fs";

async function run() {
  const temp = createTempSsot();
  const runtimeDir = join(temp.ssotDir, "..", "runtime");
  const outDir = join(runtimeDir, "manifests");
  mkdirSync(outDir, { recursive: true });

  execSync("node scripts/maintenance/restore-drill.mjs", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: outDir } });

  const reportsDir = join(runtimeDir, "reports");
  const reports = existsSync(reportsDir) ? readdirSync(reportsDir).filter((f) => f.startsWith("RESTORE_DRILL_")) : [];
  if (!reports.length) throw new Error("Restore drill report missing");

  console.log("Restore drill smoke PASS");
  temp.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
