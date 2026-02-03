#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }
function read(p){ return fs.readFileSync(p, "utf8"); }

function walk(dir){
  const out = [];
  if(!exists(dir)) return out;
  for(const ent of fs.readdirSync(dir, {withFileTypes:true})){
    const p = path.join(dir, ent.name);
    if(ent.isDirectory()){
      if(ent.name === "node_modules" || ent.name.startsWith(".") || ent.name === "_audit") continue;
      out.push(...walk(p));
    } else out.push(p);
  }
  return out;
}

// Scope: only nav sources that can realistically contain CP nav lists.
// This avoids false positives from contracts/tests/runtime identity, etc.
const SCOPE_DIRS = [
  path.join(ROOT, "app", "src", "core", "nav"),
  path.join(ROOT, "app", "src", "surfaces", "cp"), // only if nav files live here
];

const SCOPE_FILES_EXACT = [
  path.join(ROOT, "app", "src", "core", "nav", "cpNav.catalog.ts"),
];

// Allowlist: catalog-driven/generated registries are allowed to reference cp.* symbols.
const ALLOW_SUBSTRINGS = [
  "catalog-driven",
  "cpNav.catalog",
  "cpSurfaceRegistry.catalog",
  "MODULE_CATALOG",
];

// Patterns that represent hardcoded CP nav lists (the real smell).
// We intentionally DO NOT flag mere occurrences of "cp." or "/cp".
const BAD_PATTERNS = [
  /\bconst\s+CP_(SURFACES|NAV|PAGES)\s*=\s*\[/,              // const CP_SURFACES = [
  /\bexport\s+const\s+CP_(SURFACES|NAV|PAGES)\s*=\s*\[/,     // export const CP_NAV = [
  /\b(cp\.[a-z0-9._-]+)\b.*\b(cp\.[a-z0-9._-]+)\b/s,         // multiple cp.* tokens in same block (heuristic)
  /\/cp\/#\/[a-z0-9._-]+.*\/cp\/#\//s,                      // multiple /cp/#/ routes in same block
];

function isAllowed(content){
  return ALLOW_SUBSTRINGS.some(s => content.includes(s));
}

function isNavCandidate(file){
  const f = file.replace(/\\/g, "/");
  if(!/\.(ts|tsx|js|mjs|cjs)$/.test(f)) return false;
  // Only scan nav-ish files to reduce noise
  return f.includes("/core/nav/") || f.endsWith("/cpNav.catalog.ts");
}

let offenders = [];

const files = new Set();
for(const d of SCOPE_DIRS) for(const f of walk(d)) files.add(f);
for(const f of SCOPE_FILES_EXACT) if(exists(f)) files.add(f);

for(const file of Array.from(files).sort((a,b)=>a.localeCompare(b))){
  if(!isNavCandidate(file)) continue;
  const content = read(file);
  if(isAllowed(content)) continue;

  // Only flag if at least one strong pattern hits
  const hits = BAD_PATTERNS
    .map((re, idx) => re.test(content) ? idx : -1)
    .filter(x => x >= 0);

  if(hits.length > 0){
    offenders.push({ file, hits });
  }
}

if(offenders.length){
  for(const o of offenders){
    console.error(`ERR_HARDCODED_CP_NAV: ${o.file} (patterns=${o.hits.join(",")})`);
  }
  process.exit(2);
}

console.log("OK: no hardcoded CP nav arrays found (scoped)");
