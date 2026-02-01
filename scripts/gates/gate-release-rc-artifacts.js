#!/usr/bin/env node
/* gate:release-rc-artifacts — fail-closed */
const fs = require("fs");
const path = require("path");

const REPO = process.cwd();
const offenders = [];

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function isTracked(p) {
  try {
    const cp = require("child_process");
    cp.execSync(`git ls-files --error-unmatch "${p.replace(/"/g,'\\"')}"`, { stdio: "ignore" });
    return true;
  } catch { return false; }
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

if (isTracked("_artifacts")) offenders.push("ERR_RELEASE_RC_TRACKED: _artifacts/ must not be tracked");
if (isTracked("_audit")) offenders.push("ERR_RELEASE_RC_TRACKED: _audit/ must not be tracked");

if (offenders.length) {
  console.error(offenders.join("\n"));
  process.exit(1);
}
console.log("OK: gate:release-rc-artifacts");
