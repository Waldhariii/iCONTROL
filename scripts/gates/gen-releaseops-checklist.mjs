#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }
function readJson(p){ return JSON.parse(fs.readFileSync(p, "utf8")); }
function repoRoot(){
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
}

const root = repoRoot();
const audit = path.join(root, "_audit");
if(!exists(audit)) fs.mkdirSync(audit, { recursive: true });

const catPath = path.join(root, "config/ssot/MODULE_CATALOG.json");
const cat = readJson(catPath);

const ts = new Date().toISOString().replace(/[-:]/g,"").replace(/\..+$/,"Z");
const outPath = path.join(audit, `PHASE9_RELEASEOPS_CHECKLIST_${ts}.md`);

const modules = Array.isArray(cat.modules) ? cat.modules : [];
const cpSurfaces = modules.flatMap(m => Array.isArray(m.surfaces)?m.surfaces:[]).filter(s => String(s).startsWith("cp."));
const routes = modules.flatMap(m => Array.isArray(m.routes)?m.routes:[]);

const md = [
  `# ReleaseOps Checklist (Phase9)`,
  ``,
  `Generated: ${new Date().toISOString()}`,
  ``,
  `## Preflight`,
  `- npm run -s verify:prod:fast`,
  `- npm test`,
  `- npm run -s gate:tag-integrity`,
  `- npm run -s gate:preflight:prod`,
  `- npm run -s gate:releaseops-invariants`,
  `- npm run -s gate:ssot-surface-route-map`,
  ``,
  `## Catalog Snapshot`,
  `- cp surfaces: ${cpSurfaces.length}`,
  `- routes: ${routes.length}`,
  ``,
  `### CP Surfaces`,
  ...cpSurfaces.map(s => `- ${s}`),
  ``,
  `### Routes`,
  ...routes.map(r => `- ${r}`),
  ``,
  `## Release-train`,
  `- git push origin main`,
  `- bash ./scripts/release/tag-set-atomic.sh`,
  `- git push origin rc-20260201_154033-r3 prod-candidate-20260201_154033-r3 baseline-20260201_154033-r3 --force`,
  ``,
  `## Post-align`,
  `- npm run -s gate:tag-integrity`,
].join("\n");

fs.writeFileSync(outPath, md + "\n", "utf8");
console.log("OK: wrote " + outPath);
