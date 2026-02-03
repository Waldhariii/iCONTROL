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

function repoRoot(){
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
}

const root = repoRoot();
const catPath = path.join(root, "config/ssot/MODULE_CATALOG.json");
if(!exists(catPath)) fail("ERR_SSOT_MAP_MISSING_CATALOG", "Missing MODULE_CATALOG.json");

const cat = readJson(catPath);
if(cat.schema !== "MODULE_CATALOG_V1") fail("ERR_SSOT_MAP_SCHEMA", `Expected MODULE_CATALOG_V1 got ${cat.schema}`);

const modules = Array.isArray(cat.modules) ? cat.modules : [];
const surfaces = new Set();
const routes = new Set();
for(const m of modules){
  for(const s of (Array.isArray(m.surfaces)?m.surfaces:[])) surfaces.add(String(s));
  for(const r of (Array.isArray(m.routes)?m.routes:[])) routes.add(String(r));
}

const missing = [];
for(const s of surfaces){
  if(!s.startsWith("cp.")) continue;
  const name = s.slice("cp.".length);
  const guess = `/cp/#/${name.replace(/\./g, ".")}`;
  const alt = `/cp/#/${name.toLowerCase().replace(/\./g, ".")}`;
  if(!routes.has(guess) && !routes.has(alt)){
    missing.push({ surface: s, expected_route: alt });
  }
}
if(missing.length){
  fail("ERR_SSOT_MAP_CP_SURFACE_ROUTE_MISSING", `Missing CP route(s) for surfaces: ${JSON.stringify(missing, null, 2)}`);
}

console.log("OK: SSOT surface<->route mapping invariants pass");
