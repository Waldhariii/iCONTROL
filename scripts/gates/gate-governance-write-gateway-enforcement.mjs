#!/usr/bin/env node
/**
 * Gate: write-gateway-enforcement
 * - CP/APP surfaces must not do direct mutation fetch to /api except via Write Gateway or authorized commands
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const REPORT_DIR = resolve(ROOT, "runtime/reports");
const REPORT_PATH = resolve(REPORT_DIR, "gate-write-gateway-enforcement.md");

const SURFACES = [
  "apps/control-plane/src/surfaces",
  "apps/control-plane/src/pages",
];
const ALLOWED_PREFIXES = [
  "apps/control-plane/src/platform/commands",
  "apps/control-plane/src/platform/write-gateway",
  "apps/control-plane/src/core/write-gateway",
];

// Match fetch( ... /api ... method: "POST"|PUT|DELETE|PATCH or method = "POST" etc
const PATTERN = String.raw`fetch\s*\([^)]*\/api[^)]*(?:method\s*:\s*["']?(?:POST|PUT|DELETE|PATCH)["']?|method\s*=\s*["']?(?:POST|PUT|DELETE|PATCH)["']?)`;
let raw = "";
try {
  raw = execFileSync("rg", ["-n", "-l", "--no-heading", "-e", PATTERN, ...SURFACES], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  raw = (e.stdout || "").toString();
}

const lines = raw.trim() ? raw.trim().split("\n") : [];
const violatingFiles = [...new Set(lines.map((l) => l.split(":")[0]).filter(Boolean))];
const allowedByPath = (file) => ALLOWED_PREFIXES.some((p) => file.startsWith(p));
// Legacy: files still using direct mutation; gate passes but report lists them for migration
const LEGACY_ALLOWLIST = [
  "apps/control-plane/src/surfaces/cp/users/hooks/useUsersCommands.ts",
  "apps/control-plane/src/surfaces/cp/users/Page.tsx",
  "apps/control-plane/src/surfaces/cp/pages/Page.tsx",
  "apps/control-plane/src/surfaces/cp/login-theme/Page.tsx",
  "apps/control-plane/src/surfaces/cp/audit/Page.ts",
  "apps/control-plane/src/platform/prefs/cpPrefs.ts",
  "apps/control-plane/src/surfaces/cp/providers/Page.tsx",
];
const allowed = (file) => allowedByPath(file) || LEGACY_ALLOWLIST.some((p) => file === p || file.endsWith(p));
const violations = violatingFiles.filter((f) => !allowed(f));
const legacyHits = violatingFiles.filter((f) => !allowedByPath(f) && LEGACY_ALLOWLIST.some((p) => f === p || f.endsWith(p)));

function writeReport(status, summary, detailLines = []) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const parts = [
    "# Gate: write-gateway-enforcement",
    "",
    `- Status: **${status}**`,
    `- Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    ...summary.map((l) => `- ${l}`),
  ];
  if (detailLines.length) parts.push("", "## Violations (direct mutation fetch outside WG/commands)", "", ...detailLines, "");
  writeFileSync(REPORT_PATH, parts.join("\n"), "utf8");
}

if (violations.length > 0) {
  const detailLines = violations.map((f) => `- ${f}`);
  writeReport("FAIL", ["Surfaces with direct mutation fetch to /api (use Write Gateway or platform/commands)"], detailLines);
  process.exit(1);
}

const summary = ["No new direct mutation fetch in surfaces; mutations via WG or authorized commands."];
if (legacyHits.length) {
  summary.push(`Legacy allowlist: ${legacyHits.length} file(s) (migrate to WG).`);
}
writeReport("PASS", summary);
console.log("OK gate:write-gateway-enforcement");
