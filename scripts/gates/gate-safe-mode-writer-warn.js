#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

const offenders = [];
const allow = new Set([
  "apps/control-plane/src/platform/tenantOverrides/safeModeStore.ts",
  "apps/control-plane/src/platform/tenantOverrides/safeMode.ts",
]);

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
  const rel = path.relative(repo, f).replace(/\\/g,"/");
  const txt = fs.readFileSync(f, "utf8");

  if (txt.includes("safe_mode.json") && !allow.has(rel)) {
    offenders.push(rel);
  }
}

if (offenders.length) {
  console.log("WARN_SAFE_MODE_WRITER: safe_mode.json referenced outside canonical store (warn-only):");
  offenders.forEach(o => console.log("- " + o));
}
console.log("OK: gate:safe-mode-writer-warn");
process.exit(0);
