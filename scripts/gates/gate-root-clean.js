#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const root = process.cwd();

const forbiddenExact = [
  "dist",
];

const forbiddenPrefix = [
  "dist_rollback",
];

function isForbidden(name) {
  if (forbiddenExact.includes(name)) return true;
  for (const p of forbiddenPrefix) if (name.startsWith(p)) return true;
  if (name === ".DS_Store") return true;
  if (/^_AUDIT_.*\.log$/i.test(name)) return true;
  if (/rollback.*\.tgz$/i.test(name)) return true;
  return false;
}

const entries = fs.readdirSync(root, { withFileTypes: true });
const offenders = [];

for (const ent of entries) {
  const name = ent.name;
  if (isForbidden(name)) offenders.push(name);
}

if (offenders.length) {
  fail(
    "ERR_ROOT_NOT_CLEAN: forbidden artefacts found at repo root:\n" +
    offenders.map(o => `- ${o}`).join("\n") +
    "\nPolicy: see governance/docs/SECURITY/ARTEFACTS_POLICY.md"
  );
}

ok("OK: gate:root-clean");
