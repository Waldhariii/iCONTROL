#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { readPaths } from "../ssot/paths.mjs";

/**
 * gate:ssot:paths
 * Contract:
 * - Never hardcode repo paths here (SSOT-only).
 * - Verify SSOT-resolved paths exist.
 * - Validate flags JSON parses.
 * - Exit non-zero on missing/invalid.
 */

function fail(code, details) {
  console.error(code, details || "");
  process.exit(1);
}

let paths;
try {
  paths = readPaths();
} catch (err) {
  fail("ERR_SSOT_PATHS_READ", String(err));
}

const must = [
  paths.flags,
  paths.reports?.surfaceMap,
  paths.reports?.coverage,
  ...(Array.isArray(paths.roots) ? paths.roots : []),
].filter(Boolean);

const missing = must.filter((p) => !existsSync(p));
if (missing.length) {
  console.error("ERR_SSOT_PATHS_MISSING");
  for (const m of missing) console.error(" -", m);
  process.exit(2);
}

try {
  JSON.parse(readFileSync(paths.flags, "utf8"));
} catch (err) {
  fail("ERR_SSOT_FLAGS_JSON_INVALID", `${paths.flags} :: ${String(err)}`);
}

console.log("OK_SSOT_PATHS", JSON.stringify({
  flags: paths.flags,
  reports: paths.reports,
  roots: paths.roots,
}, null, 2));
