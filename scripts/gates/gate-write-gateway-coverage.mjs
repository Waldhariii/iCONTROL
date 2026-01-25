#!/usr/bin/env node
/**
 * Gate (report-only): Write Gateway coverage heuristic.
 * Scans for write-like calls outside the gateway to guide migration.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = process.cwd();
const REPORT = resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md");

const TARGETS = [
  "app/src/core",
  "modules",
];

const EXCLUDES = [
  "app/src/core/write-gateway",
];

const PATTERN = String.raw`\\b(save|write)[A-Za-z0-9_]*\\s*\\(|localStorage\\.setItem\\s*\\(|sessionStorage\\.setItem\\s*\\(`;

function runRg() {
  const args = [
    "-n",
    "--no-heading",
    "--color",
    "never",
    PATTERN,
    ...TARGETS,
    ...EXCLUDES.map((p) => `-g!${p}/**`),
  ];
  const cmd = `rg ${args.map((a) => `"${a}"`).join(" ")}`;
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    // rg exits 1 when no matches; still valid for report
    return (e.stdout || "").toString();
  }
}

const hits = runRg().trim();
const lines = hits ? hits.split("\n") : [];

const body = [
  "# Write Gateway Coverage Report (heuristic)",
  "",
  `- Date: ${new Date().toISOString()}`,
  `- Targets: ${TARGETS.map((t) => `\`${t}\``).join(", ")}`,
  `- Excludes: ${EXCLUDES.map((t) => `\`${t}\``).join(", ")}`,
  `- Pattern: \`${PATTERN}\``,
  `- Hits: ${lines.length}`,
  "",
  "## Findings (first 200)",
  "",
  lines.length
    ? "```txt\n" + lines.slice(0, 200).join("\n") + "\n```"
    : "_No matches._",
  "",
  "## Notes",
  "- Report-only: does not block commits.",
  "- Heuristic may include false positives; migrate to WriteGateway as you touch these paths.",
  "",
].join("\n");

mkdirSync(resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS"), { recursive: true });
writeFileSync(REPORT, body, "utf8");

console.log(`OK: report generated at ${relative(ROOT, REPORT)}`);
