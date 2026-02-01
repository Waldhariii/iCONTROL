#!/usr/bin/env node
/* gate:release-rc-artifacts — fail-closed */
const fs = require("fs");
const path = require("path");

const REPO = process.cwd();
const offenders = [];

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function trackedList(prefix) {
  try {
    const cp = require("child_process");
    return cp.execSync(`git ls-files "${prefix}"`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const badRoot = [
  "dist",
  "dist_rollback",
];
for (const b of badRoot) {
  const p = path.join(REPO, b);
  if (exists(p)) offenders.push(`ERR_RELEASE_RC_ARTIFACT_ROOT: ${b} exists at repo root`);
}

for (const file of fs.readdirSync(REPO)) {
  if (/^dist_rollback_.*\.tgz$/.test(file)) offenders.push(`ERR_RELEASE_RC_ARTIFACT_ROOT: ${file} rollback tgz at repo root`);
  if (/^_AUDIT_.*\.log$/.test(file)) offenders.push(`ERR_RELEASE_RC_ARTIFACT_ROOT: ${file} ad-hoc audit log at repo root`);
}

const gi = path.join(REPO, ".gitignore");
if (!exists(gi)) offenders.push("ERR_RELEASE_RC_GITIGNORE: .gitignore missing");
else {
  const s = fs.readFileSync(gi, "utf8");
  const must = ["_artifacts/", "_audit/"];
  for (const m of must) if (!s.includes(m)) offenders.push(`ERR_RELEASE_RC_GITIGNORE: missing ignore '${m}'`);
}

const trackedArtifacts = trackedList("_artifacts");
const allowPrefix = "_artifacts/release/rc/";
const badTrackedArtifacts = trackedArtifacts.filter(p => !p.startsWith(allowPrefix));
if (badTrackedArtifacts.length) {
  offenders.push("ERR_RELEASE_RC_TRACKED: _artifacts/ must not be tracked outside _artifacts/release/rc/**");
  badTrackedArtifacts.slice(0, 20).forEach(p => offenders.push(`- ${p}`));
}

const trackedAudit = trackedList("_audit");
if (trackedAudit.length) offenders.push("ERR_RELEASE_RC_TRACKED: _audit/ must not be tracked");

if (offenders.length) {
  console.error(offenders.join("\n"));
  process.exit(1);
}
console.log("OK: gate:release-rc-artifacts");
