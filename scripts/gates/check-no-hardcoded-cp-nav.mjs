#!/usr/bin/env node

// --- v2 hooks ---
const __REPO_ROOT_V2 = process.cwd();
const __EX_V2 = loadCpNavExemptions(__REPO_ROOT_V2);
const __SCAN_ROOTS_V2 = defaultCpNavScanRoots(__REPO_ROOT_V2);

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


// === Gate v2 tighten (Phase6 Move5) ===
// Exemptions schema marker: CP_NAV_HARDCODED_EXEMPTIONS_V1
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCpNavExemptions(repoRoot){
  const p = path.join(repoRoot, "config", "ssot", "CP_NAV_HARDCODED_EXEMPTIONS.json");
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return { glob_exempt: [], path_exempt: [], token_exempt: [] };
  }
}

// Tight scan scope: only CP nav definition sources (business value), not whole repo.
function defaultCpNavScanRoots(repoRoot){
  return [
    path.join(repoRoot, "app", "src", "core", "nav"),
    path.join(repoRoot, "scripts", "gates")
  ].filter(p => fs.existsSync(p));
}

// Minimal glob-ish matcher (covers **/*suffix and exact contains)
function matchAnyGlob(rel, globs){
  for(const g of (globs||[])){
    if(g.startsWith("**/") && g.endsWith("/**")){
      const mid = g.slice(3, -3);
      if(rel.includes(mid)) return true;
    }
    if(g.startsWith("**/") && g.includes("*.")){
      const suf = g.split("*").pop();
      if(rel.endsWith(suf)) return true;
    }
    if(rel === g) return true;
  }
  return false;
}

function shouldIgnoreV2(rel, content, ex){
  if(matchAnyGlob(rel, ex.glob_exempt)) return true;
  for(const p of (ex.path_exempt||[])){
    if(rel.startsWith(p)) return true;
  }
  for(const t of (ex.token_exempt||[])){
    if(content && content.includes(t)) return true;
  }
  return false;
}

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


function shouldIgnore(rel, content){
  return shouldIgnoreV2(rel, content, __EX_V2);
}
