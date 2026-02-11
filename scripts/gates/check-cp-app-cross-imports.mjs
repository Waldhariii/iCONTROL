#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const checks = [
  { name: "CP imports APP pages", pattern: "pages/app", paths: ["apps/control-plane/src/surfaces/cp"] },
  { name: "APP imports CP pages", pattern: "pages/cp", paths: ["apps/control-plane/src/surfaces/app"] },
];

let failed = false;

for (const check of checks) {
  const res = spawnSync("rg", ["-n", check.pattern, ...check.paths], { encoding: "utf8" });
  if (res.status === 0 && res.stdout.trim()) {
    failed = true;
    process.stderr.write(`FAIL: ${check.name}\n`);
    process.stderr.write(res.stdout);
  }
}

if (failed) process.exit(1);
process.stdout.write("OK: no cross-imports between app and cp pages\n");
