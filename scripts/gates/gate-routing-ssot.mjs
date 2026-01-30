#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const SCRIPT = "scripts/audit/audit-chemins-non-regression.sh";

if (!existsSync(SCRIPT)) {
  console.error("ERR_ROUTING_SSOT_AUDIT_MISSING", SCRIPT);
  process.exit(1);
}

const res = spawnSync("bash", [SCRIPT], { stdio: "inherit" });
if (res.status !== 0) {
  console.error("ERR_ROUTING_SSOT_AUDIT_FAILED");
  process.exit(res.status ?? 1);
}
console.log("OK_ROUTING_SSOT");
