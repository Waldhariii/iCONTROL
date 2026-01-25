#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const MUST = [
  "app/src/policies/feature_flags.default.json",
  "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md",
  "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md",
  "modules/core-system/subscription/FileSubscriptionStore.node.ts",
];

const missing = MUST.filter((p) => !existsSync(p));
if (missing.length) {
  console.error("ERR_SSOT_PATHS_MISSING", { missing });
  process.exit(2);
}

try {
  JSON.parse(readFileSync("app/src/policies/feature_flags.default.json", "utf8"));
} catch (e) {
  console.error("ERR_SSOT_FLAGS_JSON_INVALID", String(e));
  process.exit(3);
}

console.log("OK: SSOT canonical paths present + flags JSON valid");
