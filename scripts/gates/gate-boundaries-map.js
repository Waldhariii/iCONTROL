#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

// Temporary allowlist (min-risk): keep build stable while converging platform-services into app/src/platform/* via ADR.
// Only these files may import platform-services.
const ALLOWLIST_FILES = new Set([
  "app/src/main.ts",
]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js") || p.endsWith(".mjs"))) out.push(p);
  }
  return out;
}

const files = walk(appSrc);
const offenders = [];

for (const f of files) {
  const rel = path.relative(repo, f).replace(/\\/g, "/");
  const txt = fs.readFileSync(f, "utf8");

  const isAllowlisted = ALLOWLIST_FILES.has(rel);

  // Disallow new dependencies on parallel kernels from browser runtime (with allowlist)
  if (!isAllowlisted && (/\bfrom\s+["'].*platform-services\//.test(txt) || /\brequire\(["'].*platform-services\//.test(txt))) {
    offenders.push(`${rel} :: platform-services import`);
  }

  if (/\bfrom\s+["'].*core-kernel\//.test(txt) || /\brequire\(["'].*core-kernel\//.test(txt)) {
    offenders.push(`${rel} :: core-kernel import`);
  }

  // Disallow importing root runtime folder from app/src (avoid confusion)
  if (/\bfrom\s+["']\.\.\/\.\.\/runtime\//.test(txt) || /\bfrom\s+["']runtime\//.test(txt)) {
    offenders.push(`${rel} :: root runtime import`);
  }
}

if (offenders.length) {
  fail("ERR_BOUNDARIES_VIOLATION: forbidden imports detected:\n" + offenders.map(s => `- ${s}`).join("\n") + "\nSee STRUCTURE_BOUNDARIES.md");
}

ok("OK: gate:boundaries-map");
