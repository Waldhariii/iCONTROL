#!/usr/bin/env node
/**
 * Gate: workspace boundary enforcement (heuristic, non-destructive).
 * Goal: prevent accidental cross-package imports that bypass governance.
 *
 * Rules (initial):
 * - app/** must not import from server/**
 * - server/** must not import from app/**
 * - desktop must not import from server/**
 * - runtime/** must not import from server/** (server owns server)
 *
 * NOTE: This is a string-based scan; keep it stable and fast.
 */
const fs = require("fs");
const path = require("path");

const repo = process.cwd();
const targets = [
  { name: "app", dir: path.join(repo, "app"), forbid: ["server/"], allow: ["app/src/__tests__/runtime-config.ssot.endpoint.contract.test.ts"] },
  { name: "server", dir: path.join(repo, "server"), forbid: ["app/"] },
  { name: "runtime", dir: path.join(repo, "runtime"), forbid: ["server/"] },
];

function isDesktopDir(p) {
  const b = path.basename(p);
  return b.startsWith("app-desktop-");
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js") || p.endsWith(".mjs"))) out.push(p);
  }
  return out;
}

function scanDir(name, dir, forbid, allow = []) {
  const offenders = [];
  for (const f of walk(dir)) {
    const rel = path.relative(repo, f).replace(/\\/g, "/");
    if (allow.includes(rel)) continue;
    const txt = fs.readFileSync(f, "utf8");
    for (const token of forbid) {
      // forbid import paths referencing other workspace root (relative or aliased)
      if (txt.includes(`from "${token}`) || txt.includes(`from '${token}`) || txt.includes(`from "../${token}`) || txt.includes(`from '../../${token}`) || txt.includes(`from "../../../${token}`)) {
        offenders.push({ rel, token });
      }
    }
  }
  if (offenders.length) return offenders;
  return null;
}

// Desktop scan
const desktopOff = [];
for (const ent of fs.readdirSync(repo, { withFileTypes: true })) {
  if (ent.isDirectory() && isDesktopDir(ent.name)) {
    const d = path.join(repo, ent.name);
    const off = scanDir("desktop", d, ["server/"]);
    if (off) desktopOff.push(...off);
  }
}

let offenders = [];
for (const t of targets) {
  const off = scanDir(t.name, t.dir, t.forbid, t.allow || []);
  if (off) offenders.push(...off);
}
offenders = offenders.concat(desktopOff);

if (offenders.length) {
  console.error("ERR_WORKSPACES_BOUNDARIES: forbidden cross-workspace imports detected:");
  for (const o of offenders) console.error(`- ${o.rel} :: imports ${o.token}`);
  process.exit(1);
}
console.log("OK: gate:workspaces-boundaries");
process.exit(0);
