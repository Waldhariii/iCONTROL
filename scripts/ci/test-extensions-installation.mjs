import { mkdtempSync, rmSync, readFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-extinst-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  run("node scripts/ci/compile.mjs extinst-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  const manifest = JSON.parse(readFileSync(join(outDir, "platform_manifest.extinst-001.json"), "utf-8"));
  const installed = (manifest.extensions_runtime || []).some((i) => i.tenant_id === "tenant:default" && i.extension_id === "ext:sample");
  if (!installed) throw new Error("Expected extension installed in manifest");
  console.log("Extensions installation PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
