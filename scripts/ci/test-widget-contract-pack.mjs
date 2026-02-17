import fs from "node:fs";
import path from "node:path";
import { widgetContractGate } from "../../governance/gates/gates.mjs";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".widget.json")) out.push(p);
  }
  return out;
}

const ROOT = process.cwd();
const extsPath = path.join(ROOT, "extensions");
const files = walk(extsPath);
const seen = new Set();
for (const p of files) {
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!j.widget_id) throw new Error("missing widget_id in " + p);
  if (seen.has(j.widget_id)) throw new Error("duplicate widget_id " + j.widget_id);
  seen.add(j.widget_id);
}

const result = widgetContractGate({ rootDir: ROOT });
if (!result.ok) {
  console.error("FAIL widget contract gate:", result.details);
  process.exit(1);
}
console.log("PASS widget contract pack + gate", { widgetContracts: files.length, unique: seen.size });
