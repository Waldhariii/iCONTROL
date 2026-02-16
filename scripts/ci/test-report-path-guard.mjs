import { mkdtempSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "icontrol-report-"));

function run(cmd, cwd, env, stdio = "inherit") {
  execSync(cmd, { stdio, cwd, env: { ...process.env, ...env } });
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots")) continue;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

try {
  copyDir(`${root}/platform`, `${temp}/platform`);
  copyDir(`${root}/core`, `${temp}/core`);
  copyDir(`${root}/runtime`, `${temp}/runtime`);
  copyDir(`${root}/scripts`, `${temp}/scripts`);
  copyDir(`${root}/governance`, `${temp}/governance`);
  copyDir(`${root}/apps`, `${temp}/apps`);
  symlinkSync(`${root}/node_modules`, `${temp}/node_modules`, "dir");

  run("node scripts/ci/compile.mjs rp-001 dev", temp, { SSOT_DIR: `${temp}/platform/ssot`, OUT_DIR: `${temp}/runtime/manifests` });
  run("node governance/gates/run-gates.mjs rp-001", temp, { SSOT_DIR: `${temp}/platform/ssot`, MANIFESTS_DIR: `${temp}/runtime/manifests` });

  writeFileSync(`${temp}/CI_REPORT.md`, "forbidden");
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs rp-001", temp, { SSOT_DIR: `${temp}/platform/ssot`, MANIFESTS_DIR: `${temp}/runtime/manifests` }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("ReportPathGate should fail with root artifact");

  console.log("Report path gate PASS");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
