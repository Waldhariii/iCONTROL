import { mkdtempSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "icontrol-preview-"));

function run(cmd, cwd, env = {}) {
  execSync(cmd, { stdio: "inherit", cwd, env: { ...process.env, ...env } });
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (s.includes("/changes/snapshots")) continue;
    if (s.includes("/runtime/preview")) continue;
    const st = statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

try {
  copyDir(`${root}/platform`, `${temp}/platform`);
  copyDir(`${root}/core`, `${temp}/core`);
  copyDir(`${root}/runtime`, `${temp}/runtime`);
  copyDir(`${root}/scripts`, `${temp}/scripts`);
  copyDir(`${root}/governance`, `${temp}/governance`);
  symlinkSync(`${root}/node_modules`, `${temp}/node_modules`, "dir");

  run("node scripts/maintenance/generate-keys.mjs", temp);
  run("node scripts/maintenance/generate-schemas-index.mjs", temp);
  run("node scripts/ci/compile.mjs active-001 dev", temp);

  const activePath = join(temp, "runtime/manifests/platform_manifest.active-001.json");
  const before = readFileSync(activePath, "utf-8");

  const previewId = "cs-preview-001";
  const previewDir = join(temp, "platform/runtime/preview", previewId);
  const previewSsot = join(previewDir, "ssot");
  const previewManifests = join(previewDir, "manifests");
  mkdirSync(previewSsot, { recursive: true });
  mkdirSync(previewManifests, { recursive: true });
  copyDir(join(temp, "platform/ssot"), previewSsot);

  run("node scripts/ci/compile.mjs preview-cs-preview-001 dev", temp, {
    SSOT_DIR: previewSsot,
    OUT_DIR: previewManifests
  });

  const after = readFileSync(activePath, "utf-8");
  if (before !== after) throw new Error("Active release changed by preview compile");
  if (existsSync(join(temp, "runtime/manifests/platform_manifest.preview-cs-preview-001.json"))) {
    throw new Error("Preview manifest leaked into runtime/manifests");
  }
  console.log("Preview isolation PASS");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
