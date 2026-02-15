import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { join } from "path";
import { mkdirSync, existsSync, readdirSync } from "fs";

async function run() {
  const temp = createTempSsot();
  const runtimeDir = join(temp.ssotDir, "..", "runtime");
  mkdirSync(runtimeDir, { recursive: true });

  execSync("node scripts/maintenance/generate-evidence-pack.mjs", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, RUNTIME_DIR: runtimeDir } });

  const evidenceDir = join(runtimeDir, "reports", "evidence");
  const entries = existsSync(evidenceDir) ? readdirSync(evidenceDir) : [];
  if (!entries.length) throw new Error("Evidence pack missing");

  console.log("Evidence pack PASS");
  temp.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
