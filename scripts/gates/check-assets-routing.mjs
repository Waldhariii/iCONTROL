#!/usr/bin/env node
/* ICONTROL_ASSET_ROUTING_GATE_V1
   Verifies dist/app/index.html and dist/cp/index.html:
   - must reference /assets/
   - must NOT reference /app/assets/ or /cp/assets/
*/
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const targets = [
  path.join(repoRoot, "dist", "app", "index.html"),
  path.join(repoRoot, "dist", "cp", "index.html"),
];

let ok = true;

for (const fp of targets) {
  if (!fs.existsSync(fp)) {
    console.error(`ERR: missing ${fp} (run build:prod first)`);
    ok = false;
    continue;
  }
  const s = fs.readFileSync(fp, "utf8");

  const hasAssets = s.includes('"/assets/') || s.includes("'/assets/") || s.includes("/assets/");
  const hasOldApp = s.includes("/app/assets/");
  const hasOldCp = s.includes("/cp/assets/");

  if (!hasAssets) {
    console.error(`ERR: ${fp} does not reference /assets/`);
    ok = false;
  }
  if (hasOldApp || hasOldCp) {
    console.error(`ERR: ${fp} still references legacy /app/assets or /cp/assets`);
    ok = false;
  }

  if (ok) {
    console.log(`OK: ${fp} references /assets/ only`);
  }
}

if (!ok) process.exit(1);
console.log("PASS: asset routing gate");
