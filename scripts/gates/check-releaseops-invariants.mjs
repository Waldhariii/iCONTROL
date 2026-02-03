#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function fail(code, msg){
  const e = new Error(msg);
  e.code = code;
  throw e;
}
function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }
function readJson(p){ return JSON.parse(fs.readFileSync(p, "utf8")); }

function uniq(arr){ return Array.from(new Set(arr)); }

function stableSort(arr){
  return [...arr].sort((a,b)=>String(a).localeCompare(String(b)));
}

function resolveRepoRoot() {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
}

const repoRoot = resolveRepoRoot();
const catPath = path.join(repoRoot, "config", "ssot", "MODULE_CATALOG.json");
const coreRfc = path.join(repoRoot, "docs", "governance", "RFC_CORE_CHANGES.md");

if(!exists(catPath)) fail("ERR_RELEASEOPS_MISSING_CATALOG", `Missing ${catPath}`);
if(!exists(coreRfc)) fail("ERR_RELEASEOPS_MISSING_RFC_CORE", `Missing ${coreRfc}`);

const cat = readJson(catPath);
if(cat.schema !== "MODULE_CATALOG_V1"){
  fail("ERR_RELEASEOPS_CATALOG_SCHEMA", `MODULE_CATALOG.schema must be MODULE_CATALOG_V1 (got: ${cat.schema})`);
}
if(!Array.isArray(cat.modules) || cat.modules.length === 0){
  fail("ERR_RELEASEOPS_CATALOG_EMPTY", "MODULE_CATALOG.modules must be non-empty");
}

for(let i=0;i<cat.modules.length;i++){
  const m = cat.modules[i];
  if(typeof m.manifest !== "string" || !m.manifest.trim()){
    fail("ERR_RELEASEOPS_MODULE_MANIFEST_EMPTY", `modules[${i}].manifest must be non-empty string`);
  }
  if(typeof m.id !== "string" || !m.id.trim()){
    fail("ERR_RELEASEOPS_MODULE_ID_EMPTY", `modules[${i}].id must be non-empty string`);
  }
}

const ids = cat.modules.map(m=>m.id);
const sorted = stableSort(ids);
if(JSON.stringify(ids) !== JSON.stringify(sorted)){
  fail("ERR_RELEASEOPS_CATALOG_NOT_SORTED", "MODULE_CATALOG.modules must be sorted by id (localeCompare).");
}

const rfcText = fs.readFileSync(coreRfc, "utf8");
if(!rfcText.includes("phase9-move0-releaseops-invariants")){
  fail("ERR_RELEASEOPS_RFC_MISSING_MARKER", "RFC_CORE_CHANGES.md missing Phase9 Move0 marker.");
}

const ignoreRoots = [".cursor", ".claude-dev-helper", ".vscode"];
for(const r of ignoreRoots){
  if(exists(path.join(repoRoot, r))){
  }
}

console.log("OK: releaseops invariants pass");
