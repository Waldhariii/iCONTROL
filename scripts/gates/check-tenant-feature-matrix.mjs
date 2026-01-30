#!/usr/bin/env node
/**
 * Gate — TENANT_FEATURE_MATRIX (config/ssot)
 * Vérifie: existe, JSON valide, templates{} non vide, chaque plan a enabled_pages[] et enabled_capabilities[].
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "config/ssot/TENANT_FEATURE_MATRIX.json");

let raw;
try {
  raw = readFileSync(PATH, "utf8");
} catch (e) {
  if (e.code === "ENOENT") {
    console.error("[FAIL] TENANT_FEATURE_MATRIX.json manquant: " + PATH);
    process.exit(1);
  }
  throw e;
}

let obj;
try {
  obj = JSON.parse(raw);
} catch (e) {
  console.error("[FAIL] TENANT_FEATURE_MATRIX.json JSON invalide:", e.message);
  process.exit(1);
}

if (!obj || typeof obj !== "object") {
  console.error("[FAIL] TENANT_FEATURE_MATRIX.json: racine doit être un objet.");
  process.exit(1);
}

const templates = obj.templates;
if (!templates || typeof templates !== "object" || Array.isArray(templates)) {
  console.error("[FAIL] TENANT_FEATURE_MATRIX.json: 'templates' doit être un objet non vide.");
  process.exit(1);
}

const keys = Object.keys(templates);
if (keys.length === 0) {
  console.error("[FAIL] TENANT_FEATURE_MATRIX.json: 'templates' ne doit pas être vide.");
  process.exit(1);
}

for (const plan of keys) {
  const t = templates[plan];
  if (!t || typeof t !== "object") {
    console.error("[FAIL] TENANT_FEATURE_MATRIX.json: templates." + plan + " invalide.");
    process.exit(1);
  }
  if (!Array.isArray(t.enabled_pages)) {
    console.error("[FAIL] TENANT_FEATURE_MATRIX.json: templates." + plan + ".enabled_pages doit être un tableau.");
    process.exit(1);
  }
  if (!Array.isArray(t.enabled_capabilities)) {
    console.error("[FAIL] TENANT_FEATURE_MATRIX.json: templates." + plan + ".enabled_capabilities doit être un tableau.");
    process.exit(1);
  }
}

console.log("OK: TENANT_FEATURE_MATRIX.json valide (" + keys.length + " plans).");
process.exit(0);
