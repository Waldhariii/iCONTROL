#!/usr/bin/env node
import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

const tracked = sh("git ls-files _audit || true");
if (tracked) {
  const lines = tracked.split("\n").filter(Boolean);
  console.error("ERR_AUDIT_TRACKED: _audit artifacts must remain untracked (generated-only).");
  for (const f of lines) console.error(" - " + f);
  process.exit(2);
}
console.log("OK: _audit is not tracked");
