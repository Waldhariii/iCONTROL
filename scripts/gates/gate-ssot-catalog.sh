#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CAT="docs/ssot/catalog.json"
if [ ! -f "$CAT" ]; then
  echo "ERR_SSOT_CATALOG_MISSING: $CAT not found"
  exit 1
fi

node - <<'NODE'
const fs = require("fs");

const cat = JSON.parse(fs.readFileSync("docs/ssot/catalog.json", "utf8"));
const err = (code, msg) => { console.error(code + ": " + msg); process.exit(1); };

if (!cat.surfaces || !Array.isArray(cat.surfaces) || cat.surfaces.length === 0) err("ERR_SSOT_SURFACES", "missing surfaces[]");
if (!cat.routes || !Array.isArray(cat.routes) || cat.routes.length === 0) err("ERR_SSOT_ROUTES", "missing routes[]");

const seenRouteId = new Set();
for (const r of cat.routes) {
  if (!r.id || !r.surface || !r.path) err("ERR_SSOT_ROUTE_SHAPE", "route must have id/surface/path");
  if (seenRouteId.has(r.id)) err("ERR_SSOT_DUP_ROUTE_ID", r.id);
  seenRouteId.add(r.id);
}

const perSurfacePath = new Map();
for (const r of cat.routes) {
  if (!perSurfacePath.has(r.surface)) perSurfacePath.set(r.surface, new Set());
  const s = perSurfacePath.get(r.surface);
  if (s.has(r.path)) err("ERR_SSOT_DUP_PATH_PER_SURFACE", r.surface + ":" + r.path);
  s.add(r.path);
}

process.stdout.write("OK: gate-ssot-catalog\n");
NODE
