import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const catP = path.join(ROOT, "platform/ssot/access/scope_catalog.json");
const roleP = path.join(ROOT, "platform/ssot/access/role_matrix.json");

function die(msg) {
  console.error("FAIL", msg);
  process.exit(1);
}

if (!fs.existsSync(catP)) die("missing " + catP);
if (!fs.existsSync(roleP)) die("missing " + roleP);

const cat = JSON.parse(fs.readFileSync(catP, "utf8"));
const roleMatrixRaw = JSON.parse(fs.readFileSync(roleP, "utf8"));
const rolesArray = Array.isArray(roleMatrixRaw) ? roleMatrixRaw : (roleMatrixRaw.roles || []);

const scopes = new Set(cat.scopes || []);
if (scopes.size < 20) die("scope catalog too small");

for (const r of rolesArray) {
  if (!r.role_id) die("role missing role_id");
  if (!Array.isArray(r.scopes)) die("role " + r.role_id + " scopes must be array");
  for (const s of r.scopes) {
    if (s === "*") continue;
    if (!scopes.has(s)) die("role " + r.role_id + " references unknown scope: " + s);
  }
}

console.log("PASS access scopes matrix", { roles: rolesArray.length, scopes: scopes.size });
