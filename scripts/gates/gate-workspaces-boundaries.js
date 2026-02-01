#!/usr/bin/env node
/**
 * Gate: workspace boundary enforcement (heuristic, non-destructive).
 *
 * Intent: prevent accidental cross-workspace imports that bypass governance.
 * Version: V1
 *
 * Rules (initial, permissive):
 * - app/** must not import from server/**
 * - server/** must not import from app/**
 * - desktop must not import from server/**
 * - runtime/** must not import from server/**
 *
 * Notes:
 * - Scan excludes tests and generated/artefact dirs to reduce false positives.
 * - String/regex-based scan: keep it stable and fast.
 */
const fs = require("fs");
const path = require("path");

const repo = process.cwd();

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "_artifacts",
  "_backups",
  "dist",
]);

const IGNORE_FILE_RE = /\.(d\.ts|test\.(t|j)sx?|contract\.test\.(t|j)sx?)$/;

function isDesktopDirName(name) {
  return name.startsWith("app-desktop-");
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const relCur = path.relative(repo, cur).replace(/\\/g, "/");
    const base = path.basename(cur);

    if (IGNORE_DIRS.has(base)) continue;
    // ignore nested artefacts too
    if (relCur.split("/").some(p => IGNORE_DIRS.has(p))) continue;

    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile()) {
        const rel = path.relative(repo, p).replace(/\\/g, "/");
        if (IGNORE_FILE_RE.test(rel)) continue;
        if (rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".mjs")) out.push(p);
      }
    }
  }
  return out;
}

// Match: import ... from "X" | require("X") | import("X")
const IMPORT_RE = /(?:from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\))/g;

function scanDir(dir, forbidPrefixes) {
  const offenders = [];
  for (const f of walk(dir)) {
    const rel = path.relative(repo, f).replace(/\\/g, "/");
    const txt = fs.readFileSync(f, "utf8");

    let m;
    while ((m = IMPORT_RE.exec(txt)) !== null) {
      const spec = m[1] || m[2] || m[3] || "";
      for (const token of forbidPrefixes) {
        // forbid cross-workspace: exact prefix "server/" or relative traversals ending into "server/"
        if (spec === token.slice(0, -1) || spec.startsWith(token) || spec.includes(`/${token}`) || spec.includes(`../${token}`) || spec.includes(`../../${token}`)) {
          offenders.push({ rel, spec, token });
        }
      }
    }
  }
  return offenders;
}

const rules = [
  { name: "app", dir: path.join(repo, "app"), forbid: ["server/"] },
  { name: "server", dir: path.join(repo, "server"), forbid: ["app/"] },
  { name: "runtime", dir: path.join(repo, "runtime"), forbid: ["server/"] },
];

let offenders = [];
for (const r of rules) {
  if (fs.existsSync(r.dir)) offenders = offenders.concat(scanDir(r.dir, r.forbid));
}

// Desktop scan
for (const ent of fs.readdirSync(repo, { withFileTypes: true })) {
  if (ent.isDirectory() && isDesktopDirName(ent.name)) {
    offenders = offenders.concat(scanDir(path.join(repo, ent.name), ["server/"]));
  }
}

if (offenders.length) {
  console.error("ERR_WORKSPACES_BOUNDARIES_V1: forbidden cross-workspace imports detected:");
  for (const o of offenders) console.error(`- ${o.rel} :: imports "${o.spec}" (forbid ${o.token})`);
  process.exit(1);
}

console.log("OK: gate:workspaces-boundaries");
process.exit(0);
