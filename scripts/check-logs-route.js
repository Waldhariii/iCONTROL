/**
 * Logs route proof gate (tolerant).
 * Goal: keep proofs:all deterministic while allowing SSOT navigation variants.
 * Accepts ANY-OF patterns for the dashboard CTA (navigate helper OR direct hash).
 * Upgrade path: tighten once the canonical CP navigation contract is frozen.
 */
const fs = require("fs");
const path = require("path");

const checks = [
  {
    id: "dashboard-cta",
    file: "app/src/pages/cp/dashboard.ts",
    anyOf: [
      'navigate("#/logs")',
      "navigate('#/logs')",
      'window.location.hash = "#/logs"',
      "window.location.hash = '#/logs'",
      'location.hash = "#/logs"',
      "location.hash = '#/logs'",
    ],
  },
];

let failed = false;

for (const check of checks) {
  const filePath = path.resolve(process.cwd(), check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[logs-route-check] missing file: ${check.file}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(filePath, "utf8");

  if (check.anyOf && check.anyOf.length) {
    const ok = check.anyOf.some((needle) => content.includes(needle));
    if (!ok) {
      console.error(`[logs-route-check] missing ANY-OF patterns in ${check.file}`);
      for (const needle of check.anyOf) {
        console.error(`  - ${needle}`);
      }
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("[logs-route-check] OK");
