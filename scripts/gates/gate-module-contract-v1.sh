#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "[gate] module contract v1"

# 1) Each module must have manifest/module.json (skip internal templates)
missing=0
while IFS= read -r -d '' dir; do
  base="$(basename "$dir")"
  if [[ "$base" == "_module-template" || "$base" == "_manifests" ]]; then
    continue
  fi
  if [[ ! -f "$dir/manifest/module.json" ]]; then
    echo "ERR_MODULE_MANIFEST_MISSING: $dir/manifest/module.json"
    missing=1
  fi
done < <(find modules -mindepth 1 -maxdepth 1 -type d -print0)

if [[ "$missing" == "1" ]]; then
  exit 1
fi
echo "[gate][OK] manifests present"

# 2) Validate minimal shape via node (strict json parse + required keys)
node - <<'NODE'
const fs = require("fs");
const path = require("path");

const schemaPath = "modules/_manifests/schema/module.manifest.schema.json";
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function has(obj, k){ return Object.prototype.hasOwnProperty.call(obj,k); }
function fail(msg){ console.error(msg); process.exitCode = 1; }

const mods = fs.readdirSync("modules", { withFileTypes: true })
  .filter(d=>d.isDirectory())
  .map(d=>d.name)
  .filter(n=>!["_module-template","_manifests"].includes(n));

for (const m of mods) {
  const p = path.join("modules", m, "manifest", "module.json");
  const j = JSON.parse(fs.readFileSync(p,"utf8"));

  // required keys (fast)
  for (const k of schema.required) {
    if (!has(j,k)) fail(`ERR_MODULE_MANIFEST_SCHEMA: missing '${k}' in ${p}`);
  }
  if (j.schema_version !== "MODULE_MANIFEST_SCHEMA_V1") fail(`ERR_MODULE_MANIFEST_SCHEMA: bad schema_version in ${p}`);
  if (typeof j.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(j.id)) fail(`ERR_MODULE_MANIFEST_SCHEMA: bad id in ${p}`);
  if (!["app","cp","both"].includes(j.surface)) fail(`ERR_MODULE_MANIFEST_SCHEMA: bad surface in ${p}`);
}
if (process.exitCode) process.exit(process.exitCode);
console.log("[gate][OK] manifest schema v1 (minimal) validated");
NODE

# 3) Hard boundary: modules must not import app/src or server/src
# (enforce in code, not only contracts)
if rg -n --glob 'modules/**' '(from\s+["'\'' ]\.{0,2}/?\.{0,2}/?app/src/|from\s+["'\'' ]@/app/|from\s+["'\'' ]app/src/|from\s+["'\'' ]\.{0,2}/?\.{0,2}/?server/src/|from\s+["'\'' ]server/src/)' >/dev/null 2>&1; then
  echo "ERR_MODULE_IMPORTS_APP_OR_SERVER: modules import app/server directly"
  rg -n --glob 'modules/**' '(from\s+["'\'' ]\.{0,2}/?\.{0,2}/?app/src/|from\s+["'\'' ]@/app/|from\s+["'\'' ]app/src/|from\s+["'\'' ]\.{0,2}/?\.{0,2}/?server/src/|from\s+["'\'' ]server/src/)' || true
  exit 1
fi
echo "[gate][OK] no direct app/server imports in modules"

# 4) Hard boundary: forbid module -> module imports
# (allow self-imports; forbid importing another module root)
if rg -n --glob 'modules/**' 'from\s+["'\'' ]modules/[^"'\'' /]+/' >/dev/null 2>&1; then
  echo "ERR_MODULE_TO_MODULE_IMPORT: modules must not import other modules (use contracts/services)"
  rg -n --glob 'modules/**' 'from\s+["'\'' ]modules/[^"'\'' /]+/' || true
  exit 1
fi
echo "[gate][OK] no module->module imports"

echo "[gate][PASS] module contract v1"
