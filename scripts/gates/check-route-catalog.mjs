#!/usr/bin/env node
/**
 * Gate — Route catalog (route drift)
 * Vérifie: config/ssot/ROUTE_CATALOG.json existe, JSON valide, routes[] non vide,
 * chaque entrée a route_id et app_surface.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "config/ssot/ROUTE_CATALOG.json");

let raw;
try {
  raw = readFileSync(PATH, "utf8");
} catch (e) {
  if (e.code === "ENOENT") {
    console.error("[FAIL] ROUTE_CATALOG.json manquant: " + PATH);
    process.exit(1);
  }
  throw e;
}

let catalog;
try {
  catalog = JSON.parse(raw);
} catch (e) {
  console.error("[FAIL] ROUTE_CATALOG.json JSON invalide:", e.message);
  process.exit(1);
}

if (!catalog || typeof catalog !== "object") {
  console.error("[FAIL] ROUTE_CATALOG.json: racine doit être un objet.");
  process.exit(1);
}

const routes = catalog.routes;
if (!Array.isArray(routes)) {
  console.error("[FAIL] ROUTE_CATALOG.json: 'routes' doit être un tableau.");
  process.exit(1);
}

if (routes.length === 0) {
  console.error("[FAIL] ROUTE_CATALOG.json: 'routes' ne doit pas être vide.");
  process.exit(1);
}

for (let i = 0; i < routes.length; i++) {
  const r = routes[i];
  if (!r || typeof r !== "object") {
    console.error("[FAIL] ROUTE_CATALOG.json: routes[" + i + "] invalide.");
    process.exit(1);
  }
  if (typeof r.route_id !== "string" || !r.route_id) {
    console.error("[FAIL] ROUTE_CATALOG.json: routes[" + i + "] doit avoir route_id (string non vide).");
    process.exit(1);
  }
  if (typeof r.app_surface !== "string" || !r.app_surface) {
    console.error("[FAIL] ROUTE_CATALOG.json: routes[" + i + "] doit avoir app_surface (string non vide).");
    process.exit(1);
  }
}

console.log("OK: ROUTE_CATALOG.json valide (" + routes.length + " routes).");
process.exit(0);
