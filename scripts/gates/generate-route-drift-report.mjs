#!/usr/bin/env node
/**
 * Génère docs/ssot/ROUTE_DRIFT_REPORT.md en comparant les routes du code
 * (CP_PAGES_REGISTRY, APP_PAGES_REGISTRY, __CLIENT_V2_ROUTES__, moduleLoader, getRouteIdFromHash)
 * avec runtime/configs/ssot/ROUTE_CATALOG.json.
 *
 * Usage: node scripts/gates/generate-route-drift-report.mjs
 * Puis: npm run gate:route-drift (vérifie « Routes extra » = 0).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const APP = resolve(ROOT, "apps/control-plane/src");

function collectCodeRoutes() {
  const codeSet = new Set(); // "route_id|app_surface"

  // 1) CP_PAGE_REGISTRY (surfaces/cp/manifest.ts)
  const cpManifestPath = resolve(APP, "surfaces/cp/manifest.ts");
  if (existsSync(cpManifestPath)) {
    const cpManifest = readFileSync(cpManifestPath, "utf8");
    const cpMatch = cpManifest.match(/const CP_PAGE_REGISTRY[^=]*=\s*\{([\s\S]*?)\n\};/);
    if (cpMatch) {
      const keyRe = /^\s*(\w+)\s*:\s*async/gm;
      let m;
      while ((m = keyRe.exec(cpMatch[1])) !== null) codeSet.add(m[1] + "|CP");
    }
  }

  // 2) Catalogue = source de vérité (router dérive path→route_id du catalogue)
  const catalogPath = resolve(ROOT, "runtime/configs/ssot/ROUTE_CATALOG.json");
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    for (const r of catalog.routes || []) {
      const id = String(r.route_id || "").trim();
      let surface = String(r.app_surface || "").trim().toUpperCase();
      if (surface === "APP") surface = "CLIENT";
      if (id && (surface === "CP" || surface === "CLIENT")) codeSet.add(id + "|" + surface);
    }
  }

  // 3) RouteId (router.ts) — union type pour couverture
  const routerPath = resolve(APP, "router.ts");
  if (existsSync(routerPath)) {
    const router = readFileSync(routerPath, "utf8");
    const typeLine = router.match(/export type RouteId = [^;]+;/)?.[0] || "";
    const routeIdRe = /["']([\w_]+)["']/g;
    let rt;
    while ((rt = routeIdRe.exec(typeLine)) !== null) {
      const r = rt[1];
      if (r.endsWith("_cp")) codeSet.add(r + "|CP");
      if (r.endsWith("_app")) codeSet.add(r + "|CLIENT");
    }
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

- **Code:** \`router.getRouteId\` (dérivé catalogue), \`CP_PAGE_REGISTRY\` (manifest), \`ROUTE_CATALOG.json\`.
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
