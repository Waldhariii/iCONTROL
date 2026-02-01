import fs from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const ROOT = REPO;
const DIST = isDir(path.join(REPO, "app", "dist")) ? path.join(REPO, "app", "dist") : path.join(REPO, "dist");
const APP = path.join(DIST, "app");
const CP  = path.join(DIST, "cp");
const OUT = path.join(DIST, "assets");
let MODE = "multi";

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

function safeLinkStub(stubPath, targetPath) {
  // Remove any existing stub
  try {
    if (exists(stubPath)) fs.rmSync(stubPath, { recursive: true, force: true });
  } catch {}
  // Prefer symlink (works on mac/linux). If fails, create empty dir.
  try {
    fs.symlinkSync(targetPath, stubPath, "dir");
  } catch {
    mkdirp(stubPath);
  }
}

function listFilesFlat(dir) {
  // Vite assets are flat by default; but we support nested.
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) out.push(p);
    }
  }
  return out;
}

function relFrom(dir, file) {
  return path.relative(dir, file).replaceAll("\\", "/");
}

function ensureInputs() {
  if (!isDir(DIST)) throw new Error("ERR: dist/ missing. Run builds first.");
  if (isDir(APP) && isDir(CP)) {
    const a1 = path.join(APP, "index.html");
    const c1 = path.join(CP, "index.html");
    if (!exists(a1) || !exists(c1)) throw new Error("ERR: dist/*/index.html missing.");
    MODE = "multi";
    return;
  }

  if (isDir(APP) && !isDir(CP)) {
    const a1 = path.join(APP, "index.html");
    const aAssets = path.join(APP, "assets");
    if (exists(a1) && isDir(aAssets)) {
      MODE = "single";
      return;
    }
  }

  const singleIndex = path.join(DIST, "index.html");
  const singleAssets = path.join(DIST, "assets");
  if (exists(singleIndex) && isDir(singleAssets)) {
    MODE = "single";
    return;
  }

  throw new Error("ERR: dist/app or dist/cp missing. Run build:app + build:cp first.");
}

function moveAssets() {
  const appAssets = path.join(APP, "assets");
  const cpAssets  = path.join(CP, "assets");

  const hasApp = isDir(appAssets);
  const hasCp  = isDir(cpAssets);

  if (!hasApp && !hasCp) {
    // Already packaged or build layout differs.
    if (isDir(OUT)) {
      console.log("OK: dist/assets already exists; no app/cp assets dirs found. Skipping move.");
      return;
    }
    throw new Error("ERR: No dist/app/assets or dist/cp/assets found, and dist/assets missing.");
  }

  mkdirp(OUT);

  // Move files from app then cp; collision handling:
  // If same rel path exists and byte-identical => ok. If differs => keep both with suffix.
  const sources = [];
  if (hasApp) sources.push({ name: "app", dir: appAssets });
  if (hasCp)  sources.push({ name: "cp",  dir: cpAssets });

  for (const src of sources) {
    for (const f of listFilesFlat(src.dir)) {
      const rel = relFrom(src.dir, f);
      const dst = path.join(OUT, rel);
      mkdirp(path.dirname(dst));

      if (!exists(dst)) {
        fs.renameSync(f, dst);
        continue;
      }

      // collision: compare sizes + content hash (cheap: full buffer compare)
      const a = fs.readFileSync(dst);
      const b = fs.readFileSync(f);
      if (a.length === b.length && Buffer.compare(a, b) === 0) {
        // identical; drop duplicate
        fs.rmSync(f, { force: true });
        continue;
      }

      // different content same name: keep both (suffix by surface)
      const ext = path.extname(dst);
      const base = dst.slice(0, -ext.length);
      const alt = `${base}.${src.name}${ext}`;
      fs.renameSync(f, alt);
    }
  }

  // Cleanup empty dirs
  for (const src of sources) {
    try { fs.rmSync(src.dir, { recursive: true, force: true }); } catch {}
  }

  // Create stubs so any old assumptions don't crash tooling
  safeLinkStub(path.join(APP, "assets"), "../assets");
  safeLinkStub(path.join(CP, "assets"), "../assets");

  console.log("OK: assets consolidated to dist/assets and stubs created.");
}

function rewriteIndexHtml() {
  const files = [
    path.join(APP, "index.html"),
    path.join(CP, "index.html"),
  ];

  for (const f of files) {
    let s = read(f);

    // Replace /app/assets/... and /cp/assets/... and relative assets refs to /assets/...
    // Covers: "assets/xxx", "./assets/xxx", "/app/assets/xxx", "/cp/assets/xxx"
    s = s.replaceAll('"/app/assets/', '"/assets/');
    s = s.replaceAll("'/app/assets/", "'/assets/");
    s = s.replaceAll('"/cp/assets/', '"/assets/');
    s = s.replaceAll("'/cp/assets/", "'/assets/");

    s = s.replaceAll('="assets/', '="/assets/');
    s = s.replaceAll("='assets/", "='/assets/");
    s = s.replaceAll('="./assets/', '="/assets/');
    s = s.replaceAll("='./assets/", "'/assets/");

    // Also handle href/src attributes that might include assets/ without leading '=' replacement
    s = s.replaceAll("assets/", "/assets/");

    write(f, s);
  }

  console.log("OK: index.html rewritten to reference /assets/.");
}

function main() {
  ensureInputs();
  if (MODE === "single") {
    console.log("OK: single dist layout detected; skipping shared-assets merge.");
    return;
  }
  moveAssets();
  rewriteIndexHtml();

  if (!isDir(OUT)) throw new Error("ERR: dist/assets still missing after packaging.");
}

main();
