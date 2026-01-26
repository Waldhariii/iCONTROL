#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const REPORT = resolve(ROOT, "docs/SSOT/rg_n_safety_report.md");

// We only scan scripts/ (not src runtime). This is governance hardening scope.
const TARGETS = ["scripts"];
const PATTERN = String.raw`\brg\s+-n\b`;

function runRg() {
  const args = [
    "--pcre2",
    "--no-heading",
    "-S",
    "-g!node_modules/**",
    "-g!dist/**",
    "-g!coverage/**",
    "-e",
    PATTERN,
    ...TARGETS,
  ];
  try {
    return execFileSync("rg", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    // rg exits 1 on no matches; treat as empty report
    const code = e?.status;
    if (code === 1) return "";
    throw e;
  }
}

const hitsRaw = runRg().trim();
const lines = hitsRaw ? hitsRaw.split("\n") : [];

mkdirSync(resolve(ROOT, "docs/SSOT"), { recursive: true });

const body = [
  "# rg -n safety report (scripts only)",
  "",
  "## Purpose",
  "- Identify scripts that use `rg -n`, which prefixes results with line numbers (`NNN:`) and can break path resolution logic.",
  "- This gate is report-only (non-blocking).",
  "",
  `## Total hits: ${lines.length}`,
  "",
  "## Hits",
  ...(lines.length ? lines.map((l) => `- ${l}`) : ["- (none)"]),
  "",
  "## Recommended remediations",
  "- If the script uses `rg -n` to **resolve file paths**, replace with `rg --files` or remove `-n` and parse cleanly.",
  "- If the script uses `rg -n` only for **human-readable grep output**, it is acceptable; mark it as informational in the script header.",
  "",
].join("\n");

writeFileSync(REPORT, body, "utf8");
console.log("OK_RG_N_SAFETY", `hits=${lines.length}`, `report=${REPORT}`);
