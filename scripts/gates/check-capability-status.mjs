#!/usr/bin/env node
/**
 * Gate — CAPABILITY_STATUS (runtime/configs/ssot)
 * Vérifie: existe, JSON valide, capabilities[] non vide, chaque entrée a id (string).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "runtime/configs/ssot/CAPABILITY_STATUS.json");

let raw;
try {
  raw = readFileSync(PATH, "utf8");
} catch (e) {
  if (e.code === "ENOENT") {
    console.error("[FAIL] CAPABILITY_STATUS.json manquant: " + PATH);
    process.exit(1);
  }
  throw e;
}

let obj;
try {
  obj = JSON.parse(raw);
} catch (e) {
  console.error("[FAIL] CAPABILITY_STATUS.json JSON invalide:", e.message);
  process.exit(1);
}

if (!obj || typeof obj !== "object") {
  console.error("[FAIL] CAPABILITY_STATUS.json: racine doit être un objet.");
  process.exit(1);
}

const capabilities = obj.capabilities;
if (!Array.isArray(capabilities)) {
  console.error("[FAIL] CAPABILITY_STATUS.json: 'capabilities' doit être un tableau.");
  process.exit(1);
}

if (capabilities.length === 0) {
  console.error("[FAIL] CAPABILITY_STATUS.json: 'capabilities' ne doit pas être vide.");
  process.exit(1);
}

for (let i = 0; i < capabilities.length; i++) {
  const c = capabilities[i];
  if (!c || typeof c !== "object") {
    console.error("[FAIL] CAPABILITY_STATUS.json: capabilities[" + i + "] invalide.");
    process.exit(1);
  }
  if (typeof c.id !== "string" || !c.id) {
    console.error("[FAIL] CAPABILITY_STATUS.json: capabilities[" + i + "] doit avoir id (string non vide).");
    process.exit(1);
  }
}

console.log("OK: CAPABILITY_STATUS.json valide (" + capabilities.length + " capabilities).");
process.exit(0);
