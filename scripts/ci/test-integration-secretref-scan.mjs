import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-intsec-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const cfgPath = join(temp.ssotDir, "integrations", "connector_configs.json");
  const cfgs = JSON.parse(readFileSync(cfgPath, "utf-8"));
  cfgs.push({
    config_id: "cfg:bad",
    tenant_id: "tenant:default",
    connector_id: "connector:slack",
    version: "0.1.0",
    state: "active",
    settings: { api_key: "sk_plaintext" }
  });
  writeFileSync(cfgPath, JSON.stringify(cfgs, null, 2) + "\n");

  run("node scripts/ci/compile.mjs intsec-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs intsec-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected Secret Ref Gate failure");

  console.log("Integration secret ref gate PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
