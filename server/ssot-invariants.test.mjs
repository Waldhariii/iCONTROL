#!/usr/bin/env node
/**
 * SSOT Invariants Test
 * 
 * Verrouille le serveur SSOT contre les régressions en vérifiant:
 * 1) Ordre de routing strict et immuable
 * 2) Wrapper legacy JS pur (aucune logique métier)
 */

const ERR_SSOT_LOG_CONTRACT_FAILED = "ERR_SSOT_LOG_CONTRACT_FAILED";


import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { info, warn, err } from "./log.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname);
const repoRoot = path.resolve(serverRoot, "..");

const TS_FILE = path.join(serverRoot, "runtime-config-server.ts");
const JS_FILE = path.join(serverRoot, "runtime-config-server.js");

let failures = 0;

function fail(checkName, reason, context = "") {
  console.error(`❌ FAIL: ${checkName}`);
  console.error(`   ${reason}`);
  if (context) {
    const lines = context.split("\n").slice(0, 3);
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`   ${line.trim()}`);
      }
    });
  }
  failures++;
}

function pass(checkName) {
  console.log(`✅ PASS: ${checkName}`);
}


// ----------------------------
// LOG_CONTRACT (no console.*; codes must be INFO_/WARN_/ERR_)
// ----------------------------
function checkLogContract() {
  const base = path.resolve(__dirname);
  const allow = new Set([
    path.resolve(base, "runtime-config-server.js"), // legacy wrapper allowed to console.*
    path.resolve(base, "ssot-invariants.test.mjs"), // test file itself allowed to console.* for user output
  ]);

  // Targets: server/*.ts + server/*.mjs + server/*.js (except wrapper is allowlisted)
  const candidates = [];
  for (const name of fs.readdirSync(base)) {
    if (name.endsWith(".ts") || name.endsWith(".mjs") || name.endsWith(".js")) {
      candidates.push(path.resolve(base, name));
    }
  }

  const violations = [];

  for (const f of candidates) {
    if (allow.has(f)) continue;
    const src = fs.readFileSync(f, "utf8");

    // 1) Forbid console.* in SSOT + scripts (hard contract)
    const consoleRegex = /\bconsole\.(log|info|warn|error)\s*\(/g;
    let consoleMatch;
    while ((consoleMatch = consoleRegex.exec(src)) !== null) {
      const lineNum = src.substring(0, consoleMatch.index).split("\n").length;
      violations.push({ file: path.basename(f), type: "CONSOLE_FORBIDDEN", line: lineNum, match: consoleMatch[0] });
    }

    // 2) Enforce that any structured logger usage includes standard code prefix (best-effort static)
    // Accept patterns: info("INFO_*", ...), warn("WARN_*", ...), err("ERR_*", ...)
    const badInfoRegex = /\binfo\(\s*"(?!INFO_[A-Z0-9_]+")/g;
    const badWarnRegex = /\bwarn\(\s*"(?!WARN_[A-Z0-9_]+")/g;
    const badErrRegex = /\berr\(\s*"(?!ERR_[A-Z0-9_]+")/g;
    
    let badInfo;
    while ((badInfo = badInfoRegex.exec(src)) !== null) {
      const lineNum = src.substring(0, badInfo.index).split("\n").length;
      violations.push({ file: path.basename(f), type: "CODE_PREFIX", code: "info", line: lineNum });
    }
    
    let badWarn;
    while ((badWarn = badWarnRegex.exec(src)) !== null) {
      const lineNum = src.substring(0, badWarn.index).split("\n").length;
      violations.push({ file: path.basename(f), type: "CODE_PREFIX", code: "warn", line: lineNum });
    }
    
    let badErr;
    while ((badErr = badErrRegex.exec(src)) !== null) {
      const lineNum = src.substring(0, badErr.index).split("\n").length;
      violations.push({ file: path.basename(f), type: "CODE_PREFIX", code: "err", line: lineNum });
    }
  }

  return violations;
}

// Suite A: ROUTING IMMUTABLE
function checkRoutingImmutable() {
  console.log("\n🔍 Checking routing order immutability...\n");

  if (!fs.existsSync(TS_FILE)) {
    fail("ROUTING_IMMUTABLE", `Source file not found: ${TS_FILE}`);
    return;
  }

  const content = fs.readFileSync(TS_FILE, "utf8");

  // Extract handleRuntimeConfigRequest function
  const funcMatch = content.match(
    /export\s+function\s+handleRuntimeConfigRequest\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*export\s+function|\n\s*function\s+parseArgs|\n\s*if\s*\(import\.meta|$)/,
  );
  if (!funcMatch) {
    fail(
      "ROUTING_IMMUTABLE",
      "Cannot find handleRuntimeConfigRequest function",
    );
    return;
  }

  const funcBody = funcMatch[1];
  const funcStart = funcMatch.index;

  // Expected order of pathname checks
  const expectedOrder = [
    { path: "/api/health", type: "exact", description: "health endpoint" },
    { path: "/healthz", type: "exact", description: "healthz endpoint" },
    {
      path: "/app/api/runtime-config",
      type: "exact",
      description: "app runtime-config",
    },
    {
      path: "/cp/api/runtime-config",
      type: "exact",
      description: "cp runtime-config",
    },
    {
      path: "/app/api/route-catalog",
      type: "exact",
      description: "app route-catalog",
    },
    {
      path: "/cp/api/route-catalog",
      type: "exact",
      description: "cp route-catalog",
    },
    { path: "/app", type: "startsWith", description: "static app" },
    { path: "/cp", type: "startsWith", description: "static cp" },
  ];

  // Find all pathname checks
  const pathnameChecks = [];
  const lines = funcBody.split("\n");
  const baseLineNum = content.substring(0, funcStart).split("\n").length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = baseLineNum + i;

    // Check for exact pathname matches
    const exactMatch = line.match(
      /if\s*\(\s*pathname\s*===\s*["']([^"']+)["']\s*\)/,
    );
    if (exactMatch) {
      pathnameChecks.push({
        path: exactMatch[1],
        type: "exact",
        line: lineNum,
        lineContent: line.trim(),
      });
      continue;
    }

    // Check for startsWith
    const startsWithMatch = line.match(
      /if\s*\(\s*pathname\.startsWith\(["']([^"']+)["']\s*\)/,
    );
    if (startsWithMatch) {
      pathnameChecks.push({
        path: startsWithMatch[1],
        type: "startsWith",
        line: lineNum,
        lineContent: line.trim(),
      });
      continue;
    }
  }

  // Check 1: Health endpoints must NOT be grouped (no ||)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      (line.includes('pathname === "/api/health"') ||
        line.includes('pathname === "/healthz"')) &&
      line.includes("||")
    ) {
      fail(
        "ROUTING_IMMUTABLE",
        "Health endpoints must NOT be grouped (no || operator)",
        `Line ${baseLineNum + i}: ${line.trim()}`,
      );
    }
  }

  // Check 2: Verify order - find positions of each expected check
  const checkPositions = {};
  for (const check of pathnameChecks) {
    const key = `${check.type}:${check.path}`;
    if (!checkPositions[key]) {
      checkPositions[key] = [];
    }
    checkPositions[key].push(check);
  }

  // Verify all expected checks exist
  for (const expected of expectedOrder) {
    const key = `${expected.type}:${expected.path}`;
    if (!checkPositions[key] || checkPositions[key].length === 0) {
      fail(
        "ROUTING_IMMUTABLE",
        `Missing required check: ${expected.type} "${expected.path}" (${expected.description})`,
      );
    }
  }

  // Verify order: each expected check must come before the next one
  for (let i = 0; i < expectedOrder.length - 1; i++) {
    const current = expectedOrder[i];
    const next = expectedOrder[i + 1];
    const currentKey = `${current.type}:${current.path}`;
    const nextKey = `${next.type}:${next.path}`;

    const currentChecks = checkPositions[currentKey] || [];
    const nextChecks = checkPositions[nextKey] || [];

    if (currentChecks.length > 0 && nextChecks.length > 0) {
      const currentMinLine = Math.min(...currentChecks.map((c) => c.line));
      const nextMinLine = Math.min(...nextChecks.map((c) => c.line));

      if (currentMinLine > nextMinLine) {
        fail(
          "ROUTING_IMMUTABLE",
          `Out of order: ${current.type} "${current.path}" (line ${currentMinLine}) should come before ${next.type} "${next.path}" (line ${nextMinLine})`,
          `Expected order: ${current.description} → ${next.description}`,
        );
      }
    }
  }

  // Check 3: Static routing must come AFTER API endpoints
  const staticAppIndex = pathnameChecks.findIndex(
    (c) => c.path === "/app" && c.type === "startsWith",
  );
  const staticCpIndex = pathnameChecks.findIndex(
    (c) => c.path === "/cp" && c.type === "startsWith",
  );
  const routeCatalogIndex = pathnameChecks.findIndex(
    (c) => c.path === "/cp/api/route-catalog" && c.type === "exact",
  );

  if (staticAppIndex !== -1 && routeCatalogIndex !== -1) {
    if (staticAppIndex < routeCatalogIndex) {
      fail(
        "ROUTING_IMMUTABLE",
        "Static routing (/app) must come AFTER route-catalog endpoints",
        `Static at line ${pathnameChecks[staticAppIndex].line}, route-catalog at line ${pathnameChecks[routeCatalogIndex].line}`,
      );
    }
  }

  if (staticCpIndex !== -1 && routeCatalogIndex !== -1) {
    if (staticCpIndex < routeCatalogIndex) {
      fail(
        "ROUTING_IMMUTABLE",
        "Static routing (/cp) must come AFTER route-catalog endpoints",
        `Static at line ${pathnameChecks[staticCpIndex].line}, route-catalog at line ${pathnameChecks[routeCatalogIndex].line}`,
      );
    }
  }

  // Check 4: All expected paths must be found
  for (const expected of expectedOrder) {
    const found = pathnameChecks.find(
      (c) => c.path === expected.path && c.type === expected.type,
    );
    if (!found) {
      fail(
        "ROUTING_IMMUTABLE",
        `Missing required check: ${expected.type} "${expected.path}" (${expected.description})`,
      );
    }
  }

  if (failures === 0) {
    pass("ROUTING_IMMUTABLE");
  }
}

