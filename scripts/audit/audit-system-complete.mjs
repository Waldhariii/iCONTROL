#!/usr/bin/env node
/**
 * Audit système complet - Analyse A à Z
 * Trouve: erreurs, problèmes, éléments manquants, routes inactives, doublons, séparation APP/CP
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const issues = {
  errors: [],
  warnings: [],
  missing: [],
  duplicates: [],
  inactiveRoutes: [],
  crossImports: [],
  consoleUsage: [],
  pathIssues: [],
};

// 1) Analyser ROUTE_CATALOG.json pour doublons et incohérences
function auditRouteCatalog() {
  const catalogPath = path.join(repoRoot, "runtime", "configs", "ssot", "ROUTE_CATALOG.json");
  if (!fs.existsSync(catalogPath)) {
    issues.errors.push("ROUTE_CATALOG.json manquant");
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const routes = catalog.routes || [];

  // Vérifier doublons de route_id
  const routeIds = new Map();
  routes.forEach((r) => {
    if (routeIds.has(r.route_id)) {
      issues.duplicates.push(`route_id dupliqué: ${r.route_id}`);
    }
    routeIds.set(r.route_id, r);
  });

  // Vérifier doublons de path (même path pour différentes surfaces)
  const paths = new Map();
  routes.forEach((r) => {
    if (!r.path) return;
    const key = `${r.path}:${r.app_surface}`;
    if (paths.has(key)) {
      issues.duplicates.push(`path dupliqué: ${r.path} (surface: ${r.app_surface})`);
    }
    paths.set(key, r);
  });

  // Vérifier que tous les route_id ont le bon suffixe
  routes.forEach((r) => {
    if (r.app_surface === "CP" && !r.route_id.endsWith("_cp")) {
      issues.errors.push(`Route CP sans suffixe _cp: ${r.route_id}`);
    }
    if (r.app_surface === "CLIENT" && !r.route_id.endsWith("_app")) {
      issues.errors.push(`Route APP sans suffixe _app: ${r.route_id}`);
    }
  });

  // Vérifier routes inactives (HIDDEN/DEPRECATED référencées)
  const inactive = routes.filter((r) => r.status === "HIDDEN" || r.status === "DEPRECATED");
  inactive.forEach((r) => {
    issues.inactiveRoutes.push(`${r.route_id} (${r.status})`);
  });
}

// 2) Analyser séparation APP/CP
function auditAppCpSeparation() {
  const appPagesDir = path.join(repoRoot, "app", "src", "pages", "app");
  const cpPagesDir = path.join(repoRoot, "app", "src", "pages", "cp");

  // Vérifier imports croisés
  if (fs.existsSync(appPagesDir)) {
    const appFiles = getAllFiles(appPagesDir, [".ts", ".tsx"]);
    appFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("pages/cp") || content.includes("from.*cp/")) {
        issues.crossImports.push(`APP importe CP: ${path.relative(repoRoot, file)}`);
      }
    });
  }

  if (fs.existsSync(cpPagesDir)) {
    const cpFiles = getAllFiles(cpPagesDir, [".ts", ".tsx"]);
    cpFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("pages/app") || content.includes("from.*app/")) {
        issues.crossImports.push(`CP importe APP: ${path.relative(repoRoot, file)}`);
      }
    });
  }
}

// 3) Analyser console.* usage (devrait utiliser logger structuré)
function auditConsoleUsage() {
  const serverDir = path.join(repoRoot, "server");
  const appSrcDir = path.join(repoRoot, "app", "src");

  [serverDir, appSrcDir].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    const files = getAllFiles(dir, [".ts", ".tsx", ".mjs", ".js"]);
    files.forEach((file) => {
      // Exclure les fichiers autorisés
      const basename = path.basename(file);
      if (basename === "runtime-config-server.js" || basename === "ssot-invariants.test.mjs") {
        return; // Wrapper legacy et test file autorisés
      }

      const content = fs.readFileSync(file, "utf8");
      const consoleMatches = content.matchAll(/\bconsole\.(log|warn|error|info|debug)\s*\(/g);
      for (const match of consoleMatches) {
        const lines = content.substring(0, match.index).split("\n");
        const lineNum = lines.length;
        // Ignorer les commentaires
        const line = lines[lines.length - 1];
        if (line.trim().startsWith("//")) continue;

        issues.consoleUsage.push({
          file: path.relative(repoRoot, file),
          line: lineNum,
          usage: match[0],
        });
      }
    });
  });
}

// 4) Analyser chemins de build
function auditBuildPaths() {
  const distApp = path.join(repoRoot, "dist", "app");
  const distCp = path.join(repoRoot, "dist", "cp");

  if (!fs.existsSync(distApp)) {
    issues.missing.push("dist/app/ n'existe pas (build:app requis)");
  } else {
    const indexHtml = path.join(distApp, "index.html");
    if (!fs.existsSync(indexHtml)) {
      issues.missing.push("dist/app/index.html manquant");
    }
  }

  if (!fs.existsSync(distCp)) {
    issues.missing.push("dist/cp/ n'existe pas (build:cp requis)");
  } else {
    const indexHtml = path.join(distCp, "index.html");
    if (!fs.existsSync(indexHtml)) {
      issues.missing.push("dist/cp/index.html manquant");
    }
  }

  // Vérifier cohérence des chemins dans package.json
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const buildApp = pkg.scripts?.["build:app"];
  const buildCp = pkg.scripts?.["build:cp"];

  if (buildApp && !buildApp.includes("--outDir ../dist/app")) {
    issues.pathIssues.push("build:app n'utilise pas --outDir ../dist/app");
  }
  if (buildCp && !buildCp.includes("--outDir ../dist/cp")) {
    issues.pathIssues.push("build:cp n'utilise pas --outDir ../dist/cp");
  }
}

// 5) Analyser routes dans router.ts vs ROUTE_CATALOG.json
function auditRouterVsCatalog() {
  const routerPath = path.join(repoRoot, "app", "src", "router.ts");
  const catalogPath = path.join(repoRoot, "runtime", "configs", "ssot", "ROUTE_CATALOG.json");

  if (!fs.existsSync(routerPath) || !fs.existsSync(catalogPath)) return;

  const routerContent = fs.readFileSync(routerPath, "utf8");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  // Extraire les routeIds du router.ts
  const routerRouteIds = new Set();
  const routeIdMatches = routerContent.matchAll(/"([a-z_]+_(?:app|cp))"/g);
  for (const match of routeIdMatches) {
    routerRouteIds.add(match[1]);
  }

  // Vérifier que toutes les routes du catalog sont dans le router
  catalog.routes.forEach((r) => {
    if (r.status === "ACTIVE" || r.status === "EXPERIMENTAL") {
      if (!routerRouteIds.has(r.route_id)) {
        issues.warnings.push(`Route ${r.route_id} dans catalog mais pas dans router.ts RouteId type`);
      }
    }
  });
}

// 6) Analyser registries vs router
function auditRegistries() {
  const appRegistryPath = path.join(repoRoot, "app", "src", "pages", "app", "registry.ts");
  const cpRegistryPath = path.join(repoRoot, "app", "src", "pages", "cp", "registry.ts");
  const routerPath = path.join(repoRoot, "app", "src", "router.ts");

  if (!fs.existsSync(appRegistryPath) || !fs.existsSync(cpRegistryPath) || !fs.existsSync(routerPath)) {
    return;
  }

  const appRegistry = fs.readFileSync(appRegistryPath, "utf8");
  const cpRegistry = fs.readFileSync(cpRegistryPath, "utf8");
  const router = fs.readFileSync(routerPath, "utf8");

  // Extraire routeIds des registries
  const appRouteIds = new Set();
  const appMatches = appRegistry.matchAll(/routeId:\s*"([^"]+_app)"/g);
  for (const match of appMatches) {
    appRouteIds.add(match[1]);
  }

  const cpRouteIds = new Set();
  const cpMatches = cpRegistry.matchAll(/routeId:\s*"([^"]+_cp)"/g);
  for (const match of cpMatches) {
    cpRouteIds.add(match[1]);
  }

  // Vérifier qu'il n'y a pas de chevauchement
  appRouteIds.forEach((id) => {
    if (cpRouteIds.has(id.replace("_app", "_cp"))) {
      issues.errors.push(`Route ID chevauchement: ${id} existe dans APP et CP`);
    }
  });
}

// Helper: obtenir tous les fichiers
function getAllFiles(dir, extensions) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Exécuter tous les audits
console.log("🔍 Audit système complet...\n");

auditRouteCatalog();
auditAppCpSeparation();
auditConsoleUsage();
auditBuildPaths();
auditRouterVsCatalog();
auditRegistries();

// Rapport
console.log("=".repeat(60));
console.log("RAPPORT D'AUDIT SYSTÈME\n");

if (issues.errors.length > 0) {
  console.log("❌ ERREURS CRITIQUES:");
  issues.errors.forEach((e) => console.log(`   - ${e}`));
  console.log("");
}

if (issues.warnings.length > 0) {
  console.log("⚠️  AVERTISSEMENTS:");
  issues.warnings.forEach((w) => console.log(`   - ${w}`));
  console.log("");
}

if (issues.missing.length > 0) {
  console.log("📋 ÉLÉMENTS MANQUANTS:");
  issues.missing.forEach((m) => console.log(`   - ${m}`));
  console.log("");
}

if (issues.duplicates.length > 0) {
  console.log("🔄 DOUBLONS:");
  issues.duplicates.forEach((d) => console.log(`   - ${d}`));
  console.log("");
}

if (issues.inactiveRoutes.length > 0) {
  console.log("💤 ROUTES INACTIVES:");
  issues.inactiveRoutes.forEach((r) => console.log(`   - ${r}`));
  console.log("");
}

if (issues.crossImports.length > 0) {
  console.log("🚫 IMPORTS CROISÉS APP/CP:");
  issues.crossImports.forEach((i) => console.log(`   - ${i}`));
  console.log("");
}

if (issues.consoleUsage.length > 0) {
  console.log("📝 UTILISATION DE console.* (devrait utiliser logger structuré):");
  issues.consoleUsage.slice(0, 20).forEach((c) => {
    console.log(`   - ${c.file}:${c.line} - ${c.usage}`);
  });
  if (issues.consoleUsage.length > 20) {
    console.log(`   ... et ${issues.consoleUsage.length - 20} autres`);
  }
  console.log("");
}

if (issues.pathIssues.length > 0) {
  console.log("🛤️  PROBLÈMES DE CHEMINS:");
  issues.pathIssues.forEach((p) => console.log(`   - ${p}`));
  console.log("");
}

const totalIssues =
  issues.errors.length +
  issues.warnings.length +
  issues.missing.length +
  issues.duplicates.length +
  issues.crossImports.length +
  issues.consoleUsage.length +
  issues.pathIssues.length;

if (totalIssues === 0) {
  console.log("✅ Aucun problème détecté!");
  process.exit(0);
} else {
  console.log(`\n📊 Total: ${totalIssues} problème(s) détecté(s)`);
  process.exit(issues.errors.length > 0 ? 1 : 0);
}
