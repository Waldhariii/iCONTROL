#!/usr/bin/env node
import fs from "fs";
import path from "path";
import vm from "vm";

const root = path.resolve(process.cwd());
const catalogPath = path.join(root, "config", "ssot", "ROUTE_CATALOG.json");
const routerPath = path.join(root, "app", "src", "router.ts");

function loadCatalog() {
  const raw = fs.readFileSync(catalogPath, "utf-8");
  const json = JSON.parse(raw);
  const routes = Array.isArray(json.routes) ? json.routes : [];
  return routes;
}

function loadClientRouteMap() {
  const src = fs.readFileSync(routerPath, "utf-8");
  const match = src.match(/CLIENT_V2_ROUTE_ID_TO_HASH[^]*?=\s*({[^]*?});/);
  if (!match) return {};
  const objectLiteral = match[1];
  const sandbox = {};
  const map = vm.runInNewContext(`(${objectLiteral})`, sandbox, { timeout: 1000 });
  return map || {};
}

function validate() {
  const routes = loadCatalog();
  const clientMap = loadClientRouteMap();

  const errors = [];
  const seenIds = new Set();
  const seenPaths = new Set();

  for (const r of routes) {
    if (!r || typeof r !== "object") continue;
    const id = String(r.route_id || "");
    const pathValue = String(r.path || "");
    const surface = String(r.app_surface || "");
    if (!id) errors.push(`route_id manquant`);
    if (seenIds.has(id)) errors.push(`route_id dupliqué: ${id}`);
    seenIds.add(id);
    if (pathValue) {
      const scopedPath = `${surface}:${pathValue}`;
      if (seenPaths.has(scopedPath)) errors.push(`path dupliqué (surface): ${surface} ${pathValue}`);
      seenPaths.add(scopedPath);
    }

    if (pathValue && !pathValue.startsWith("#/")) {
      errors.push(`path invalide (doit commencer par #/): ${id} -> ${pathValue}`);
    }
    if (surface !== "CP" && surface !== "CLIENT") {
      errors.push(`app_surface invalide: ${id} -> ${surface}`);
    }
    if (surface === "CLIENT") {
      const expected = clientMap[id];
      if (!expected) {
        errors.push(`CLIENT route_id absent du router.ts: ${id}`);
      } else if (expected !== pathValue) {
        errors.push(`CLIENT path mismatch: ${id} catalog=${pathValue} router=${expected}`);
      }
    }
  }

  return errors;
}

const errors = validate();
if (errors.length) {
  console.error("[route-catalog] FAIL");
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}
console.log("[route-catalog] OK");
