#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");

function sh(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString("utf8").trim();
}

const branch = sh("git rev-parse --abbrev-ref HEAD");
const head = sh("git rev-parse --short HEAD");

const outRoot = "_gov_pack_final";
const outDir = path.join(outRoot, `${branch}_${head}`);
const govSrc = "governance";

function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function sha(fp) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(fp));
  return h.digest("hex");
}

if (!fs.existsSync(govSrc) || !fs.statSync(govSrc).isDirectory()) {
  console.error("[FAIL] missing governance folder:", govSrc);
  process.exit(1);
}

rmrf(outDir);
mkdirp(outDir);

function copyDir(src, dst) {
  mkdirp(dst);
  for (const name of fs.readdirSync(src)) {
    const a = path.join(src, name);
    const b = path.join(dst, name);
    const st = fs.statSync(a);
    if (st.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

copyDir(govSrc, path.join(outDir, "governance"));

const files = walk(path.join(outDir, "governance")).sort();
const items = files.map(fp => ({
  file: fp.replace(outDir + path.sep, "").split(path.sep).join("/"),
  sha256: sha(fp)
}));

const checks = { kind: "GOV_PACK_V1", branch, head, count: items.length, items };
fs.writeFileSync(path.join(outDir, "GOVERNANCE_CHECKSUMS.json"), JSON.stringify(checks, null, 2) + "\n");

const tar = `${outDir}.tar.gz`;
execSync(`tar -czf "${tar}" "${outDir}"`, { stdio: "inherit" });

console.log("[OK] governance pack built:");
console.log(" -", tar);
console.log(" -", path.join(outDir, "GOVERNANCE_CHECKSUMS.json"));
