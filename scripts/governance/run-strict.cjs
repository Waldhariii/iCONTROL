#!/usr/bin/env node
/**
 * Strict lane runner:
 * - forces SAFE_MODE_STRICT=1
 * - executes npm script passed as argv[2] (default: "proofs:all")
 *
 * Usage:
 *   node scripts/governance/run-strict.cjs proofs:all
 *   node scripts/governance/run-strict.cjs proofs:strict
 */
const { spawnSync } = require("node:child_process");

const target = process.argv[2] || "proofs:all";
const env = { ...process.env, SAFE_MODE_STRICT: "1" };

const r = spawnSync("npm", ["run", "-s", target], {
  stdio: "inherit",
  env,
  shell: false,
});

process.exit(r.status ?? 1);
