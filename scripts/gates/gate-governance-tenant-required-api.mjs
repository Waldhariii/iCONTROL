#!/usr/bin/env node
/**
 * Gate: tenant-required-api
 * - Ensures tenantBoundary is applied to /api
 * - Sensitive routes (/api/cp/*, /api/tenants) must call requireScope or requirePermission
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = process.cwd();
const API_INDEX = resolve(ROOT, "platform/api/src/index.ts");
const REPORT_DIR = resolve(ROOT, "runtime/reports");
const REPORT_PATH = resolve(REPORT_DIR, "gate-tenant-required-api.md");

const src = readFileSync(API_INDEX, "utf8");

// 1) tenantBoundary must be applied to /api
const hasTenantBoundary = /app\.use\s*\(\s*["']\/api["']\s*,\s*tenantBoundary\s*\)/.test(src);
if (!hasTenantBoundary) {
  writeReport("FAIL", ["tenantBoundary not applied to /api"]);
  process.exit(1);
}

// 2) Find sensitive routes: /api/cp/* and /api/tenants (exclude /api/health, /api/auth)
const lines = src.split("\n");
const sensitivePrefixes = ["/api/cp/", "/api/tenants"];
const exemptPaths = ["/api/health", "/api/auth"];
const violations = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const routeMatch = line.match(/app\.(get|post|put|delete|patch)\s*\(\s*["'](\/api\/[^"']+)["']/);
  if (!routeMatch) continue;
  const [, method, path] = routeMatch;
  const pathNorm = path.replace(/\?.*$/, "").trim();
  if (exemptPaths.some((e) => pathNorm === e || pathNorm.startsWith(e + "/"))) continue;
  const isSensitive = pathNorm.startsWith("/api/cp/") || pathNorm === "/api/tenants" || pathNorm.startsWith("/api/tenants/");
  if (!isSensitive) continue;
  const nextBlock = lines.slice(i + 1, i + 8).join(" ");
  const hasAuth = /requireScope\s*\(|requirePermission\s*\(|requireAnyRole\s*\(/.test(nextBlock);
  if (!hasAuth) {
    violations.push({ path: pathNorm, method, reason: "missing requireScope/requirePermission", line: i + 1 });
  }
}

if (violations.length > 0) {
  writeReport("FAIL", violations.map((v) => `${v.method.toUpperCase()} ${v.path}: ${v.reason}`));
  process.exit(1);
}

writeReport("PASS", ["tenantBoundary on /api", "all sensitive routes use requireScope/requirePermission"]);
console.log("OK gate:tenant-required-api");

function writeReport(status, lines) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const body = [
    "# Gate: tenant-required-api",
    "",
    `- Status: **${status}**`,
    `- Date: ${new Date().toISOString()}`,
    "",
    "## Details",
    "",
    ...lines.map((l) => `- ${l}`),
    "",
  ].join("\n");
  writeFileSync(REPORT_PATH, body, "utf8");
}
