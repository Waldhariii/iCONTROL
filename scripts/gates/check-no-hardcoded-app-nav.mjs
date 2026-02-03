#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function repoRoot(){
  try{
    return execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  }catch{
    return process.cwd();
  }
}

const root = repoRoot();
const targets = ["app/src/core", "app/src/surfaces"];
const allow = new Set([
  "app/src/core/nav/appNav.catalog.ts",
  "app/src/core/nav/cpNav.catalog.ts",
]);

function listFiles(dir){
  const out = [];
  const stack = [path.join(root, dir)];
  while(stack.length){
    const cur = stack.pop();
    if(!cur || !fs.existsSync(cur)) continue;
    for(const e of fs.readdirSync(cur, { withFileTypes: true })){
      const p = path.join(cur, e.name);
      if(e.isDirectory()){
        if(e.name === "node_modules" || e.name.startsWith(".") || e.name === "_audit") continue;
        stack.push(p);
      }else if(/\.(ts|tsx|js|mjs|cjs)$/.test(e.name)){
        out.push(p);
      }
    }
  }
  return out;
}

const errors = [];
for(const t of targets){
  for(const f of listFiles(t)){
    const rel = path.relative(root, f).replace(/\\/g, "/");
    if(allow.has(rel)) continue;
    const txt = fs.readFileSync(f, "utf8");
    if(/\[\s*["'`]\/(?!cp)[^"'`]+\s*["'`]\s*,/m.test(txt)){
      errors.push(`ERR_HARDCODED_APP_NAV: ${rel}`);
    }
  }
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(2);
}

console.log("OK: no hardcoded app nav arrays detected.");
