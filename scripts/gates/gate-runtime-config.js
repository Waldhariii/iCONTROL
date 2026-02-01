#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function ok(msg) {
  console.log(msg);
}

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

// 1) runtime config must NOT be tracked
const tracked = sh(`git ls-files -- ".icontrol_subscriptions.json" || true`);
if (tracked) fail("ERR_RUNTIME_CONFIG_TRACKED: .icontrol_subscriptions.json must not be tracked");

// 2) example must exist
if (!fs.existsSync(path.resolve(".icontrol_subscriptions.example.json"))) {
  fail("ERR_RUNTIME_CONFIG_EXAMPLE_MISSING: .icontrol_subscriptions.example.json is required");
}

// 3) example must be valid JSON and schemaVersion=1
let raw;
try {
  raw = JSON.parse(fs.readFileSync(".icontrol_subscriptions.example.json", "utf8"));
} catch (e) {
  fail("ERR_RUNTIME_CONFIG_EXAMPLE_INVALID_JSON: example file must be valid JSON");
}
if (!raw || typeof raw !== "object") fail("ERR_RUNTIME_CONFIG_EXAMPLE_INVALID: root must be object");
if (raw.schemaVersion !== 1) fail("ERR_RUNTIME_CONFIG_EXAMPLE_SCHEMA_VERSION: schemaVersion must be 1");
if (!raw.defaultTier) fail("ERR_RUNTIME_CONFIG_EXAMPLE_DEFAULT_TIER: defaultTier required");

// 4) forbid direct fs/path imports outside runtimeConfig folder (best-effort)
const repo = sh("git rev-parse --show-toplevel");
const appSrc = path.join(repo, "app", "src");
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
  if (rel.includes("app/src/platform/runtimeConfig/")) continue;
  const txt = fs.readFileSync(f, "utf8");
  // Conservative: flag node fs/path imports
  const hasFs = /\bfrom\s+["']fs["']|\brequire\(["']fs["']\)/.test(txt);
  const hasPath = /\bfrom\s+["']path["']|\brequire\(["']path["']\)/.test(txt);
  if (hasFs || hasPath) offenders.push(rel);
}

if (offenders.length) {
  fail("ERR_RUNTIME_CONFIG_DIRECT_FS_IMPORT: fs/path imports found outside platform/runtimeConfig:\n" + offenders.map(s => `- ${s}`).join("\n"));
}

ok("OK: gate:runtime-config");