// Suite B: WRAPPER PUR
function checkWrapperPurity() {
  console.log("\n🔍 Checking legacy wrapper purity...\n");

  if (!fs.existsSync(JS_FILE)) {
    fail("WRAPPER_PURITY", `Legacy wrapper file not found: ${JS_FILE}`);
    return;
  }

  const content = fs.readFileSync(JS_FILE, "utf8");

  // Forbidden patterns (business logic signatures)
  const forbiddenPatterns = [
    {
      pattern: /serveStatic/,
      name: "serveStatic function",
      description: "Static file serving logic",
    },
    {
      pattern: /handleRuntimeConfigRequest/,
      name: "handleRuntimeConfigRequest function",
      description: "Request handling logic",
    },
    {
      pattern: /routeCatalogPath/,
      name: "routeCatalogPath variable",
      description: "Route catalog path reference",
    },
    {
      pattern: /\bappDist\b/,
      name: "appDist variable",
      description: "App distribution path",
    },
    {
      pattern: /\bcpDist\b/,
      name: "cpDist variable",
      description: "CP distribution path",
    },
    {
      pattern: /fs\.readFileSync/,
      name: "fs.readFileSync",
      description: "File reading (except for SSOT server check)",
    },
    {
      pattern: /fs\.createReadStream/,
      name: "fs.createReadStream",
      description: "File streaming",
    },
    {
      pattern: /normalizePathname/,
      name: "normalizePathname function",
      description: "Path normalization logic",
    },
    {
      pattern: /sendJson/,
      name: "sendJson function",
      description: "JSON response helper",
    },
    {
      pattern: /pathname\s*===?\s*["']\/app\/api\//,
      name: "pathname check for /app/api/",
      description: "API routing logic",
    },
    {
      pattern: /pathname\s*===?\s*["']\/cp\/api\//,
      name: "pathname check for /cp/api/",
      description: "API routing logic",
    },
    {
      pattern: /ROUTE_CATALOG/,
      name: "ROUTE_CATALOG reference",
      description: "Route catalog constant",
    },
  ];

  // Allowed patterns (wrapper-only operations)
  const allowedPatterns = [
    /spawn/,
    /require\(["']node:child_process["']\)/,
    /require\(["']node:path["']\)/,
    /require\(["']node:fs["']\)/,
    /path\.resolve/,
    /fs\.existsSync/,
    /execSync/,
    /console\.(warn|log|error)/,
    /process\.(exit|on|env)/,
    /SSOT_SERVER/,
    /server\/dist\/runtime-config-server\.mjs/,
    /npm run server:build/,
  ];

  // Check for forbidden patterns
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const forbidden of forbiddenPatterns) {
      // Special case: fs.existsSync is allowed if it's checking for SSOT_SERVER
      if (
        forbidden.pattern === /fs\.existsSync/ &&
        line.includes("SSOT_SERVER")
      ) {
        continue;
      }

      // Special case: fs.readFileSync is allowed if it's reading package.json or similar config
      if (
        forbidden.pattern === /fs\.readFileSync/ &&
        !line.includes("ROUTE_CATALOG") &&
        !line.includes("route-catalog")
      ) {
        // Only allow if it's clearly a config file read, not business logic
        if (
          line.includes("package.json") ||
          line.includes("tsconfig") ||
          line.includes(".json")
        ) {
          continue;
        }
      }

      if (forbidden.pattern.test(line)) {
        // Check if it's in a comment
        const commentMatch = line.match(/^\s*\/\//);
        if (commentMatch) {
          continue; // Allow in comments
        }

        fail(
          "WRAPPER_PURITY",
          `Found forbidden ${forbidden.name}: ${forbidden.description}`,
          `Line ${lineNum}: ${line.trim()}`,
        );
      }
    }
  }

  // Verify that the file delegates to SSOT
  if (!content.includes("server/dist/runtime-config-server.mjs")) {
    fail(
      "WRAPPER_PURITY",
      "Wrapper must delegate to server/dist/runtime-config-server.mjs",
    );
  }

  // Verify that spawn or similar delegation exists
  if (!content.includes("spawn") && !content.includes("execSync")) {
    fail(
      "WRAPPER_PURITY",
      "Wrapper must use spawn or execSync to delegate to SSOT server",
    );
  }

  if (failures === 0) {
    pass("WRAPPER_PURITY");
  }
}

// Main execution
console.log("🔒 SSOT Invariants Test\n");
console.log("Verifying SSOT lockdown against regressions...\n");

checkRoutingImmutable();
checkWrapperPurity();

// Suite C: LOG_CONTRACT
console.log("\n🔍 Checking log contract compliance...\n");
const logViolations = checkLogContract();
if (logViolations.length > 0) {
  err("ERR_SSOT_LOG_CONTRACT_FAILED", "ssot-invariants", `Found ${logViolations.length} log contract violation(s)`, { violations: logViolations });
  fail("LOG_CONTRACT", `Found ${logViolations.length} log contract violation(s)`, JSON.stringify(logViolations, null, 2));
} else {
  info("INFO_SSOT_LOG_CONTRACT_PASS", "ssot-invariants", "LOG_CONTRACT: PASS");
  pass("LOG_CONTRACT");
}

console.log("\n" + "=".repeat(50));
if (failures === 0) {
  console.log("✅ All invariant checks passed!");
  process.exit(0);
} else {
  console.error(`\n❌ ERR_SSOT_INVARIANT_FAILED: ${failures} invariant check(s) failed`);
  console.error("The SSOT is not properly locked down.");
  process.exit(1);
}
