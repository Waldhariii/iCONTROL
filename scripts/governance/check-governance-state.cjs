#!/usr/bin/env node
const fs = require("node:fs");

const fp = "governance/state.json";
if (!fs.existsSync(fp)) {
  console.warn("[WARN_ONLY] governance state missing:", fp);
  process.exit(0);
}

let j;
try {
  j = JSON.parse(fs.readFileSync(fp, "utf8"));
} catch {
  console.warn("[WARN_ONLY] governance state invalid JSON:", fp);
  process.exit(0);
}

const state = String(j.state || "DORMANT").toUpperCase();
if (state !== "DORMANT" && state !== "ACTIVE") {
  console.warn("[WARN_ONLY] governance state unknown:", state);
  process.exit(0);
}

console.log(`[OK] governance state: ${state}`);
process.exit(0);
