#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function ok(msg){ console.log(msg); }

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

const offenders = [];

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".css"))) out.push(p);
  }
  return out;
}

// Simple heuristic: hex colors and rgb/rgba/hsl
const COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsl[a]?\()/;

for (const f of walk(appSrc)) {
  const rel = path.relative(repo, f).replace(/\\/g, "/");
  // Allow design token files or theme layer (we want vars there)
  if (rel.includes("app/src/platform/theme/")) continue;

  const txt = fs.readFileSync(f, "utf8");
  if (COLOR_RE.test(txt)) offenders.push(rel);
}

if (offenders.length) {
  console.log("WARN_HARDCODED_COLORS: detected potential hardcoded colors (warn-only).");
  offenders.slice(0, 50).forEach(o => console.log("- " + o));
  console.log("OK: gate:no-hardcoded-colors-warn");
  process.exit(0);
}

ok("OK: gate:no-hardcoded-colors-warn");
