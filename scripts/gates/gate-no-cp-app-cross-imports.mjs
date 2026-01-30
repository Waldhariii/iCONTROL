#!/usr/bin/env node
/**
 * Gate: Prevent CP <-> APP cross-imports
 * Fails if any file in app/src imports from pages/cp/ or pages/app/ of the opposite scope
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

const REPO_ROOT = process.cwd();

function checkCrossImports() {
  const errors = [];
  
  // Check CP files importing APP pages
  try {
    const cpImportsApp = execSync(
      `rg -n --hidden --glob '!.git' "from\\s+['\"].*pages/app/|import.*pages/app/" app/src/pages/cp app/src/core app/src/router.ts app/src/moduleLoader.ts 2>/dev/null || true`,
      { encoding: "utf-8", cwd: REPO_ROOT }
    ).trim();
    
    if (cpImportsApp) {
      errors.push("CP files importing APP pages:");
      errors.push(cpImportsApp);
    }
  } catch (e) {
    // rg might not find matches, that's OK
  }
  
  // Check APP files importing CP pages
  try {
    const appImportsCp = execSync(
      `rg -n --hidden --glob '!.git' "from\\s+['\"].*pages/cp/|import.*pages/cp/" app/src/pages/app app/src/core app/src/router.ts app/src/moduleLoader.ts 2>/dev/null || true`,
      { encoding: "utf-8", cwd: REPO_ROOT }
    ).trim();
    
    if (appImportsCp) {
      errors.push("APP files importing CP pages:");
      errors.push(appImportsCp);
    }
  } catch (e) {
    // rg might not find matches, that's OK
  }
  
  // Exception: pagesInventory.ts is allowed to import both (it's a utility)
  // But we check it doesn't import registries directly
  try {
    const inventoryImports = execSync(
      `rg -n "from.*pages/(cp|app)/registry" app/src/core/pagesInventory.ts 2>/dev/null || true`,
      { encoding: "utf-8", cwd: REPO_ROOT }
    ).trim();
    
    if (inventoryImports) {
      errors.push("pagesInventory.ts should not import registries directly (cross-import):");
      errors.push(inventoryImports);
    }
  } catch (e) {
    // OK
  }
  
  if (errors.length > 0) {
    console.error("❌ CROSS-IMPORT VIOLATIONS DETECTED:");
    console.error(errors.join("\n\n"));
    process.exit(1);
  }
  
  console.log("✅ No CP <-> APP cross-imports detected");
}

checkCrossImports();
