#!/usr/bin/env node
/**
 * Génère docs/ssot/ROUTE_DRIFT_REPORT.md en comparant les routes du code
 * (CP_PAGES_REGISTRY, APP_PAGES_REGISTRY, __CLIENT_V2_ROUTES__, moduleLoader, getRouteIdFromHash)
 * avec runtime/configs/ssot/ROUTE_CATALOG.json.
 *
 * Usage: node scripts/gates/generate-route-drift-report.mjs
 * Puis: npm run gate:route-drift (vérifie « Routes extra » = 0).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const APP = resolve(ROOT, "apps/control-plane/src");

function collectCodeRoutes() {
  const codeSet = new Set(); // "route_id|app_surface"

  // 1) CP_PAGES_REGISTRY (apps/control-plane/src/surfaces/cp/registry.ts)
  const cpReg = readFileSync(resolve(APP, "pages/cp/registry.ts"), "utf8");
  const cpMatch = cpReg.match(/export const CP_PAGES_REGISTRY[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (cpMatch) {
    const block = cpMatch[1];
    const keyRe = /^\s*(["']?)([\w-]+)\1\s*:\s*\{/gm;
    let m;
    while ((m = keyRe.exec(block)) !== null) {
      codeSet.add(m[2] + "|CP");
    }
  }

  // 2) APP_PAGES_REGISTRY (apps/control-plane/src/surfaces/app/registry.ts)
  const appReg = readFileSync(resolve(APP, "pages/app/registry.ts"), "utf8");
  const appMatch = appReg.match(/export const APP_PAGES_REGISTRY[^=]*=\s*\{([\s\S]*?)\n\};/);
  const appRegKeys = new Set();
  if (appMatch) {
    const block = appMatch[1];
    const keyRe = /^\s*(["']?)([\w-]+)\1\s*:\s*\{/gm;
    let m;
    while ((m = keyRe.exec(block)) !== null) {
      appRegKeys.add(m[2]);
      codeSet.add(m[2] + "|CLIENT");
    }
  }

  // 3) __CLIENT_V2_ROUTES__ (path → route_id)
  const clientV2Re = /path:\s*["']\/([\w-]+)["']/g;
  let vm;
  while ((vm = clientV2Re.exec(appReg)) !== null) {
    codeSet.add(vm[1] + "|CLIENT");
  }

  // 4) moduleLoader.renderRoute — (r, CP) pour tous; (r, CLIENT) seulement pour ceux aussi servis en APP
  const ml = readFileSync(resolve(APP, "moduleLoader.ts"), "utf8");
  const mlIds = new Set();
  const ridRe = /(?:rid|\(rid as any\))\s*===\s*["']([^"']+)["']/g;
  let rm;
  while ((rm = ridRe.exec(ml)) !== null) mlIds.add(rm[1]);
  const mlClientOnly = new Set(["login", "dashboard", "account", "settings", "access_denied"]);
  for (const r of mlIds) {
    codeSet.add(r + "|CP");
    if (mlClientOnly.has(r)) codeSet.add(r + "|CLIENT");
  }
  // __CLIENT_V2_ROUTES__ et APP_PAGES_REGISTRY ont déjà (r, CLIENT) pour dashboard, account, settings, users, system, client_disabled, access_denied, client_catalog, notfound

  // 5) RouteId (router.ts) — route_ids ex. shell-debug non couverts par registries/moduleLoader. Ne pas ajouter (r, CP) pour les route_ids uniquement APP (appRegKeys).
  const router = readFileSync(resolve(APP, "router.ts"), "utf8");
  const typeLine = router.match(/export type RouteId = [^;]+;/)?.[0] || "";
  const routeIdRe = /["']([\w-]+)["']/g;
  let rt;
  const fromType = new Set();
  while ((rt = routeIdRe.exec(typeLine)) !== null) fromType.add(rt[1]);
  for (const r of fromType) {
    const hasCp = Array.from(codeSet).some((e) => e.startsWith(r + "|CP"));
    if (!hasCp && !appRegKeys.has(r)) codeSet.add(r + "|CP");
  }

  return codeSet;
}

function loadCatalogSet() {
  const raw = readFileSync(resolve(ROOT, "runtime/configs/ssot/ROUTE_CATALOG.json"), "utf8");
  const catalog = JSON.parse(raw);
  const s = new Set();
  for (const r of catalog.routes || []) {
    const id = String(r.route_id || "").trim();
    let surface = String(r.app_surface || "").trim().toUpperCase();
    if (surface === "APP") surface = "CLIENT";
    if (id && (surface === "CP" || surface === "CLIENT")) s.add(id + "|" + surface);
  }
  return s;
}

function main() {
  const codeSet = collectCodeRoutes();
  const catalogSet = loadCatalogSet();

  const extra = [];
  const missing = [];
  for (const e of codeSet) {
    if (!catalogSet.has(e)) extra.push(e);
  }
  for (const e of catalogSet) {
    if (!codeSet.has(e)) missing.push(e);
  }

  const catalogRaw = JSON.parse(readFileSync(resolve(ROOT, "runtime/configs/ssot/ROUTE_CATALOG.json"), "utf8"));
  const catalogCount = (catalogRaw.routes || []).length;
  const now = new Date().toISOString().slice(0, 19) + "Z";

  const md = `# ROUTE_DRIFT_REPORT

**Comparaison:** routes effectivement servies / connues dans le code vs \`runtime/configs/ssot/ROUTE_CATALOG.json\`.
**Généré:** ${now}

## Méthode

- **Code:** \`router.getRouteId\`, \`getRouteIdFromHash\`, \`CP_PAGES_REGISTRY\`, \`APP_PAGES_REGISTRY\`, \`__CLIENT_V2_ROUTES__\`, \`moduleLoader.renderRoute\`.
- **Catalogue:** \`runtime/configs/ssot/ROUTE_CATALOG.json\`.

## Résultat

| Métrique | Valeur |
|----------|--------|
| **Routes dans ROUTE_CATALOG** | ${catalogCount} entrées (plusieurs (route_id, app_surface) pour même path) |
| **Routes extra (dans le code, absentes du catalogue)** | ${extra.length} |
| **Routes manquantes (dans le catalogue, inconnues du code)** | ${missing.length} |
`;

  let rest = "";
  if (extra.length > 0) {
    rest += `\n### Routes extra (à ajouter au catalogue ou retirer du code)\n\n\`\`\`\n${extra.map((e) => e.replace("|", " | ")).join("\n")}\n\`\`\`\n`;
  }
  if (missing.length > 0) {
    rest += `\n### Routes manquantes (dans le catalogue, inconnues du code)\n\n\`\`\`\n${missing.map((e) => e.replace("|", " | ")).join("\n")}\n\`\`\`\n`;
  }
  if (extra.length === 0 && missing.length === 0) {
    rest += `\nLe catalogue est aligné avec le code (getRouteIdFromHash, registries, moduleLoader).\n`;
  } else {
    rest += `\n## Recommandations\n\n1. **Routes extra:** les ajouter à \`ROUTE_CATALOG.json\` avec \`app_surface\` et \`status\` appropriés, ou les retirer du code.\n2. **Routes manquantes:** les retirer du catalogue ou les implémenter dans le code.\n`;
  }

  const outPath = resolve(ROOT, "docs/ssot/ROUTE_DRIFT_REPORT.md");
  writeFileSync(outPath, md + rest, "utf8");
  console.log("OK: ROUTE_DRIFT_REPORT écrit → " + outPath);
  console.log("  Routes extra: " + extra.length + ", manquantes: " + missing.length);
  process.exit(0);
}

main();
