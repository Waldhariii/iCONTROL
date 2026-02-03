#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function ok(msg){ console.log("OK:", msg); }
function fail(code, msg){ const e = new Error(msg); e.code = code; throw e; }
function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }

function getRepoRoot(){
  try{
    const out = execSync("git rev-parse --show-toplevel", { stdio: ["ignore","pipe","ignore"] })
      .toString("utf8").trim();
    if(out) return out;
  }catch{}
  // Fallback: walk up until .git found (best-effort)
  let cur = process.cwd();
  for(let i=0;i<12;i++){
    if(exists(path.join(cur, ".git"))) return cur;
    const up = path.dirname(cur);
    if(up === cur) break;
    cur = up;
  }
  return process.cwd();
}

const repoRoot = getRepoRoot();

// 1) Canonical artifacts (fast path)
const canonical = [
  "app/src/core/ports/telemetry.contract.ts",
  "app/src/core/ports/telemetry.facade.ts",
  "app/src/core/ports/observability.contract.ts",
  "app/src/core/ports/observability.facade.ts",
  "app/src/core/ports/logger.contract.ts",
  "app/src/core/ports/logger.facade.ts",
];

for(const rel of canonical){
  if(exists(path.join(repoRoot, rel))){
    ok(`observability-min satisfied by canonical: ${rel}`);
    process.exit(0);
  }
}

// 2) Pattern-based quick scan (scoped, bounded)
const scopedRoots = [
  "app/src/core",
  "scripts"
];

const hitWords = [
  "telemetry",
  "observability",
  "logger",
  "audit",
  "metrics",
  "tracing",
  "trace",
  "sentry",
];

function walkBounded(baseRel, maxFiles){
  const base = path.join(repoRoot, baseRel);
  if(!exists(base)) return [];
  const out = [];
  const stack = [base];
  while(stack.length && out.length < maxFiles){
    const cur = stack.pop();
    let ents = [];
    try{ ents = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for(const ent of ents){
      if(out.length >= maxFiles) break;
      const p = path.join(cur, ent.name);
      if(ent.isDirectory()){
        if(ent.name === "node_modules" || ent.name.startsWith(".")) continue;
        stack.push(p);
      } else {
        if(!/\.(ts|tsx|js|mjs|cjs)$/.test(ent.name)) continue;
        out.push(p);
      }
    }
  }
  return out;
}

let hits = [];
for(const baseRel of scopedRoots){
  const files = walkBounded(baseRel, 700);
  for(const f of files){
    const rel = path.relative(repoRoot, f);
    const low = rel.toLowerCase();
    if(hitWords.some(w => low.includes(w))){
      hits.push(rel);
      continue;
    }
    // small content sniff (first 8KB)
    try{
      const buf = fs.readFileSync(f);
      const head = buf.subarray(0, Math.min(buf.length, 8192)).toString("utf8").toLowerCase();
      if(hitWords.some(w => head.includes(w))){
        hits.push(rel);
      }
    }catch{}
  }
}

hits = Array.from(new Set(hits)).sort((a,b)=>a.localeCompare(b));
if(hits.length){
  ok(`observability-min satisfied by repo signals (scoped): ${hits[0]}${hits.length>1 ? ` (+${hits.length-1} more)` : ""}`);
  process.exit(0);
}

fail("ERR_OBS_MIN_MISSING", "Missing observability baseline. No telemetry/logger/metrics/tracing signals found under app/src/core or scripts.");
