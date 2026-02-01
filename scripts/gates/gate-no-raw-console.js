#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

// WARN-first: do not fail build; just report. (Can be promoted to strict later.)
const offenders = [];

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx"))) out.push(p);
  }
  return out;
}

for (const f of walk(appSrc)) {
  const rel = path.relative(repo, f).replace(/\\/g, "/");
  if (rel.includes("app/src/platform/observability/")) continue;
  const txt = fs.readFileSync(f, "utf8");
  if (/\bconsole\.(log|info|warn|error|debug)\b/.test(txt)) offenders.push(rel);
}

if (offenders.length) {
  console.log("WARN_NO_RAW_CONSOLE: console.* usages detected outside platform/observability (warn-only):");
  offenders.slice(0, 50).forEach(f => console.log("- " + f));
  console.log("OK: gate:no-raw-console (warn-only)");
  process.exit(0);
}

ok("OK: gate:no-raw-console");
