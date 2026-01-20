/**
 * WARN_ONLY guardrail:
 * - Ensures paid kill-switch module exists and exports expected API.
 * - Does NOT execute app runtime; compile-time only.
 *
 * CommonJS to avoid Node "MODULE_TYPELESS_PACKAGE_JSON" warning without changing package.json type.
 */
const fs = require("node:fs");

const f = "app/src/core/governance/paidKillSwitch.ts";
if (!fs.existsSync(f)) {
  console.error("[FAIL] missing paid kill-switch file:", f);
  process.exit(1);
}

const s = fs.readFileSync(f, "utf8");
const required = ["paidKillSwitch", "isEnabled", "enable", "disable"];
const missing = required.filter(k => !s.includes(k));
if (missing.length) {
  console.warn("[WARN_ONLY] paid kill-switch missing expected tokens:", missing.join(", "));
  process.exit(0);
}

console.log("[OK] paid kill-switch guardrail: present.");
