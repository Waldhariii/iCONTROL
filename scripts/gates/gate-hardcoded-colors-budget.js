#!/usr/bin/env node
/* Hardcoded colors budget gate (baseline lock).
   - Scans repo for common hardcoded color patterns.
   - Allows explicit allowlist paths.
   - Fails if current count > budget (budget stored in config/hardcoded-colors-budget.json).
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../..");

const BUDGET_PATH = path.join(REPO, "config", "hardcoded-colors-budget.json");

// Conservative patterns: hex, rgb/rgba, hsl/hsla. (No CSS vars)
const RE = /\b(#(?:[0-9a-fA-F]{3,8})\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0?\.\d+|1(?:\.0)?)\s*)?\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*(?:0?\.\d+|1(?:\.0)?)\s*)?\))/g;

const ALLOWLIST = [
  // generated tokens or legacy artifacts we accept short-term
  "app/src/styles/tokens.generated.css",
  "app/src/ui-v2/tokens/design-tokens.css",
  "app/src/styles/STYLE_ADMIN_FINAL.css",
];

const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs"]);

function isIgnored(p) {
  const rel = path.relative(REPO, p).replaceAll("\\", "/");
  if (rel.startsWith(".git/")) return true;
  if (rel.includes("node_modules/")) return true;
  if (rel.includes("_audit/")) return true;
  if (rel.includes("_backups/")) return true;
  if (rel.includes("_artifacts/")) return true;
  if (ALLOWLIST.includes(rel)) return true;
  return false;
}

function walk(dir, out) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (isIgnored(p)) continue;
    if (e.isDirectory()) walk(p, out);
    else {
      const ext = path.extname(e.name);
      if (SCAN_EXT.has(ext)) out.push(p);
    }
  }
}

function loadBudget() {
  if (!fs.existsSync(BUDGET_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BUDGET_PATH, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const files = [];
  walk(REPO, files);

  let hits = 0;
  const offenders = [];

  for (const f of files) {
    const rel = path.relative(REPO, f).replaceAll("\\", "/");
    const s = fs.readFileSync(f, "utf8");
    const matches = [...s.matchAll(RE)];
    if (matches.length) {
      hits += matches.length;
      offenders.push({ file: rel, count: matches.length });
    }
  }

  offenders.sort((a, b) => b.count - a.count);

  const budget = loadBudget();
  if (!budget) {
    // Initialize baseline budget (fail-closed only if init explicitly requested elsewhere)
    const init = { budget: hits, ts: new Date().toISOString(), allowlist: ALLOWLIST };
    fs.mkdirSync(path.dirname(BUDGET_PATH), { recursive: true });
    fs.writeFileSync(BUDGET_PATH, JSON.stringify(init, null, 2) + "\n");
    console.log(`OK: hardcoded-colors budget initialized => ${hits}`);
    process.exit(0);
  }

  const allowedBudget = Number(budget.budget ?? 0);
  if (Number.isNaN(allowedBudget)) {
    console.error("ERR_HARDCODED_COLORS_BUDGET_INVALID: budget is not a number");
    process.exit(2);
  }

  if (hits > allowedBudget) {
    console.error(`ERR_HARDCODED_COLORS_BUDGET_EXCEEDED: ${hits} > ${allowedBudget}`);
    console.error("Top offenders:");
    for (const o of offenders.slice(0, 20)) {
      console.error(`- ${o.file} :: ${o.count}`);
    }
    process.exit(1);
  }

  console.log(`OK: hardcoded-colors within budget => ${hits} <= ${allowedBudget}`);
  process.exit(0);
}

main();
