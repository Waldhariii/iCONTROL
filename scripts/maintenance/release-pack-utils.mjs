import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname, relative } from "path";
import { sha256, stableStringify, signPayload, verifyPayload, readKey } from "../../platform/compilers/utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";
import { getReportsDir, assertNoPlatformReportsPath, scanForSecrets } from "../ci/test-utils.mjs";

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function sha256File(path) {
  return sha256(readFileSync(path, "utf-8"));
}

export function listFiles(rootDir) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(rootDir);
  return out;
}

export function collectChecksums(rootDir, exclude = []) {
  const files = listFiles(rootDir).filter((p) => !exclude.some((x) => p.endsWith(x)));
  return files.map((p) => ({
    path: relative(rootDir, p),
    sha256: sha256File(p),
    size: statSync(p).size
  }));
}

export function verifyChecksums(rootDir, checksums) {
  for (const c of checksums || []) {
    const full = join(rootDir, c.path);
    if (!existsSync(full)) throw new Error(`Missing file: ${c.path}`);
    const data = readFileSync(full, "utf-8");
    const sum = sha256(data);
    if (sum !== c.sha256) throw new Error(`Checksum mismatch: ${c.path}`);
  }
}

export function signPackJson(packJsonPath, privateKeyPath, sigPath) {
  const payload = readFileSync(packJsonPath, "utf-8");
  const privateKey = readKey(privateKeyPath);
  const sig = signPayload(payload, privateKey);
  writeFileSync(sigPath, sig, "utf-8");
  return sig;
}

export function verifyPackJson(packJsonPath, publicKeyPath, sigPath) {
  const payload = readFileSync(packJsonPath, "utf-8");
  const sig = readFileSync(sigPath, "utf-8").trim();
  const publicKey = readKey(publicKeyPath);
  return verifyPayload(payload, sig, publicKey);
}

export function validatePackSchema(pack) {
  validateOrThrow("release_pack.v1", pack, "release_pack");
}

export function writeReport(name, content) {
  const reportsDir = getReportsDir();
  assertNoPlatformReportsPath(reportsDir);
  ensureDir(reportsDir);
  const path = join(reportsDir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

export function appendJsonl(path, entry) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(entry) + "\n", { flag: "a" });
}

export function scanPackForSecrets(paths) {
  const hits = scanForSecrets({ paths });
  if (hits.length) {
    const msg = hits.map((h) => `${h.file}: ${h.snippet}`).join("\n");
    throw new Error(`Secrets detected:\n${msg}`);
  }
}

export function resolveReportsDir() {
  const dir = getReportsDir();
  assertNoPlatformReportsPath(dir);
  ensureDir(dir);
  return dir;
}

export function ensurePacksDir() {
  const reportsDir = resolveReportsDir();
  const packsDir = join(reportsDir, "packs");
  ensureDir(packsDir);
  return packsDir;
}

export function pickLatestPackDir() {
  const packsDir = ensurePacksDir();
  const entries = readdirSync(packsDir)
    .map((d) => join(packsDir, d))
    .filter((p) => existsSync(p) && statSync(p).isDirectory())
    .map((p) => ({ p, t: statSync(p).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return entries[0]?.p || "";
}
