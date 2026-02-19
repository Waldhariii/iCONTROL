#!/usr/bin/env node
/**
 * Gate: auth-required-cp
 * - All /api/cp/* endpoints must call requireScope or requirePermission (no GET CP without auth)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const API_INDEX = resolve(ROOT, "platform/api/src/index.ts");
const REPORT_DIR = resolve(ROOT, "runtime/reports");
const REPORT_PATH = resolve(REPORT_DIR, "gate-auth-required-cp.md");

const src = readFileSync(API_INDEX, "utf8");
const lines = src.split("\n");

const violations = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const routeMatch = line.match(/app\.(get|post|put|delete|patch)\s*\(\s*["'](\/api\/cp\/[^"']+)["']/);
  if (!routeMatch) continue;
  const [, method, path] = routeMatch;
  const nextBlock = lines.slice(i + 1, i + 10).join(" ");
  const hasAuth = /requireScope\s*\(|requirePermission\s*\(|requireAnyRole\s*\(/.test(nextBlock);
  if (!hasAuth) {
    violations.push({ path, method, line: i + 1 });
  }
}

if (violations.length > 0) {
  const details = violations.map((v) => `- ${v.method.toUpperCase()} ${v.path} (line ${v.line}): missing requireScope/requirePermission`);
  writeReport("FAIL", ["CP endpoints without auth check"], details);
  process.exit(1);
}

writeReport("PASS", ["All /api/cp/* endpoints use requireScope or requirePermission"]);
console.log("OK gate:auth-required-cp");

function writeReport(status, summary, details = []) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const body = [
    "# Gate: auth-required-cp",
    "",
    `- Status: **${status}**`,
    `- Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    ...summary.map((l) => `- ${l}`),
    "",
    ...(details.length ? ["## Violations", "", ...details, ""] : []),
  ].join("\n");
  writeFileSync(REPORT_PATH, body, "utf8");
}
