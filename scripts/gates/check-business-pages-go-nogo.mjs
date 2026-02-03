#!/usr/bin/env node
import { execSync } from "node:child_process";

function ok(msg){ console.log("OK:", msg); }
function fail(code, msg){ const e = new Error(msg); e.code = code; throw e; }

const required = [
  "gate:tag-integrity",
  "gate:preflight:prod",
  "gate:releaseops-invariants",
  "gate:ssot-surface-route-map",
  "gate:observability-min"
];

const missing = [];
for(const s of required){
  try{
    execSync(`npm run -s ${s}`, { stdio: "ignore" });
  }catch{
    missing.push(s);
  }
}

if(missing.length){
  fail("ERR_PAGES_METIER_GONOGO", `Not ready for business pages. Failing gates: ${missing.join(", ")}`);
}

ok("READY_FOR_PAGES_METIER (Phase11 criteria satisfied)");
