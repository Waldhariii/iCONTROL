import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const base = path.join(ROOT, "modules");

function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name === "module.json" && p.includes(`${path.sep}manifest${path.sep}`)) out.push(p);
  }
  return out;
}

const files = walk(base, []);
if (files.length === 0) {
  console.error("ERR_MODULE_MANIFESTS_NONE_FOUND");
  process.exit(1);
}

function isStr(x){ return typeof x === "string" && x.length > 0; }
function isArr(x){ return Array.isArray(x); }

let bad = 0;
for (const f of files) {
  let obj;
  try { obj = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { console.error("ERR_MODULE_MANIFEST_INVALID_JSON:", f, String(e?.message||e)); bad++; continue; }

  // Minimal required keys (schema-lite, compatible with existing schema file):
  const id = obj?.id;
  const name = obj?.name;
  const version = obj?.version;
  const capabilities = obj?.capabilities;

  if (!isStr(id) || !isStr(name) || !isStr(version) || !isArr(capabilities)) {
    console.error("ERR_MODULE_MANIFEST_SHAPE:", f);
    bad++; continue;
  }
  // Optional but recommended: surfaces/pages/routes arrays if present must be arrays
  for (const k of ["surfaces", "pages", "routes"]) {
    if (obj[k] != null && !isArr(obj[k])) {
      console.error("ERR_MODULE_MANIFEST_FIELD_NOT_ARRAY:", f, k);
      bad++;
    }
  }
}

if (bad > 0) {
  console.error("ERR_MODULE_MANIFESTS_INVALID_COUNT:", bad);
  process.exit(1);
}
console.log("OK: gate:module-manifests.v1 (count=" + files.length + ")");
