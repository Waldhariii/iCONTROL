import fs from "node:fs";

const file = "runtime/configs/ssot/ROUTE_CATALOG.json";
if (!fs.existsSync(file)) {
  console.error("ERR_ROUTE_CATALOG_MISSING:", file);
  process.exit(1);
}

let obj;
try {
  obj = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error("ERR_ROUTE_CATALOG_INVALID_JSON:", String(e?.message || e));
  process.exit(1);
}

function isStr(x) { return typeof x === "string" && x.length > 0; }
function isArr(x) { return Array.isArray(x); }

if (obj?.schema === "ROUTE_CATALOG_V1") {
  for (const k of ["app", "cp"]) {
    const node = obj[k];
    if (!node || !isStr(node.base) || !isArr(node.routes) || node.routes.length === 0) {
      console.error("ERR_ROUTE_CATALOG_SHAPE:", k);
      process.exit(1);
    }
    for (const r of node.routes) {
      if (!isStr(r)) {
        console.error("ERR_ROUTE_CATALOG_ROUTE_INVALID:", k, r);
        process.exit(1);
      }
    }
  }
  console.log("OK: gate:route-catalog");
  process.exit(0);
}

// Backward-compatible support for the existing catalog shape:
// { version, routes: [{ path, app_surface, ... }] }
if (isStr(obj?.version) && isArr(obj?.routes)) {
  const cp = obj.routes
    .filter((r) => isStr(r?.app_surface) && r.app_surface.toUpperCase() === "CP")
    .map((r) => r?.path)
    .filter(isStr);
  const app = obj.routes
    .filter((r) => isStr(r?.app_surface) && r.app_surface.toUpperCase() === "APP")
    .map((r) => r?.path)
    .filter(isStr);
  if (cp.length === 0 || app.length === 0) {
    console.error("ERR_ROUTE_CATALOG_LEGACY_SURFACES_EMPTY");
    process.exit(1);
  }
  console.log("OK: gate:route-catalog");
  process.exit(0);
}

console.error("ERR_ROUTE_CATALOG_SCHEMA:", obj?.schema ?? "undefined");
process.exit(1);
