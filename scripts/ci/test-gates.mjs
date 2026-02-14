import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, symlinkSync } from "fs";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "icontrol-test-"));

function run(cmd, cwd) {
  execSync(cmd, { stdio: "inherit", cwd });
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (s.includes("/changes/snapshots")) continue;
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
  run("node scripts/ci/compile.mjs test-001 dev", temp);

  // should pass
  run("node governance/gates/run-gates.mjs test-001", temp);

  // break schema: invalid slug
  run("node -e \"const fs=require('fs');const p='platform/ssot/studio/pages/page_definitions.json';const d=JSON.parse(fs.readFileSync(p,'utf-8'));d.push({id:'p1',surface:'cp',key:'k',slug:'Bad Slug',title_key:'t',module_id:'m',default_layout_template_id:'l',capabilities_required:[],owner_team:'o',tags:[],state:'active'});fs.writeFileSync(p,JSON.stringify(d,null,2));\"",
      temp);
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs test-001", temp);
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected gate failure did not occur");

  // collision routes
  copyDir(`${root}/platform`, `${temp}/platform`);
  run("node scripts/ci/compile.mjs test-002 dev", temp);
  run("node -e \"const fs=require('fs');const p='platform/ssot/studio/routes/route_specs.json';const d=JSON.parse(fs.readFileSync(p,'utf-8'));d.push({route_id:'r1',surface:'cp',path:'/dup',page_id:'page-x',guard_pack_id:'g',flag_gate_id:'f',entitlement_gate_id:'e',priority:1,canonical:true,aliases:[],deprecation_date:'',redirect_to:''});d.push({route_id:'r2',surface:'cp',path:'/dup',page_id:'page-y',guard_pack_id:'g',flag_gate_id:'f',entitlement_gate_id:'e',priority:2,canonical:true,aliases:[],deprecation_date:'',redirect_to:''});fs.writeFileSync(p,JSON.stringify(d,null,2));\"",
      temp);
  let failedCollision = false;
  try {
    run("node scripts/ci/compile.mjs test-002 dev", temp);
    run("node governance/gates/run-gates.mjs test-002", temp);
  } catch {
    failedCollision = true;
  }
  if (!failedCollision) throw new Error("Expected collision gate failure did not occur");

  // orphan widget_instance
  copyDir(`${root}/platform`, `${temp}/platform`);
  run("node -e \"const fs=require('fs');const p='platform/ssot/studio/widgets/widget_instances.json';const d=JSON.parse(fs.readFileSync(p,'utf-8'));d.push({id:'w-orphan'});fs.writeFileSync(p,JSON.stringify(d,null,2));\"",
      temp);
  run("node scripts/ci/compile.mjs test-003 dev", temp);
  let failedOrphan = false;
  try {
    run("node governance/gates/run-gates.mjs test-003", temp);
  } catch {
    failedOrphan = true;
  }
  if (!failedOrphan) throw new Error("Expected orphan gate failure did not occur");

  // page without guard_pack
  copyDir(`${root}/platform`, `${temp}/platform`);
  run("node -e \"const fs=require('fs');const p='platform/ssot/studio/routes/route_specs.json';const d=JSON.parse(fs.readFileSync(p,'utf-8'));d.push({route_id:'r-noguard',surface:'cp',path:'/noguard',page_id:'page-x',guard_pack_id:'',flag_gate_id:'f',entitlement_gate_id:'e',priority:1,canonical:true,aliases:[],deprecation_date:'',redirect_to:''});fs.writeFileSync(p,JSON.stringify(d,null,2));\"",
      temp);
  run("node scripts/ci/compile.mjs test-004 dev", temp);
  let failedPolicy = false;
  try {
    run("node governance/gates/run-gates.mjs test-004", temp);
  } catch {
    failedPolicy = true;
  }
  if (!failedPolicy) throw new Error("Expected policy gate failure did not occur");

  console.log("Gate tests PASS");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
