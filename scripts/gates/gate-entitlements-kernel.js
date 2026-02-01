#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const repo = process.cwd();
const appSrc = path.join(repo, "app", "src");

/**
 * Goal:
 *  - Prevent scattered ENTITLEMENTS logic outside platform/entitlements
 *  - Avoid false positives on generic words like "tier" in unrelated contexts
 *
 * We flag ONLY:
 *  - direct reads of runtimeConfig structures (defaultTier/tenants/schemaVersion/__ICONTROL_RUNTIME_CONFIG__/getRuntimeConfigSnapshot)
 *  - explicit tier comparisons outside the kernel
 */
const BAD_PATTERNS = [
  // Runtime config structure access
  /\bdefaultTier\b/g,
  /\btenants\b\s*\?/g,               // "tenants?" direct optional access patterns
  /\btenants\?\./g,
  /\bschemaVersion\b/g,
  /\b__ICONTROL_RUNTIME_CONFIG__\b/g,
  /\bgetRuntimeConfigSnapshot\b/g,

  // Explicit tier comparisons (business logic leakage)
  /\btier\b\s*===\s*["'](free|pro|business|enterprise)["']/g,
  /\btier\b\s*!==\s*["'](free|pro|business|enterprise)["']/g,
];

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx"))) out.push(p);
  }
  return out;
}

const files = walk(appSrc);
const offenders = [];

for (const f of files) {
  const rel = path.relative(repo, f).replace(/\\/g, "/");

  // Allowlist: runtimeConfig + entitlements kernel itself + tests
  if (rel.includes("app/src/platform/runtimeConfig/")) continue;
  if (rel.includes("app/src/platform/entitlements/")) continue;
  if (rel.includes("app/src/__tests__/")) continue;
  // Transitional allowlist (known legacy usage)
  if (rel === "app/src/policies/cache.registry.ts") continue;

  const txt = fs.readFileSync(f, "utf8");

  for (const re of BAD_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(txt)) {
      offenders.push(`${rel}`);
      break;
    }
  }
}

if (offenders.length) {
  const uniq = Array.from(new Set(offenders)).sort();
  fail(
    "ERR_ENTITLEMENTS_SCATTERED_CHECKS: runtimeConfig reads / tier compares detected outside entitlements kernel:\n" +
    uniq.map(s => `- ${s}`).join("\n") +
    "\nFix: move those checks into app/src/platform/entitlements/* and consume only resolveCapabilities()."
  );
}

ok("OK: gate:entitlements-kernel");
