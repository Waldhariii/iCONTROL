/**
 * gate:module-catalog
 * Validates runtime/configs/ssot/MODULE_CATALOG.json:
 * - JSON parseable
 * - schema == MODULE_CATALOG_V1
 * - modules[] non-empty
 * - each module has id (string), manifest (string)
 * - capabilities/surfaces/routes are arrays of strings (sorted, dedup)
 * - ids unique
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const P = path.join(ROOT, "runtime", "configs", "ssot", "MODULE_CATALOG.json");

function fail(code, msg) {
  console.error(code + ": " + msg);
  process.exit(1);
}

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (String(arr[i - 1]).localeCompare(String(arr[i])) > 0) return false;
  }
  return true;
}

if (!fs.existsSync(P)) fail("ERR_MODULE_CATALOG_MISSING", "Missing " + path.relative(ROOT, P));

let obj;
try {
  obj = JSON.parse(fs.readFileSync(P, "utf8"));
} catch (e) {
  fail("ERR_MODULE_CATALOG_INVALID_JSON", e?.message || String(e));
}

if (obj?.schema !== "MODULE_CATALOG_V1") fail("ERR_MODULE_CATALOG_SCHEMA", "schema must be MODULE_CATALOG_V1");

const modules = obj?.modules;
if (!Array.isArray(modules) || modules.length === 0) fail("ERR_MODULE_CATALOG_EMPTY", "modules[] must be a non-empty array");

const seen = new Set();
for (let i = 0; i < modules.length; i++) {
  const m = modules[i];
  if (!m || typeof m !== "object") fail("ERR_MODULE_CATALOG_ENTRY", "modules[" + i + "] must be object");
  if (typeof m.id !== "string" || !m.id.trim()) fail("ERR_MODULE_CATALOG_ID", "modules[" + i + "].id must be non-empty string");
  if (typeof m.manifest !== "string" || !m.manifest.trim()) fail("ERR_MODULE_CATALOG_MANIFEST", "modules[" + i + "].manifest must be non-empty string");
  if (seen.has(m.id)) fail("ERR_MODULE_CATALOG_DUP_ID", "Duplicate module id: " + m.id);
  seen.add(m.id);

  for (const k of ["capabilities", "surfaces", "routes"]) {
    const v = m[k];
    if (!Array.isArray(v)) fail("ERR_MODULE_CATALOG_FIELD", "modules[" + i + "]." + k + " must be array");
    for (let j = 0; j < v.length; j++) {
      if (typeof v[j] !== "string" || !v[j].trim()) fail("ERR_MODULE_CATALOG_FIELD_ITEM", "modules[" + i + "]." + k + "[" + j + "] invalid");
    }
    const dedup = [...new Set(v)];
    if (dedup.length !== v.length) fail("ERR_MODULE_CATALOG_NOT_DEDUPED", m.id + " " + k + " must be deduped");
    if (!isSorted(v)) fail("ERR_MODULE_CATALOG_NOT_SORTED", m.id + " " + k + " must be sorted");
  }
}

console.log("OK: gate:module-catalog (modules=" + modules.length + ")");
