import { execSync } from "child_process";
import { mkdtempSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "icontrol-token-"));

function run(cmd, cwd) {
  execSync(cmd, { stdio: "inherit", cwd });
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

copyDir(`${root}/platform`, `${temp}/platform`);
copyDir(`${root}/core`, `${temp}/core`);
copyDir(`${root}/runtime`, `${temp}/runtime`);
copyDir(`${root}/scripts`, `${temp}/scripts`);
copyDir(`${root}/governance`, `${temp}/governance`);
symlinkSync(`${root}/node_modules`, `${temp}/node_modules`, "dir");

run("node scripts/maintenance/generate-keys.mjs", temp);
run("node scripts/maintenance/generate-schemas-index.mjs", temp);
run("node scripts/ci/compile.mjs token-001 dev", temp);

run(
  "node -e \"const fs=require('fs');const wp='platform/ssot/studio/widgets/widget_instances.json';const wd=JSON.parse(fs.readFileSync(wp,'utf-8'));wd.push({id:'w1',props:{color:'#fff'}});fs.writeFileSync(wp,JSON.stringify(wd,null,2));const pp='platform/ssot/studio/pages/page_instances.json';const pd=JSON.parse(fs.readFileSync(pp,'utf-8'));pd[0].widget_instance_ids = Array.from(new Set([...(pd[0].widget_instance_ids||[]),'w1']));fs.writeFileSync(pp,JSON.stringify(pd,null,2));\"",
  temp
);

let failed = false;
try {
  run("node scripts/ci/compile.mjs token-001 dev", temp);
  run("node governance/gates/run-gates.mjs token-001", temp);
} catch {
  failed = true;
}
if (!failed) throw new Error("Expected token gate failure");
console.log("Token gate PASS");
