#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { readPaths, assertPathsExist } from "../ssot/paths.mjs";

let paths;
try {
  paths = readPaths();
} catch (err) {
  console.error("ERR_SSOT_PATHS_READ", String(err));
  process.exit(1);
}

const missing = assertPathsExist(paths);
if (missing.length) {
  console.error("ERR_SSOT_PATHS_MISSING", { missing });
  process.exit(2);
}

try {
  JSON.parse(readFileSync(paths.flags, "utf8"));
} catch (e) {
  console.error("ERR_SSOT_FLAGS_JSON_INVALID", String(e));
  process.exit(3);
}

console.log("OK: SSOT canonical paths present + flags JSON valid");
