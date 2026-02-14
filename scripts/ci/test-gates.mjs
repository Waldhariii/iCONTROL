import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "icontrol-test-"));

function run(cmd, cwd) {
  execSync(cmd, { stdio: "ignore", cwd });
}

function copyDir(src, dest) {
  execSync(`cp -R ${src} ${dest}`);
}

try {
  copyDir(`${root}/platform`, `${temp}/platform`);
  copyDir(`${root}/core`, `${temp}/core`);
  copyDir(`${root}/runtime`, `${temp}/runtime`);
  copyDir(`${root}/scripts`, `${temp}/scripts`);
  copyDir(`${root}/governance`, `${temp}/governance`);

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

  console.log("Gate tests PASS");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
