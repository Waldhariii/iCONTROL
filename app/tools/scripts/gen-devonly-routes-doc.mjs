/**
 * DEV_ONLY_ROUTES_DOC_V1
 * Zéro dépendance. Zsh-safe.
 * Stratégie:
 *  1) Runtime resolve (import ESM TS compilé via ts-node-like not available -> fallback)
 *  2) Fallback scan: extraire via export const DEV_ONLY_CP_ROUTES = <expr>; puis eval sandboxée si possible
 *  3) Dernier recours: détecter guardDevOnlyRoute usages (routeKey)
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "docs/DEV_ONLY_ROUTES.md");
const CHECK = process.argv.includes("--check");

function walk(dir){
  const out=[];
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function uniq(a){ return Array.from(new Set(a)).sort(); }

let routes = [];

// (A) Fallback 1: scanner les usages guardDevOnlyRoute({ routeKey })
for (const f of walk(SRC)) {
  const s = fs.readFileSync(f,"utf8");
  const re = /guardDevOnlyRoute\s*\(\s*\{[^}]*routeKey\s*:\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(s))) routes.push(m[1]);
}

// (B) Fallback 2: tenter d’extraire DEV_ONLY_CP_ROUTES même non-literal
const cand = path.join(SRC,"pages/cp/_shared/devOnlyRouteGuard.ts");
if (fs.existsSync(cand)) {
  const s = fs.readFileSync(cand,"utf8");
  const m = s.match(/export\s+const\s+DEV_ONLY_CP_ROUTES\s*=\s*([^;]+);/);
  if (m) {
    try {
      // sandbox minimal: n’autoriser que tableaux/strings
      const expr = m[1]
        .replace(/as\s+const/g,"")
        .replace(/readonly\s+/g,"");
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${expr});`)();
      if (Array.isArray(val)) routes.push(...val.map(String));
    } catch {}
  }
}

routes = uniq(routes);

const md =
`# DEV-only CP Routes

> Généré automatiquement — DEV_ONLY_ROUTES_DOC_V1

| Route |
|------:|
${routes.map(r=>`| \`${r}\` |`).join("\n")}

_Total: ${routes.length}_\n`;

if (CHECK) {
  if (!fs.existsSync(OUT)) {
    console.error("[devonly-doc][FAIL] doc manquant");
    process.exit(1);
  }
  const cur = fs.readFileSync(OUT,"utf8");
  if (cur !== md) {
    console.error("[devonly-doc][FAIL] drift détecté");
    process.exit(1);
  }
  console.log("[devonly-doc][OK] no drift");
} else {
  fs.writeFileSync(OUT, md);
  console.log("[devonly-doc][OK] écrit:", OUT);
}
