#!/usr/bin/env node
const fs = require("node:fs");

const f = "governance/contracts/SYSTEM_CONFIGURATION.md";
if (!fs.existsSync(f)) {
  console.warn("[WARN_ONLY] missing SYSTEM_CONFIGURATION contract:", f);
  process.exit(0);
}

const s = fs.readFileSync(f, "utf8");

function has(pattern) {
  return new RegExp(pattern, "m").test(s);
}

// Minimal invariants (WARN_ONLY)
const required = [
  "^VERSION:\\s*1\\.0\\b",
  "^MODE:\\s*PROVIDER_READY\\b",
  "^SCOPE:\\s*CORE_FREE_COMPATIBLE\\b",
  "BUSINESS_MODEL\\s*=\\s*\"CORE_FREE \\+ OPTIONAL_PAID_MODULES\"",
  "TENANT_MODEL\\s*=\\s*\"STRICT_ISOLATION\"",
  "RULE\\s*=\\s*\"NO_OPERATION_ALLOWED_WITHOUT_EXPLICIT_TENANT_CONTEXT\"",
  "BILLING_STATUS\\s*=\\s*\"DORMANT\"",
  "RULES\\s*=\\s*\\["
];

const missing = required.filter(r => !has(r));
if (missing.length) {
  console.warn("[WARN_ONLY] SYSTEM_CONFIGURATION missing invariants:", missing);
  process.exit(0);
}

console.log("[OK] SYSTEM_CONFIGURATION contract present + invariants OK (WARN_ONLY).");
process.exit(0);
