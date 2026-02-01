#!/usr/bin/env node
/* Fail-closed tag integrity gate.
   Rule: RC/prod-candidate/baseline must all point to same commit as HEAD (per snapshot).
*/
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trim();
}

function latestRcTag() {
  const out = sh("git tag --list 'rc-*' --sort=-creatordate | head -n 1 || true");
  return out || "";
}

function rev(tag) {
  try { return sh(`git rev-list -n 1 ${tag}`); } catch { return ""; }
}

const head = sh("git rev-parse HEAD");
const rc = latestRcTag();
if (!rc) {
  console.error("ERR_TAG_INTEGRITY: no rc-* tag found");
  process.exit(2);
}
const metaDir = path.join(process.cwd(), "_artifacts", "release", "rc", rc, "meta");
const snapPath = path.join(metaDir, "tags.json");

let snap = null;
if (fs.existsSync(snapPath)) {
  snap = JSON.parse(fs.readFileSync(snapPath, "utf8"));
}

const suffix = rc.replace(/^rc-/, "");
const prod = `prod-candidate-${suffix}`;
const base = `baseline-${suffix}`;

const rcSha = rev(rc);
const prodSha = rev(prod);
const baseSha = rev(base);

function fail(msg) {
  console.error(msg);
  console.error(`head=${head}`);
  console.error(`rc=${rc} -> ${rcSha}`);
  console.error(`prod=${prod} -> ${prodSha}`);
  console.error(`baseline=${base} -> ${baseSha}`);
  if (snap) console.error(`snapshot_head=${snap.head || ""}`);
  process.exit(1);
}

if (!rcSha || !prodSha || !baseSha) {
  fail("ERR_TAG_INTEGRITY: missing required tag(s) for latest RC set");
}

if (snap && snap.head && snap.head !== head) {
  fail("ERR_TAG_INTEGRITY: snapshot head != current HEAD (run tag-set-atomic)");
}

if (!(rcSha === head && prodSha === head && baseSha === head)) {
  fail("ERR_TAG_INTEGRITY: tag drift detected (run tag-set-atomic)");
}

console.log("OK: gate:tag-integrity");
