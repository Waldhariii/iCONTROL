import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const offendersPath = path.join(repoRoot, "_audit", "P1_MIGRATION", "app_src_offenders.txt");

if (!fs.existsSync(offendersPath)) {
  console.error("ERR: missing offenders file:", offendersPath);
  process.exit(1);
}

const offenders = fs.readFileSync(offendersPath, "utf8")
  .split("\n")
  .filter(Boolean)
  .map(line => {
    const [file, lineNo, ...rest] = line.split(":");
    return { file, lineNo, text: rest.join(":") };
  });

const seenPairs = new Set();

// Only rewrite import specifiers that reference ./pages/... or ../pages/...
const importRe = new RegExp('(from\\s+)([\"\'])(\\.\\./pages/[^\"\' ]+|\\./pages/[^\"\' ]+)(\\2)', 'g');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function makeShimTarget(importPath) {
  const cleaned = importPath
    .replace(/^\.\/pages\//, "")
    .replace(/^\.\.\/pages\//, "");
  const shimRel = path.join("app", "src", "surfaces", "_legacy", cleaned + ".ts");
  return { cleaned, shimRel };
}

function writeShim(shimAbs, legacyImportPath) {
  const shimDir = path.dirname(shimAbs);
  const relFromShimToPages = path.relative(shimDir, path.join(repoRoot, "app", "src", "pages"));
  const cleaned = legacyImportPath
    .replace(/^\.\/pages\//, "")
    .replace(/^\.\.\/pages\//, "");
  const targetFromShim = path.join(relFromShimToPages, cleaned).replaceAll("\\", "/");

  const content =
`/**
 * AUTO-SHIM (P1): legacy pages re-export.
 * Purpose: keep PROD stable while migrating callers to surfaces.
 * DO NOT add tenant-specific data here.
 */
export * from "${targetFromShim}";
import def from "${targetFromShim}";
export default def;
`;

  ensureDir(shimDir);
  if (!fs.existsSync(shimAbs)) {
    fs.writeFileSync(shimAbs, content, "utf8");
  }
}

function rewriteFile(fileAbs) {
  const orig = fs.readFileSync(fileAbs, "utf8");
  let changed = false;

  const next = orig.replace(importRe, (m, p1, q, spec, p4) => {
    const { cleaned } = makeShimTarget(spec);
    const newSpec = `./surfaces/_legacy/${cleaned}`;
    changed = true;
    return `${p1}${q}${newSpec}${p4}`;
  });

  if (changed) {
    fs.writeFileSync(fileAbs, next, "utf8");
  }
  return changed;
}

let filesTouched = 0;
let shimsCreated = 0;

const specs = new Map();

for (const off of offenders) {
  const abs = path.join(repoRoot, off.file);
  if (!fs.existsSync(abs)) continue;

  let m;
  importRe.lastIndex = 0;
  const content = fs.readFileSync(abs, "utf8");
  while ((m = importRe.exec(content)) !== null) {
    const spec = m[3];
    const key = `${off.file}::${spec}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const { shimRel } = makeShimTarget(spec);
    specs.set(spec, shimRel);
  }
}

for (const [spec, shimRel] of specs.entries()) {
  const shimAbs = path.join(repoRoot, shimRel);
  writeShim(shimAbs, spec);
  if (!fs.existsSync(shimAbs)) continue;
  shimsCreated++;
}

const uniqueFiles = [...new Set(offenders.map(o => o.file))];
for (const f of uniqueFiles) {
  const abs = path.join(repoRoot, f);
  if (!fs.existsSync(abs)) continue;
  const changed = rewriteFile(abs);
  if (changed) filesTouched++;
}

console.log(`OK: shimsCreated=${shimsCreated} filesTouched=${filesTouched}`);
console.log("NOTE: this only rewrites import specifiers that directly reference ./pages/** or ../pages/** inside app/src (excluding tests/mockups).");
