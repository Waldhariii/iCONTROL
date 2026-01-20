#!/usr/bin/env node
const fs = require("node:fs");

const fp = "governance/state.json";
if (!fs.existsSync(fp)) {
  console.error("[FAIL] missing:", fp);
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(fp, "utf8"));
j.state = "ACTIVE";
j.activated_at_utc = new Date().toISOString();
j.activated_by = process.env.USER || process.env.LOGNAME || "unknown";

fs.writeFileSync(fp, JSON.stringify(j, null, 2) + "\n");
console.log("[OK] governance state => ACTIVE");
