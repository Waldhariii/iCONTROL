import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const cwd = process.cwd();
const idxMd = path.join(cwd, "docs/release/RELEASE_INDEX.md");
const idxJson = path.join(cwd, "docs/release/RELEASE_INDEX.json");
const man = path.join(cwd, "docs/release/ASSETS_MANIFEST_LATEST.json");

function sha256File(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}

function die(msg) {
  console.error(`[gate:release:consistency][FAIL] ${msg}`);
  process.exit(1);
}

for (const p of [idxMd, idxJson, man]) {
  if (!fs.existsSync(p)) die(`missing required file: ${path.relative(cwd, p)}`);
}

const j = JSON.parse(fs.readFileSync(idxJson, "utf8"));
const manSha = sha256File(man);
if (!j.assets_manifest_latest || j.assets_manifest_latest.sha256 !== manSha) {
  die(`ASSETS_MANIFEST_LATEST.json sha mismatch (index.json=${j?.assets_manifest_latest?.sha256 || "<none>"} vs actual=${manSha})`);
}

const bundlePath = path.isAbsolute(j.release_bundle?.path || "") ? j.release_bundle.path : path.join(cwd, j.release_bundle?.path || "");
if (!bundlePath || !fs.existsSync(bundlePath)) die(`bundle file missing: ${j.release_bundle?.path || "<none>"}`);

const bundleSha = sha256File(bundlePath);
if (j.release_bundle?.sha256 !== bundleSha) {
  die(`RELEASE_BUNDLE sha mismatch (index.json=${j.release_bundle?.sha256 || "<none>"} vs actual=${bundleSha})`);
}

const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const bundleManifest = bundle.assets_manifest || bundle.assetsManifest || "";
if (bundleManifest && !bundleManifest.endsWith("ASSETS_MANIFEST_LATEST.json")) {
  const bp = path.isAbsolute(bundleManifest) ? bundleManifest : path.join(cwd, bundleManifest);
  if (!fs.existsSync(bp)) die(`bundle references missing assets manifest: ${bundleManifest}`);
}

const idx = fs.readFileSync(idxMd, "utf8");
const commit = bundle.commit || "";
if (commit && !idx.includes(commit.slice(0, 7))) {
  die(`index.md does not mention bundle commit (${commit.slice(0, 12)}).`);
}

console.log("[gate:release:consistency][OK] index.json/bundle/manifest are cryptographically consistent.");
