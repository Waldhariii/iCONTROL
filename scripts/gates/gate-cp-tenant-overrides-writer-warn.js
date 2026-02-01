#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

const offenders = [];
const allow = new Set([
  "app/src/platform/tenantOverrides/store.ts",
  "app/src/platform/controlPlane/commands/writeTenantOverrides.ts",
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
  const rel = path.relative(repo, f).replace(/\\/g, "/");
  const txt = fs.readFileSync(f, "utf8");

  // Detect direct calls to writeTenantOverrides outside allowlist (warn-only)
  if (txt.includes("writeTenantOverrides(") && !allow.has(rel)) {
    offenders.push(rel);
  }
}

if (offenders.length) {
  console.log("WARN_CP_OVERRIDES_WRITER: writeTenantOverrides() used outside canonical CP command (warn-only):");
  offenders.forEach(o => console.log("- " + o));
}
console.log("OK: gate:cp-tenant-overrides-writer-warn");
process.exit(0);
