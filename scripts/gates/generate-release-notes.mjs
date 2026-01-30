#!/usr/bin/env node
/* ICONTROL_RELEASE_NOTES_V1 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function sh(cmd){
  return execSync(cmd,{encoding:"utf8"}).trim();
}

const ts = process.env.TS || new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
const outDir = path.join(process.cwd(),"docs","release");
fs.mkdirSync(outDir,{recursive:true});

const distHashPath = path.join(process.cwd(),"_audit","LAST_DIST_TREE_HASH.txt");
const distHash = fs.existsSync(distHashPath) ? fs.readFileSync(distHashPath,"utf8").trim() : "<missing>";

const branch = sh("git rev-parse --abbrev-ref HEAD");
const head = sh("git rev-parse HEAD");
const shortlog = sh("git log -n 20 --pretty=format:'- %h %s'");

const rollback = (()=>{
  try{
    const files = sh("ls -1t dist_rollback_*.tgz 2>/dev/null | head -n 1");
    return files || "<none>";
  }catch{ return "<none>"; }
})();

const manifest = (()=>{
  const stable = "ASSETS_MANIFEST_LATEST.json";
  return fs.existsSync(path.join(process.cwd(),stable)) ? stable : "<missing>";
})();

const body = [
  `# Release Notes (${ts})`,
  ``,
  `- Branch: ${branch}`,
  `- HEAD: ${head}`,
  `- Dist tree hash: ${distHash}`,
  `- Rollback archive: ${rollback}`,
  `- Assets manifest: ${manifest}`,
  ``,
  `## Recent commits`,
  shortlog,
  ``,
].join("\n");

const out = path.join(outDir,`RELEASE_NOTES_${ts}.md`);
fs.writeFileSync(out, body);
console.log(out);
