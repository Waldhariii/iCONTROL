#!/usr/bin/env node
/* ICONTROL_RELEASE_BUNDLE_V1 */
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";

function sh(cmd){
  return execSync(cmd,{encoding:"utf8"}).trim();
}
function sha256File(p){
  const b = fs.readFileSync(p);
  return crypto.createHash("sha256").update(b).digest("hex");
}

const ts = process.env.TS || new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
const cwd = process.cwd();

const distHashPath = path.join(cwd,"_audit","LAST_DIST_TREE_HASH.txt");
const distHash = fs.existsSync(distHashPath) ? fs.readFileSync(distHashPath,"utf8").trim() : "<missing>";

const stableManifest = path.join(cwd,"ASSETS_MANIFEST_LATEST.json");
if(!fs.existsSync(stableManifest)){
  console.error("ERR: missing ASSETS_MANIFEST_LATEST.json");
  process.exit(1);
}

const rollback = (() => {
  try {
    const p = sh("ls -1t dist_rollback_*.tgz 2>/dev/null | head -n 1");
    if (!p) return "<none>";
    const full = path.join(cwd, p);
    return fs.existsSync(full) && fs.statSync(full).isFile() ? p : "<none>";
  } catch {
    return "<none>";
  }
})();

const nodeV = process.version;
let npmV = "<unknown>";
try { npmV = sh("npm --version"); } catch {}

const bundle = {
  ts,
  git: {
    branch: sh("git rev-parse --abbrev-ref HEAD"),
    head: sh("git rev-parse HEAD"),
    describe: (()=>{ try { return sh("git describe --tags --always"); } catch { return "<none>"; } })(),
  },
  env: {
    node: nodeV,
    npm: npmV,
    platform: process.platform,
    arch: process.arch,
    cwd: cwd,
  },
  artifacts: {
    dist_tree_hash: distHash,
    assets_manifest_latest: {
      path: "ASSETS_MANIFEST_LATEST.json",
      sha256: sha256File(stableManifest),
    },
    rollback_tgz: rollback !== "<none>" ? {
      path: rollback,
      sha256: sha256File(path.join(cwd, rollback)),
    } : { path: "<none>" },
  }
};

const outDir = path.join(cwd,"docs","release");
fs.mkdirSync(outDir,{recursive:true});
const out = path.join(outDir, `RELEASE_BUNDLE_${ts}.json`);
fs.writeFileSync(out, JSON.stringify(bundle,null,2) + "\n");
console.log(out);
