#!/usr/bin/env node
/**
 * Gate: workspace boundary enforcement (SSOT-driven).
 *
 * Source of truth: runtime/configs/boundaries/packages.json
 * Version: V2
 *
 * Heuristic scan:
 * - Extract import specifiers from TS/JS files
 * - If an import references another workspace root, enforce allowImportsFrom for that package.
 */
const fs = require("fs");
const path = require("path");

const repo = process.cwd();

const IGNORE_DIRS = new Set([".git", "node_modules", "_artifacts", "_backups", "dist"]);
const IGNORE_FILE_RE = /\.(d\.ts|test\.(t|j)sx?|contract\.test\.(t|j)sx?)$/;
const IMPORT_RE = /(?:from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|import\(\s*["']([^"']+)["']\s*\))/g;

function readSSOT() {
  const p = path.join(repo, "runtime", "configs", "boundaries", "packages.json");
  const raw = fs.readFileSync(p, "utf8");
  const cfg = JSON.parse(raw);
  if (!cfg || cfg.schemaVersion !== 1 || !cfg.packages) throw new Error("ERR_BOUNDARIES_SSOT_INVALID");
  return cfg;
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
    if (relCur.split("/").some(p => IGNORE_DIRS.has(p))) continue;

    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }

    for (const ent of entries) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) {
        const rel = path.relative(repo, p).replace(/\\/g, "/");
        if (IGNORE_FILE_RE.test(rel)) continue;
        if (rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".mjs")) out.push(p);
      }
    }
  }
  return out;
}

function pkgKeyForFile(cfg, relPath) {
  // Determine package by path prefix / glob-like "app-desktop-*"
  const pkgs = cfg.packages || {};
  for (const [k, v] of Object.entries(pkgs)) {
    const p = v.path;
    if (!p) continue;
    if (p.endsWith("*")) {
      const prefix = p.slice(0, -1);
      if (relPath.startsWith(prefix)) return k;
    } else {
      const prefix = p.endsWith("/") ? p : (p === "." ? "" : p + "/");
      if (p === "." && !relPath.includes("/")) return k; // root files
      if (prefix && relPath.startsWith(prefix)) return k;
      if (p === "." && relPath.includes("/")) continue;
    }
  }
  // Fallback: infer by first segment
  const first = relPath.split("/")[0];
  if (first.startsWith("app-desktop-")) return "desktop";
  if (first === "modules") return "modules";
  if (first === "apps") return "app";
  if (first === "platform") return "server";
  if (first === "runtime") return "runtime";
  if (first === "core") return "shared";
  if (first === "governance") return "governance";
  if (first === "design-system") return "design-system";
  return "root";
}

function pkgKeyForImport(spec) {
  // Detect if an import spec points into a workspace root
  // We only govern obvious workspace roots (not npm deps).
  const s = spec.replace(/^\.\/+/, "").replace(/^(\.\.\/)+/, "");
  const first = s.split("/")[0];
  if (first === "apps") return "app";
  if (first === "platform") return "server";
  if (first === "runtime") return "runtime";
  if (first === "modules") return "modules";
  if (first === "core") return "shared";
  if (first === "governance") return "governance";
  if (first === "design-system") return "design-system";
  if (first === "runtime" && s.startsWith("runtime/configs")) return "config";
  if (first.startsWith("app-desktop-")) return "desktop";
  return null;
}

function isAllowed(cfg, fromPkg, toPkg) {
  const def = cfg.packages?.[fromPkg];
  if (!def) return true; // permissive if unknown
  const allow = new Set(def.allowImportsFrom || []);
  return allow.has(toPkg) || allow.has(fromPkg);
}

function scan(cfg, startDirs) {
  const offenders = [];
  for (const dir of startDirs) {
    for (const f of walk(dir)) {
      const rel = path.relative(repo, f).replace(/\\/g, "/");
      const fromPkg = pkgKeyForFile(cfg, rel);
      const txt = fs.readFileSync(f, "utf8");

      let m;
      while ((m = IMPORT_RE.exec(txt)) !== null) {
        const spec = m[1] || m[2] || m[3] || "";
        const toPkg = pkgKeyForImport(spec);
        if (!toPkg) continue;
        if (toPkg === fromPkg) continue;

        if (!isAllowed(cfg, fromPkg, toPkg)) {
          offenders.push({ rel, fromPkg, toPkg, spec });
        }
      }
    }
  }
  return offenders;
}

let cfg;
try {
  cfg = readSSOT();
} catch (e) {
  console.error("ERR_WORKSPACES_BOUNDARIES_V2: cannot read SSOT packages.json");
  process.exit(1);
}

const dirs = ["apps", "platform", "runtime", "modules", "core", "governance", "design-system"]
  .map(d => path.join(repo, d))
  .filter(d => fs.existsSync(d));

// Include desktops if present
for (const ent of fs.readdirSync(repo, { withFileTypes: true })) {
  if (ent.isDirectory() && ent.name.startsWith("app-desktop-")) dirs.push(path.join(repo, ent.name));
}

const offenders = scan(cfg, dirs);

if (offenders.length) {
  console.error("ERR_WORKSPACES_BOUNDARIES_V2: SSOT boundary violations detected:");
  for (const o of offenders) {
    console.error(`- ${o.rel} :: ${o.fromPkg} imports ${o.toPkg} via "${o.spec}" (not allowed by SSOT)`);
  }
  process.exit(1);
}

console.log("OK: gate:workspaces-boundaries (SSOT)");
process.exit(0);
