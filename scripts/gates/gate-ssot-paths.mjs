#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { readPaths, assertPathsExist } from "../ssot/paths.mjs";

const MUST = [
  "app/src/policies/feature_flags.default.json",
  "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md",
  "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md",
  "modules/core-system/subscription/FileSubscriptionStore.node.ts",
];

let paths;
try {
  paths = readPaths();
} catch (err) {
  console.error("ERR_SSOT_PATHS_READ", String(err));
  process.exit(1);
}

const missing = [
  ...MUST.filter((p) => !existsSync(p)),
  ...assertPathsExist(paths),
].filter(Boolean);
if (missing.length) {
  console.error("ERR_SSOT_PATHS_MISSING");
  for (const p of missing) console.error(" -", p);
  process.exit(2);
}

try {
  JSON.parse(readFileSync("app/src/policies/feature_flags.default.json", "utf8"));
  if (paths?.flags && existsSync(paths.flags)) {
    JSON.parse(readFileSync(paths.flags, "utf8"));
  }
} catch (e) {
  console.error("ERR_SSOT_FLAGS_JSON_INVALID", String(e));
  process.exit(3);
}

console.log("OK_SSOT_PATHS");
