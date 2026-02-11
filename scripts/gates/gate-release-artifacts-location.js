#!/usr/bin/env node
/* Fail-closed: release artifacts must live ONLY under _artifacts/ */
const fs = require("fs");
const path = require("path");

const REPO = process.cwd();
const BAD = [
  "dist",
  "apps/control-plane/dist",
  "platform/api/dist",
  "dist_rollback",
];
const BAD_GLOBS = [
  /^dist_rollback_.*\.tgz$/,
  /^_AUDIT_.*\.log$/,
  /^P\d+_.*\.log$/,
];

function exists(p){ try { return fs.existsSync(p); } catch { return false; } }
function listRoot(){
  try { return fs.readdirSync(REPO); } catch { return []; }
}

let offenders = [];
for (const rel of BAD) {
  const p = path.join(REPO, rel);
  if (exists(p)) offenders.push(rel);
}
for (const f of listRoot()) {
  for (const re of BAD_GLOBS) {
    if (re.test(f)) offenders.push(f);
  }
}

if (offenders.length) {
  console.error("ERR_RELEASE_ARTIFACTS_LOCATION: forbidden artifacts outside _artifacts/");
  for (const o of offenders) console.error("- " + o);
  process.exit(1);
}
console.log("OK: gate:release-artifacts-location");
