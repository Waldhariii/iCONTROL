import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { getReportsDir, assertNoPlatformReportsPath } from "../ci/test-utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_DIR = process.env.RUNTIME_DIR || join(SSOT_DIR, "..", "runtime");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportsDir = getReportsDir();
assertNoPlatformReportsPath(reportsDir);
const outDir = join(reportsDir, "evidence", ts);
assertNoPlatformReportsPath(outDir);
mkdirSync(outDir, { recursive: true });
const opsDir = join(process.cwd(), "runtime", "ops");

function copyIfExists(src, dest) {
  if (existsSync(src)) copyFileSync(src, dest);
}

const tags = execSync("git tag --list", { encoding: "utf-8" }).trim();
writeFileSync(join(outDir, "tags.txt"), tags + "\n", "utf-8");
const head = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
writeFileSync(join(outDir, "HEAD.txt"), head + "\n", "utf-8");

copyIfExists(join(reportsDir, "CI_REPORT.md"), join(outDir, "CI_REPORT.md"));
copyIfExists("./governance/gates/gates-report.md", join(outDir, "gates-report.md"));
copyIfExists("./platform/runtime/drift/drift-report.md", join(outDir, "drift-report.md"));

copyIfExists(join(SSOT_DIR, "sre", "slo_definitions.json"), join(outDir, "slo_definitions.json"));
copyIfExists(join(SSOT_DIR, "sre", "error_budget_policies.json"), join(outDir, "error_budget_policies.json"));
copyIfExists(join(SSOT_DIR, "sre", "canary_policies.json"), join(outDir, "canary_policies.json"));
copyIfExists(join(SSOT_DIR, "governance", "change_freeze.json"), join(outDir, "change_freeze.json"));
copyIfExists(join(SSOT_DIR, "governance", "break_glass.json"), join(outDir, "break_glass.json"));
copyIfExists(join(SSOT_DIR, "extensions", "extension_killswitch.json"), join(outDir, "extension_killswitch.json"));

if (existsSync(opsDir)) {
  try {
    const incidentsDir = join(opsDir, "incidents");
    if (existsSync(incidentsDir)) {
      const files = readdirSync(incidentsDir).filter((f) => f.endsWith(".json")).slice(-5);
      for (const f of files) copyIfExists(join(incidentsDir, f), join(outDir, `incident-${f}`));
    }
    const timelineDir = join(opsDir, "timeline");
    if (existsSync(timelineDir)) {
      const files = readdirSync(timelineDir).filter((f) => f.endsWith(".jsonl")).slice(-2);
      for (const f of files) copyIfExists(join(timelineDir, f), join(outDir, `timeline-${f}`));
      const latest = files.slice(-1)[0];
      if (latest) {
        const lines = readFileSync(join(timelineDir, latest), "utf-8").trim().split("\n");
        const events = lines.slice(-10).map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
        const summary = events.map((e) => `- ${e.timestamp} ${e.action} ${e.result || ""}`).join("\n");
        writeFileSync(join(outDir, "ops_summary.md"), summary + "\n", "utf-8");
      }
    }
  } catch {
    // ignore ops evidence copy errors
  }
}

const activePath = join(SSOT_DIR, "changes", "active_release.json");
if (existsSync(activePath)) {
  const active = JSON.parse(readFileSync(activePath, "utf-8"));
  const releaseId = active.active_release_id;
  if (releaseId) {
    const checksums = join(RUNTIME_DIR, "manifests", `checksums.${releaseId}.json`);
    copyIfExists(checksums, join(outDir, `checksums.${releaseId}.json`));
  }
}

try {
  const releaseDir = "./platform/runtime/release";
  if (existsSync(releaseDir)) {
    const rollbacks = readdirSync(releaseDir).filter((f) => f.startsWith("rollback.") && f.endsWith(".json")).slice(-3);
    for (const f of rollbacks) copyIfExists(join(releaseDir, f), join(outDir, f));
  }
} catch {
  // ignore
}

const summary = [
  `Evidence pack ${ts}`,
  `HEAD: ${head}`,
  `Tags: ${tags.split("\n").slice(-5).join(", ")}`
];
writeFileSync(join(outDir, "SUMMARY.md"), summary.join("\n") + "\n", "utf-8");

console.log(`Evidence pack generated: ${outDir}`);
