#!/usr/bin/env node
/**
 * Gate: no-global-select
 * - db.prepare("SELECT ... FROM audit_logs") must include tenant_id in the query
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const API_INDEX = resolve(ROOT, "platform/api/src/index.ts");
const REPORT_DIR = resolve(ROOT, "runtime/reports");
const REPORT_PATH = resolve(REPORT_DIR, "gate-no-global-select.md");

const src = readFileSync(API_INDEX, "utf8");
const lines = src.split("\n");
const violations = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes("audit_logs")) continue;
  if (!line.includes(".prepare(")) continue;
  const block = lines.slice(i, Math.min(i + 35, lines.length)).join("\n");
  if (!/FROM\s+audit_logs|audit_logs\s+[\w\s,)]/.test(block)) continue;
  const hasTenantScoping = /tenant_id|whereClause/.test(block);
  if (!hasTenantScoping) {
    violations.push({ line: i + 1, snippet: line.trim().slice(0, 90) });
  }
}

function writeReport(status, summary, detailLines = []) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const parts = [
    "# Gate: no-global-select",
    "",
    `- Status: **${status}**`,
    `- Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    ...summary.map((l) => `- ${l}`),
  ];
  if (detailLines.length) parts.push("", "## Violations", "", ...detailLines, "");
  writeFileSync(REPORT_PATH, parts.join("\n"), "utf8");
}

if (violations.length > 0) {
  const detailLines = violations.map((v) => `- Line ${v.line}: ${v.snippet}...`);
  writeReport("FAIL", ["SELECT from audit_logs without tenant_id scoping"], detailLines);
  process.exit(1);
}

writeReport("PASS", ["All audit_logs queries are tenant-scoped"]);
console.log("OK gate:no-global-select");
