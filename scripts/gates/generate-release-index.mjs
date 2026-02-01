#!/usr/bin/env node
/* ICONTROL_RELEASE_INDEX_V1 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

function sh(cmd){
  return execSync(cmd,{encoding:"utf8"}).trim();
}
function sha256File(p){
  const b = fs.readFileSync(p);
  return crypto.createHash("sha256").update(b).digest("hex");
}
function latest(globPrefix, dir){
  const files = fs.readdirSync(dir).filter(f=>f.startsWith(globPrefix));
  files.sort((a,b)=>fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
  return files[0] ? path.join(dir, files[0]) : "";
}

const cwd = process.cwd();
const ts = process.env.TS || new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);

const bundle = latest("RELEASE_BUNDLE_", path.join(cwd,"docs","release"));
if(!bundle) { console.error("ERR: missing RELEASE_BUNDLE_*"); process.exit(1); }

const notes = (() => {
  const dr = path.join(cwd,"docs","release");
  const scan = (dir) => {
    try {
      const files = fs.readdirSync(dir).filter(f=>f.startsWith("RELEASE_NOTES_") && f.endsWith(".md"));
      files.sort((a,b)=>fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
      return files[0] ? path.join(dir, files[0]) : "";
    } catch { return ""; }
  };
  return scan(dr) || scan(cwd);
})();

const manifest = path.join(cwd,"ASSETS_MANIFEST_LATEST.json");
if(!fs.existsSync(manifest)) { console.error("ERR: missing ASSETS_MANIFEST_LATEST.json"); process.exit(1); }

const auditDir = path.join(cwd,"_audit");
let distHashFile = "";
if(fs.existsSync(path.join(auditDir,"LAST_DIST_TREE_HASH.txt"))) distHashFile = path.join(auditDir,"LAST_DIST_TREE_HASH.txt");
else {
  const dh = fs.readdirSync(auditDir).filter(f=>f.startsWith("DIST_TREE_HASH_") && f.endsWith(".txt"));
  dh.sort((a,b)=>fs.statSync(path.join(auditDir,b)).mtimeMs - fs.statSync(path.join(auditDir,a)).mtimeMs);
  distHashFile = dh[0] ? path.join(auditDir, dh[0]) : "";
}
if(!distHashFile) { console.error("ERR: missing dist hash file"); process.exit(1); }

const rollback = (() => {
  try { return sh("ls -1t dist_rollback_*.tgz 2>/dev/null | head -n 1"); }
  catch { return ""; }
})();

const head = sh("git rev-parse HEAD");
const branch = sh("git rev-parse --abbrev-ref HEAD");

const index = {
  ts,
  git: { branch, head, describe: (()=>{ try { return sh("git describe --tags --always"); } catch { return "<none>"; } })() },
  pointers: {
    release_bundle: { path: path.relative(cwd,bundle), sha256: sha256File(bundle) },
    release_notes: notes ? { path: path.relative(cwd,notes), sha256: sha256File(notes) } : { path: "<none>" },
    assets_manifest_latest: { path: path.relative(cwd,manifest), sha256: sha256File(manifest) },
    dist_tree_hash: { path: path.relative(cwd,distHashFile), sha256: sha256File(distHashFile) },
    rollback_tgz: rollback ? { path: rollback, sha256: sha256File(path.join(cwd,rollback)) } : { path: "<none>" }
  },
  commits: {
    p6: "17c665e"
  }
};

const out = path.join(cwd,"docs","release","RELEASE_INDEX.md");
const md = [
  `# RELEASE INDEX`,
  ``,
  `- Generated: ${ts}`,
  `- Branch: ${branch}`,
  `- HEAD: ${head}`,
  ``,
  `## Artifacts`,
  `- Release bundle: \`${index.pointers.release_bundle.path}\`  (sha256: \`${index.pointers.release_bundle.sha256}\`)`,
  `- Release notes: \`${index.pointers.release_notes.path}\`  (sha256: \`${index.pointers.release_notes.sha256}\`)`,
  `- Assets manifest (latest): \`${index.pointers.assets_manifest_latest.path}\`  (sha256: \`${index.pointers.assets_manifest_latest.sha256}\`)`,
  `- Dist tree hash: \`${index.pointers.dist_tree_hash.path}\`  (sha256: \`${index.pointers.dist_tree_hash.sha256}\`)`,
  `- Rollback archive: \`${index.pointers.rollback_tgz.path}\`  (sha256: \`${index.pointers.rollback_tgz.sha256 || "<none>"}\`)`,
  ``,
  `## Commits (pinned)`,
  `- P6 provenance gate: \`${index.commits.p6}\``,
  ``
].join("\n");

fs.writeFileSync(out, md + "\n");
console.log(out);
