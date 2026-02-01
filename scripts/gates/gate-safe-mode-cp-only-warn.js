#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

const allow = new Set([
  "app/src/platform/tenantOverrides/safeMode.ts",
  "app/src/platform/controlPlane/commands/clearTenantOverridesSafeMode.ts",
  "app/src/platform/controlPlane/commands/enableTenantOverridesSafeMode.ts",
]);

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
  const rel = path.relative(repo, f).replace(/\\/g,"/");
  const txt = fs.readFileSync(f, "utf8");

  const hits =
    (txt.includes("enableTenantOverridesSafeMode(") || txt.includes("clearTenantOverridesSafeMode(")) &&
    !allow.has(rel);

  if (hits) offenders.push(rel);
}

if (offenders.length) {
  console.log("WARN_SAFE_MODE_CP_ONLY: enable/clear SAFE_MODE used outside CP commands (warn-only):");
  offenders.forEach(o => console.log("- " + o));
}
console.log("OK: gate:safe-mode-cp-only-warn");
process.exit(0);
