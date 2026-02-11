#!/usr/bin/env node
/**
 * Gate — ADMIN_COMPONENTS_REGISTRY
 * Vérifie: runtime/configs/ssot/ADMIN_COMPONENTS_REGISTRY.ts existe, export AdminComponentEntry,
 * export const ADMIN_COMPONENTS_REGISTRY = [ (structure TS).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "runtime/configs/ssot/ADMIN_COMPONENTS_REGISTRY.ts");

if (!existsSync(PATH)) {
  console.error("[FAIL] ADMIN_COMPONENTS_REGISTRY.ts manquant: " + PATH);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(PATH, "utf8");
} catch (e) {
  console.error("[FAIL] Impossible de lire " + PATH + ":", e.message);
  process.exit(1);
}

if (!raw.includes("AdminComponentEntry")) {
  console.error("[FAIL] ADMIN_COMPONENTS_REGISTRY.ts doit exporter ou définir AdminComponentEntry.");
  process.exit(1);
}

if (!raw.includes("ADMIN_COMPONENTS_REGISTRY")) {
  console.error("[FAIL] ADMIN_COMPONENTS_REGISTRY.ts doit exporter ADMIN_COMPONENTS_REGISTRY.");
  process.exit(1);
}

if (!/ADMIN_COMPONENTS_REGISTRY\s*:\s*AdminComponentEntry\[\]\s*=\s*\[/.test(raw) &&
    !/export const ADMIN_COMPONENTS_REGISTRY\s*=\s*\[/.test(raw)) {
  console.error("[FAIL] ADMIN_COMPONENTS_REGISTRY.ts doit définir ADMIN_COMPONENTS_REGISTRY comme tableau AdminComponentEntry[].");
  process.exit(1);
}

console.log("OK: ADMIN_COMPONENTS_REGISTRY.ts valide.");
process.exit(0);
