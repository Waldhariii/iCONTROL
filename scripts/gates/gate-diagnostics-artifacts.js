#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const scriptsDir = path.join(repo, "scripts", "diagnostics");
if (!fs.existsSync(scriptsDir)) {
  console.log("OK: gate:diagnostics-artifacts (no scripts/diagnostics)");
  process.exit(0);
}

const offenders = [];
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith(".mjs")) out.push(p);
  }
  return out;
}

for (const f of walk(scriptsDir)) {
  const txt = fs.readFileSync(f, "utf8");
  if (txt.includes("_artifacts") && !txt.includes("_artifacts/diagnostics")) {
    offenders.push(path.relative(repo, f).replace(/\\/g,"/"));
  }
}

if (offenders.length) {
  console.error("ERR_DIAG_ARTIFACTS_SCOPE: diagnostics scripts must write only under _artifacts/diagnostics");
  offenders.forEach(o => console.error("- " + o));
  process.exit(1);
}
console.log("OK: gate:diagnostics-artifacts");
process.exit(0);
