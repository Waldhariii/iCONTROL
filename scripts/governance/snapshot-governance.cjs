/**
 * Deterministic snapshot packer:
 * - Copies governance/ into _gov_pack/** with stable metadata
 * - Writes checksums
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function sha256File(fp) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(fp));
  return h.digest("hex");
}

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const root = process.cwd();
const gov = path.join(root, "governance");
const outdir = process.argv[2];
if (!outdir) {
  console.error("[FAIL] usage: node scripts/governance/snapshot-governance.cjs <outdir>");
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

function copyRecursive(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dst, name));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

copyRecursive(gov, path.join(outdir, "governance"));

const files = walk(path.join(outdir, "governance")).sort();
const checks = files.map(fp => {
  const rel = fp.replace(outdir + path.sep, "").split(path.sep).join("/");
  return { file: rel, sha256: sha256File(fp) };
});

fs.writeFileSync(
  path.join(outdir, "GOVERNANCE_CHECKSUMS.json"),
  JSON.stringify({ kind: "GOV_PACK_V1", count: checks.length, items: checks }, null, 2) + "\n"
);

console.log("[OK] governance snapshot created:", outdir);
console.log("[OK] checksums written: GOV_PACK_V1 items=" + checks.length);
