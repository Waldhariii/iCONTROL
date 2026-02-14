import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { createHash, sign as signData, verify as verifySig } from "crypto";

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, stableStringify(data) + "\n", "utf-8");
}

export function writeText(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, data, "utf-8");
}

export function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) {
      out[k] = sortKeysDeep(value[k]);
    }
    return out;
  }
  return value;
}

export function signPayload(payload, privateKeyPem) {
  const data = Buffer.from(payload, "utf-8");
  const sig = signData(null, data, privateKeyPem);
  return sig.toString("base64");
}

export function verifyPayload(payload, signature, publicKeyPem) {
  const data = Buffer.from(payload, "utf-8");
  return verifySig(null, data, publicKeyPem, Buffer.from(signature, "base64"));
}

export function readKey(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing key at ${path}`);
  }
  return readFileSync(path, "utf-8");
}
