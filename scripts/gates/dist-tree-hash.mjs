#!/usr/bin/env node
/* ICONTROL_DIST_TREE_HASH_V1 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function walk(dir){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else if(e.isFile()) out.push(p);
  }
  return out;
}

const root = (() => {
  const pref = path.join(process.cwd(), "_artifacts", "dist");
  if (fs.existsSync(pref)) return pref;
  return path.join(process.cwd(), "dist");
})();
if(!fs.existsSync(root)){
  console.error("ERR: dist missing");
  process.exit(1);
}

const files = walk(root).sort();
const h = crypto.createHash("sha256");

for(const f of files){
  h.update(path.relative(root,f));
  h.update(fs.readFileSync(f));
}

console.log(h.digest("hex"));
