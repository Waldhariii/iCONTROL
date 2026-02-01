#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const modulesDir = path.join(repo, "modules");

const IGNORE_DIRS = new Set([".git", "node_modules", "_artifacts", "_backups", "dist"]);
const IGNORE_FILE_RE = /\.(d\.ts|test\.(t|j)sx?|contract\.test\.(t|j)sx?)$/;
const IMPORT_RE = /(?:from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)"\s*\))/g;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const relCur = path.relative(repo, cur).replace(/\\/g, "/");
    const base = path.basename(cur);
    if (IGNORE_DIRS.has(base)) continue;
    if (relCur.split("/").some(p => IGNORE_DIRS.has(p))) continue;

    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) {
        const rel = path.relative(repo, p).replace(/\\/g, "/");
        if (IGNORE_FILE_RE.test(rel)) continue; // ignore tests + d.ts
        if (rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".mjs")) out.push(p);
      }
    }
  }
  return out;
}

if (!fs.existsSync(modulesDir)) {
  console.log("OK: gate:modules-no-app-imports (no modules/)");
  process.exit(0);
}

const offenders = [];
for (const f of walk(modulesDir)) {
  const rel = path.relative(repo, f).replace(/\\/g, "/");
  const txt = fs.readFileSync(f, "utf8");
  let m;
  while ((m = IMPORT_RE.exec(txt)) !== null) {
    const spec = m[1] || m[2] || m[3] || "";
    const s = spec.replace(/^\.\/+/, "").replace(/^(\.\.\/)+/, "");
    if (s.startsWith("app/") || s.startsWith("app/src/") || s.includes("/app/") || s.includes("/app/src/")) {
      offenders.push({ rel, spec });
    }
  }
}

if (offenders.length) {
  console.error("ERR_MODULES_NO_APP_IMPORTS: modules must not import from app/**");
  offenders.forEach(o => console.error(`- ${o.rel} :: imports "${o.spec}"`));
  process.exit(1);
}

console.log("OK: gate:modules-no-app-imports");
process.exit(0);
