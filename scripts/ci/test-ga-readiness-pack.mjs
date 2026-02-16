/**
 * Phase AU: GA Readiness pack — run gates with RUNTIME_HERMETIC_STRICT_PORT=1,
 * require full pass, verify GA_READINESS_REPORT.md and ga_latest.jsonl written and index updated.
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const releaseId = process.argv[2] || "dev-001";
const cwd = process.cwd();

execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
  cwd,
  stdio: "inherit",
  env: { ...process.env, RUNTIME_HERMETIC_STRICT_PORT: "1" }
});

const reportsDir = join(cwd, "runtime", "reports");
const gaReportPath = join(reportsDir, "GA_READINESS_REPORT.md");
const gaIndexPath = join(reportsDir, "index", "ga_latest.jsonl");

if (!existsSync(gaReportPath)) throw new Error("GA_READINESS_REPORT.md missing");
if (!existsSync(gaIndexPath)) throw new Error("ga_latest.jsonl missing");

const lines = readFileSync(gaIndexPath, "utf-8").trim().split("\n").filter(Boolean);
if (!lines.length) throw new Error("ga_latest.jsonl empty");
const last = JSON.parse(lines[lines.length - 1]);
if (last.ok !== true) throw new Error("ga_latest.jsonl last entry ok !== true");

console.log("GA Readiness pack: report and index verified.");
