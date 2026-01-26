#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import {
  GENERATED_CSS_PATH,
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

let css;
try {
  css = buildDesignTokensCss(tokens);
} catch (e) {
  console.error("[FAIL] " + e.message);
  process.exit(1);
}

try {
  writeFileSync(GENERATED_CSS_PATH, css, "utf8");
} catch (e) {
  console.error("[FAIL] Ecriture CSS impossible: " + e.message);
  process.exit(1);
}

console.log("OK: tokens.generated.css mis a jour:");
console.log(" - " + GENERATED_CSS_PATH);
process.exit(0);
