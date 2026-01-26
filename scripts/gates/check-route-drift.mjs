#!/usr/bin/env node
/**
 * Gate — Route drift (ROUTE_DRIFT_REPORT)
 * Vérifie: docs/ssot/ROUTE_DRIFT_REPORT.md existe et que la métrique
 * "Routes extra (dans le code, absentes du catalogue)" vaut 0.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PATH = resolve(process.cwd(), "docs/ssot/ROUTE_DRIFT_REPORT.md");

if (!existsSync(PATH)) {
  console.error("[FAIL] ROUTE_DRIFT_REPORT.md manquant: " + PATH);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(PATH, "utf8");
} catch (e) {
  console.error("[FAIL] Impossible de lire " + PATH + ":", e.message);
  process.exit(1);
}

const lines = raw.split("\n");
let extra = null;
for (const line of lines) {
  if (line.includes("Routes extra") && line.includes("absentes du catalogue")) {
    const cells = line.split("|").map((c) => c.trim());
    // Table markdown: | A | B | => cells = ['', 'A', 'B', '']
    const val = cells[2] ?? cells.find((c) => /^\d+$/.test(c));
    const n = parseInt(String(val).trim(), 10);
    if (!Number.isNaN(n)) {
      extra = n;
      break;
    }
  }
}

if (extra === null) {
  console.error("[FAIL] ROUTE_DRIFT_REPORT.md: ligne 'Routes extra (dans le code, absentes du catalogue)' introuvable ou valeur non entière.");
  process.exit(1);
}

if (extra > 0) {
  console.error("[FAIL] ROUTE_DRIFT_REPORT: Routes extra = " + extra + " (doit être 0). Mettre à jour ROUTE_CATALOG.json et régénérer le rapport.");
  process.exit(1);
}

console.log("OK: ROUTE_DRIFT_REPORT — Routes extra = 0.");
process.exit(0);
