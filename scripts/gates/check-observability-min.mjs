#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function ok(msg){ console.log("OK:", msg); }
function fail(code, msg){ const e = new Error(msg); e.code = code; throw e; }
function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }
function repoRoot(){
  try { return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim(); }
  catch { return process.cwd(); }
}

const root = repoRoot();
const candidates = [
  "app/src/core/ports/telemetry",
  "app/src/core/ports/telemetry.contract.ts",
  "app/src/core/ports/telemetry.facade.ts",
  "app/src/core/services/telemetry",
];

const found = candidates.some(rel => exists(path.join(root, rel)));
if(!found){
  fail("ERR_OBS_MIN_MISSING", "Missing telemetry baseline (expected a telemetry port/facade location).");
}
ok("observability-min baseline present");
