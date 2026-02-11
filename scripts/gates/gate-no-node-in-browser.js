#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
function ok(msg) {
  console.log(msg);
}

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

const NODE_CORE = [
  "fs",
  "path",
  "crypto",
  "os",
  "child_process",
  "worker_threads",
  "net",
  "tls",
  "http",
  "https",
  "zlib",
  "stream",
];

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

  // Allow Node-only folder
  if (rel.includes("apps/control-plane/src/platform/runtimeConfig/node/")) continue;

  const txt = fs.readFileSync(f, "utf8");

  // Block direct imports/requires of Node core modules in browser build area
  for (const mod of NODE_CORE) {
    const re1 = new RegExp(`\\bfrom\\s+["']${mod}["']`, "m");
    const re2 = new RegExp(`\\brequire\\(["']${mod}["']\\)`, "m");
    if (re1.test(txt) || re2.test(txt)) {
      offenders.push({ rel, mod });
    }
  }

  // Block importing the node runtimeConfig entry from non-node files
  if (/platform\/runtimeConfig\/node/.test(txt) || /runtimeConfig\/node/.test(txt)) {
    offenders.push({ rel, mod: "runtimeConfig/node import" });
  }
}

if (offenders.length) {
  const lines = offenders.map(o => `- ${o.rel} :: ${o.mod}`).join("\n");
  fail("ERR_NO_NODE_IN_BROWSER: Node-only modules/imports detected outside runtimeConfig/node:\n" + lines);
}

ok("OK: gate:no-node-in-browser");
