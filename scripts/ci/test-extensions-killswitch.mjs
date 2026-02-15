import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-extkill-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const ksPath = join(temp.ssotDir, "extensions", "extension_killswitch.json");
  const ks = JSON.parse(readFileSync(ksPath, "utf-8"));
  ks[0].enabled = true;
  ks[0].reason = "test";
  ks[0].enabled_at = new Date().toISOString();
  writeFileSync(ksPath, JSON.stringify(ks, null, 2) + "\n");

  run("node scripts/ci/compile.mjs extkill-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  const manifest = JSON.parse(readFileSync(join(outDir, "platform_manifest.extkill-001.json"), "utf-8"));
  const installed = (manifest.extensions_runtime || []).some((i) => i.extension_id === "ext:sample");
  if (installed) throw new Error("Expected extension disabled by killswitch");
  console.log("Extensions killswitch PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
