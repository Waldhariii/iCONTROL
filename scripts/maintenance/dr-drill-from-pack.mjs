import { execSync, spawn } from "child_process";
import { join, dirname } from "path";
import { mkdirSync } from "fs";
import { createTempSsot, waitForServer } from "../ci/test-utils.mjs";
import { pickLatestPackDir, writeReport } from "./release-pack-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pack") out.pack = args[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const packDir = args.pack || pickLatestPackDir();
  if (!packDir) throw new Error("No pack found");

  const temp = createTempSsot();
  const ssotDir = temp.ssotDir;
  const runtimeDir = join(dirname(ssotDir), "runtime");
  mkdirSync(runtimeDir, { recursive: true });

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: join(runtimeDir, "manifests"), S2S_CI_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });

  try {
    await waitForServer("http://localhost:7070/api/runtime/active-release", 8000);
    execSync(`node scripts/maintenance/import-release-pack.mjs --pack ${packDir} --mode staging`, {
      stdio: "inherit",
      env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: join(runtimeDir, "manifests") }
    });
    execSync(`node scripts/maintenance/import-release-pack.mjs --pack ${packDir} --mode activate`, {
      stdio: "inherit",
      env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: join(runtimeDir, "manifests") }
    });
    await waitForServer("http://localhost:7070/api/runtime/manifest", 8000);
    await fetch("http://localhost:7070/api/runtime/manifest");
    await fetch("http://localhost:7070/api/marketplace/tenants/tenant:default/preflight");
    await fetch("http://localhost:7070/api/qos/status?tenant=tenant:default");
    await fetch("http://localhost:7070/api/security/secrets/status?tenant=tenant:default");

    const reportPath = writeReport(
      `DR_DRILL_PACK_${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
      `DR drill pack OK\npack=${packDir}\n`
    );
    console.log(`DR drill report: ${reportPath}`);
  } finally {
    server.kill();
    temp.cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
