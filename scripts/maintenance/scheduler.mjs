/**
 * Phase AS: Autonomous scheduler — one-shot deep-clean, evidence pack, optional gates.
 * Outputs under runtime/reports only (scheduler/, index/scheduler_latest.jsonl).
 */
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "runtime", "reports");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const correlationId = `scheduler-${ts}`;
const reportDir = join(REPORTS_DIR, "scheduler");
const reportPath = join(reportDir, `SCHEDULER_RUN_${ts}.md`);
const indexPath = join(REPORTS_DIR, "index", "scheduler_latest.jsonl");

mkdirSync(reportDir, { recursive: true });
mkdirSync(join(REPORTS_DIR, "index"), { recursive: true });

const lines = [];
const steps = [];

function run(name, fn) {
  const start = Date.now();
  try {
    fn();
    steps.push({ step: name, ok: true, ms: Date.now() - start });
    lines.push(`- ${name}: OK (${Date.now() - start}ms)`);
  } catch (err) {
    steps.push({ step: name, ok: false, error: String(err && err.message), ms: Date.now() - start });
    lines.push(`- ${name}: FAIL — ${err && err.message}`);
  }
}

run("deep_clean_cap_only", () => {
  execSync("CAP_ONLY=1 APPLY=0 scripts/maintenance/deep-clean-v5.sh", {
    stdio: "pipe",
    cwd: ROOT,
    encoding: "utf-8"
  });
});

run("evidence_pack", () => {
  execSync("node scripts/maintenance/generate-evidence-pack.mjs", {
    stdio: "pipe",
    cwd: ROOT,
    encoding: "utf-8"
  });
});

const runGates = process.env.SCHEDULER_RUN_GATES === "1";
if (runGates) {
  run("gates", () => {
    const releaseId = process.env.RELEASE_ID || "dev-001";
    execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
      stdio: "pipe",
      cwd: ROOT,
      encoding: "utf-8"
    });
  });
}

const md = [
  "# Scheduler Run",
  "",
  `correlation_id: ${correlationId}`,
  `at: ${new Date().toISOString()}`,
  "",
  "## Steps",
  ...lines
].join("\n");
writeFileSync(reportPath, md, "utf-8");

const indexLine = JSON.stringify({
  ts: new Date().toISOString(),
  correlation_id: correlationId,
  report_path: reportPath.replace(ROOT + "/", ""),
  steps: steps.map((s) => ({ step: s.step, ok: s.ok })),
  all_ok: steps.every((s) => s.ok)
}) + "\n";
appendFileSync(indexPath, indexLine, "utf-8");

if (!steps.every((s) => s.ok)) {
  process.exitCode = 1;
}
console.log("Scheduler run written to", reportPath);
