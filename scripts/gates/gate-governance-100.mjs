#!/usr/bin/env node
/**
 * Governance 100/100: run all governance gates and emit combined report.
 * Gates: tenant-required-api, no-global-select, auth-required-cp, write-gateway-enforcement
 */
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = resolve(ROOT, "runtime/reports");
const COMBINED_PATH = resolve(REPORT_DIR, "governance-100-report.md");

const GATES = [
  { name: "tenant-required-api", script: "gate-governance-tenant-required-api.mjs" },
  { name: "no-global-select", script: "gate-governance-no-global-select.mjs" },
  { name: "auth-required-cp", script: "gate-governance-auth-required-cp.mjs" },
  { name: "write-gateway-enforcement", script: "gate-governance-write-gateway-enforcement.mjs" },
];

const results = [];
let failed = false;

for (const g of GATES) {
  const scriptPath = resolve(ROOT, "scripts/gates", g.script);
  const res = spawnSync("node", [scriptPath], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  const ok = res.status === 0;
  if (!ok) failed = true;
  results.push({ name: g.name, ok, stdout: (res.stdout || "").trim(), stderr: (res.stderr || "").trim() });
}

mkdirSync(REPORT_DIR, { recursive: true });

const lines = [
  "# Governance 100/100 — Gates Report",
  "",
  `- Date: ${new Date().toISOString()}`,
  `- Status: **${failed ? "FAIL" : "PASS"}**`,
  "",
  "## Gates",
  "",
  "| Gate | Status |",
  "|------|--------|",
  ...results.map((r) => `| ${r.name} | ${r.ok ? "✅ PASS" : "❌ FAIL"} |`),
  "",
  "## Individual reports",
  "",
  ...results.map((r) => `- \`runtime/reports/gate-${r.name}.md\``),
  "",
];

if (failed) {
  lines.push("## Failures", "");
  results.filter((r) => !r.ok).forEach((r) => {
    lines.push(`### ${r.name}`, "", "```", r.stderr || r.stdout || "no output", "```", "");
  });
}

writeFileSync(COMBINED_PATH, lines.join("\n"), "utf8");
console.log(`Report: runtime/reports/governance-100-report.md`);

if (failed) {
  process.exit(1);
}
console.log("OK governance-100");
