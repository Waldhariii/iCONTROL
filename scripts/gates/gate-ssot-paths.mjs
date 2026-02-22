#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SSOT_MD = path.join(ROOT, "governance/docs/ssot/PATHS_CANONICAL.md");

const fail = (code, msg) => {
  console.error(code);
  if (msg) console.error(" - " + msg);
  process.exit(1);
};

if (!fs.existsSync(SSOT_MD)) {
  fail("ERR_SSOT_PATHS_SOURCE_MISSING", SSOT_MD);
}

const md = fs.readFileSync(SSOT_MD, "utf8");

// Extract all `backticked/paths` from the SSOT doc.
const re = /`([^`]+)`/g;
const all = [];
let m;
while ((m = re.exec(md))) all.push(m[1]);

// Business rule: report-only artifacts must not be required to exist.
// (These are generated outputs; SSOT keeps them for reference only.)
const isReportOnly = (p) =>
  p.includes("APPENDIX_COMMAND_OUTPUTS/") ||
  p.includes("write_surface_map_report") ||
  p.includes("write_gateway_coverage_report");

const allowedPrefixes = [
  "apps/",
  "core/",
  "design-system/",
  "governance/",
  "infra/",
  "modules/",
  "platform/",
  "runtime/",
  "scripts/",
  "docs/",
];

const looksLikeRepoPath = (p) => {
  if (!p) return false;

  // reject command-ish tokens / placeholders
  if (/\s/.test(p)) return false;         // spaces => not a path
  if (p.endsWith(":")) return false;       // e.g. NNN:
  if (p.startsWith("rg")) return false;    // e.g. rg -n
  if (p.startsWith("-") || p.startsWith("--")) return false;

  // sanity: repo-relative path
  if (!p.includes("/")) return false;
  if (p.includes("..")) return false;

  return allowedPrefixes.some((pre) => p.startsWith(pre));
};

const mustExist = Array.from(new Set(all))
  .filter((p) => !isReportOnly(p))
  .filter(looksLikeRepoPath);

const missing = [];
for (const rel of mustExist) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) missing.push(rel);
}

if (missing.length) {
  console.error("ERR_SSOT_PATHS_MISSING");
  for (const p of missing) console.error(" - " + p);
  process.exit(1);
}

process.stdout.write("OK: gate-ssot-paths\n");
