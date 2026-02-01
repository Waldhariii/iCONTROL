#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const repo = process.cwd();
const dir = path.join(repo, "app", "src", "platform", "tenantOverrides");
if (!fs.existsSync(dir)) ok("OK: gate:tenant-overrides-no-node (dir missing)");

const NODE_CORE = ["fs","path","crypto","os","child_process","worker_threads","net","tls","http","https","zlib","stream"];
const offenders = [];

function walk(d) {
  const out = [];
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js") || p.endsWith(".mjs"))) out.push(p);
  }
  return out;
}

for (const f of walk(dir)) {
  const rel = path.relative(repo, f).replace(/\\/g,"/");
  const txt = fs.readFileSync(f, "utf8");
  for (const mod of NODE_CORE) {
    const modNode = `node:${mod}`;
    if (
      new RegExp(`\\bfrom\\s+["']${mod}["']`).test(txt) ||
      new RegExp(`\\bfrom\\s+["']${modNode}["']`).test(txt) ||
      new RegExp(`\\brequire\\(["']${mod}["']\\)`).test(txt) ||
      new RegExp(`\\brequire\\(["']${modNode}["']\\)`).test(txt)
    ) {
      offenders.push(`${rel} :: ${mod}`);
    }
  }
}

if (offenders.length) {
  fail("ERR_TENANT_OVERRIDES_NODE_IMPORT: Node core imports detected:\n" + offenders.map(x=>`- ${x}`).join("\n"));
}

ok("OK: gate:tenant-overrides-no-node");
