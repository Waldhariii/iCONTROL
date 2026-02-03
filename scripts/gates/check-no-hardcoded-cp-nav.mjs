#!/usr/bin/env node
/**
 * Fatal governance gate:
 * Forbid hardcoded CP surface IDs (cp.*) inside arrays/objects/maps in TS/TSX,
 * except allowlisted files (SSOT derivation points).
 *
 * Heuristic (fast + robust):
 * - Scan TS/TSX under app/src
 * - If file not allowlisted:
 *    - fail when "cp." appears near "[" or "{" or "new Map(" literals
 *    - fail when array literals contain "cp."
 */
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "app", "src");

const allow = new Set((process.env.CP_NAV_ALLOWLIST || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)
  .map(rel => path.normalize(rel)));

function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }

function walk(dir){
  const out = [];
  for(const ent of fs.readdirSync(dir, { withFileTypes: true })){
    if(ent.name === "node_modules") continue;
    const p = path.join(dir, ent.name);
    if(ent.isDirectory()){
      out.push(...walk(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

function isTs(p){
  return p.endsWith(".ts") || p.endsWith(".tsx");
}

function rel(p){
  return path.normalize(path.relative(repoRoot, p));
}

function read(p){
  return fs.readFileSync(p, "utf8");
}

function findOffenses(txt){
  const offenses = [];
  // Patterns capturing "cp." within likely data-literals
  const patterns = [
    // array literal containing cp.*
    { re: /\[[^\]]*?\bcp\.[a-z0-9_.-]+[^\]]*?\]/gi, why: "cp.* in array literal" },
    // object literal containing cp.*
    { re: /\{[^}]*?\bcp\.[a-z0-9_.-]+[^}]*?\}/gi, why: "cp.* in object literal" },
    // Map/Set with cp.*
    { re: /\bnew\s+(Map|Set)\s*\([^)]*?\bcp\.[a-z0-9_.-]+[^)]*?\)/gi, why: "cp.* in Map/Set literal" },
    // Inline list pattern: cp.<x>, cp.<y>, cp.<z> (common hardcode)
    { re: /\bcp\.[a-z0-9_.-]+\b\s*,\s*\bcp\.[a-z0-9_.-]+\b/gi, why: "multiple cp.* literals inline" },
  ];
  for(const p of patterns){
    let m;
    while((m = p.re.exec(txt))){
      offenses.push({ idx: m.index, why: p.why, sample: m[0].slice(0, 180) });
    }
  }
  return offenses;
}

if(!exists(appRoot)){
  console.error("ERR_GATE_SETUP: app/src not found");
  process.exit(2);
}

const files = walk(appRoot).filter(isTs);
const violations = [];

for(const f of files){
  const r = rel(f);
  if(allow.has(r)) continue;

  const txt = read(f);
  if(!txt.includes("cp.")) continue;

  const offs = findOffenses(txt);
  if(offs.length){
    // Provide 1-3 samples per file
    violations.push({
      file: r,
      offenses: offs.slice(0, 3),
    });
  }
}

if(violations.length){
  console.error("ERR_HARDCODED_CP_NAV: forbidden cp.* hardcoded lists detected outside allowlist");
  for(const v of violations){
    console.error(`- ${v.file}`);
    for(const o of v.offenses){
      console.error(`  * ${o.why}: ${o.sample.replace(/\s+/g," ").trim()}`);
    }
  }
  process.exit(1);
}

console.log("OK: no hardcoded CP nav arrays/objects outside allowlist");
