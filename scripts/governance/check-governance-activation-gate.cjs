#!/usr/bin/env node
const fs = require("node:fs");

const fp = "governance/state.json";
if (!fs.existsSync(fp)) {
  console.warn("[WARN_ONLY] missing governance/state.json (no activation gate applied).");
  process.exit(0);
}

let j;
try {
  j = JSON.parse(fs.readFileSync(fp, "utf8"));
} catch {
  console.warn("[WARN_ONLY] invalid governance/state.json (no activation gate applied).");
  process.exit(0);
}

const state = String(j.state || "DORMANT").toUpperCase();
const strict = String(process.env.SAFE_MODE_STRICT || "").trim() === "1";

if (state === "ACTIVE" && !strict) {
  console.warn("[WARN_ONLY] governance is ACTIVE but SAFE_MODE_STRICT!=1 (activation gated).");
  console.warn("[WARN_ONLY] To confirm intentional activation: export SAFE_MODE_STRICT=1");
  process.exit(0);
}

console.log("[OK] governance activation gate: pass");
process.exit(0);
