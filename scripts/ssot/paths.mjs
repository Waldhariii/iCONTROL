#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_PATHS_FILE = "PATHS_CANONICAL.md";

function extractJsonBlock(mdText) {
  const match = mdText.match(/```json\s*([\s\S]*?)\s*```/m);
  if (!match) {
    throw new Error("SSOT JSON block not found in PATHS_CANONICAL.md");
  }
  return match[1];
}

export function readPaths({ root = process.cwd(), file = DEFAULT_PATHS_FILE } = {}) {
  const mdPath = resolve(root, file);
  const md = readFileSync(mdPath, "utf8");
  const jsonText = extractJsonBlock(md);
  const parsed = JSON.parse(jsonText);

  // rg -n safety inventory (report-only). Canonicalized here to avoid path drift.
  // NOTE: keep this path stable; gates must write/read ONLY via this SSOT entry.
  const rgNSafetyReport =
    parsed?.rgNSafetyReport || parsed?.reports?.rgNSafety || "rg_n_safety_report.md";
  const reports = {
    ...(parsed.reports || {}),
    rgNSafety: parsed?.reports?.rgNSafety || rgNSafetyReport,
  };

  return {
    rgNSafetyReport,
    flags: parsed.flags,
    reports,
    gates: parsed.gates || {},
    hooks: parsed.hooks || {},
    roots: parsed.roots || [],
    pilotsPhase1: parsed.pilotsPhase1 || {},
  };
}

export function assertPathsExist(paths, { root = process.cwd() } = {}) {
  const missing = [];

  function check(p) {
    if (!p) return;
    const abs = resolve(root, p);
    if (!existsSync(abs)) missing.push(p);
  }

  check(paths.flags);
  check(paths.reports?.surfaceMap);
  check(paths.reports?.coverage);
  check(paths.gates?.ssotPaths);
  check(paths.gates?.surfaceMap);
  check(paths.gates?.coverage);
  check(paths.hooks?.preCommit);

  return missing;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const paths = readPaths();
    const missing = assertPathsExist(paths);
    if (missing.length) {
      console.error("ERR_SSOT_PATHS_MISSING", { missing });
      process.exit(2);
    }
    console.log("OK: SSOT paths loaded from PATHS_CANONICAL.md");
  } catch (err) {
    console.error("ERR_SSOT_PATHS", String(err));
    process.exit(1);
  }
}
