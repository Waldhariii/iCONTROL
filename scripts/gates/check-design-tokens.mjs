#!/usr/bin/env node
/**
 * Gate — design.tokens (runtime/configs/ssot)
 * Vérifie: JSON valide, tokens complets, CSS vars générées à jour.
 */
import { readFileSync } from "node:fs";
import {
  GENERATED_CSS_PATH,
  TOKENS_PATH,
  buildDesignTokensCss,
  loadDesignTokens,
} from "./design-tokens-utils.mjs";

let tokens;
try {
  tokens = loadDesignTokens();
} catch (e) {
  console.error("[FAIL] " + e.message);
  process.exit(1);
}

let expected;
try {
  expected = buildDesignTokensCss(tokens);
} catch (e) {
  console.error("[FAIL] " + e.message);
  process.exit(1);
}

let current;
try {
  current = readFileSync(GENERATED_CSS_PATH, "utf8");
} catch (e) {
  console.error(
    "[FAIL] tokens.generated.css manquant: " + GENERATED_CSS_PATH,
  );
  process.exit(1);
}

if (current.trim() !== expected.trim()) {
  console.error("[FAIL] tokens.generated.css n'est pas à jour.");
  console.error("       Source: " + TOKENS_PATH);
  console.error("       Cible : " + GENERATED_CSS_PATH);
  console.error(
    "       Run   : node scripts/gates/generate-design-tokens-css.mjs",
  );
  process.exit(1);
}

console.log("OK: design.tokens.json valide et CSS à jour.");
process.exit(0);
