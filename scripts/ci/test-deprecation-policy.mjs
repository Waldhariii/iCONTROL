import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run() {
  const temp = createTempSsot();
  const ssotDir = temp.ssotDir;
  execSync(`node -e "const fs=require('fs');const p='${ssotDir}/compat/deprecations.json';const d=JSON.parse(fs.readFileSync(p,'utf-8'));d.push({target_type:'schema',target_id:'x',introduced_in:'1.0.0',deprecated_in:'1.1.0',removal_in:'1.1.0',replacement_ref:'',auto_block_after:false});fs.writeFileSync(p,JSON.stringify(d,null,2));"`, { stdio: "inherit", shell: true });
  let failed = false;
  try {
    execSync(`node governance/gates/run-gates.mjs dev-001`, { stdio: "ignore", env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: "./runtime/manifests" } });
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected deprecation gate failure");
  console.log("Deprecation policy PASS");
  temp.cleanup();
}

run();
