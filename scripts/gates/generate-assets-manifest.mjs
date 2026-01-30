#!/usr/bin/env node
/* ICONTROL_ASSET_MANIFEST_V1
   Generates a deterministic manifest for dist/assets.
   Output: _audit/ASSETS_MANIFEST_<ts>.json
*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function tsStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function sha256File(fp) {
  const h = crypto.createHash("sha256");
  const buf = fs.readFileSync(fp);
  h.update(buf);
  return h.digest("hex");
}

const repoRoot = process.cwd();
const distAssets = path.join(repoRoot, "dist", "assets");

if (!fs.existsSync(distAssets)) {
  console.error(`ERR: dist/assets not found: ${distAssets}`);
  process.exit(1);
}

const files = walk(distAssets).sort();
const items = files.map((fp) => {
  const rel = path.relative(distAssets, fp).replaceAll(path.sep, "/");
  const st = fs.statSync(fp);
  return {
    file: rel,
    url: `/assets/${rel}`,
    bytes: st.size,
    sha256: sha256File(fp),
  };
});

const stamp = tsStamp();
const outPath = path.join(repoRoot, "_audit", `ASSETS_MANIFEST_${stamp}.json`);
const payload = {
  schema: "ICONTROL_ASSET_MANIFEST_V1",
  createdAt: new Date().toISOString(),
  distAssets: "dist/assets",
  count: items.length,
  totalBytes: items.reduce((a, x) => a + x.bytes, 0),
  items,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`OK: wrote ${outPath}`);
