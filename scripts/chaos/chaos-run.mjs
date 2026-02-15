import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getReportsDir, assertNoPlatformReportsPath, rotateReports } from "../ci/test-utils.mjs";

const args = process.argv.slice(2);
const safe = args.includes("--safe");
const run = args.includes("--run");

if (!safe && !run) {
  console.error("Chaos run requires --safe or --run");
  process.exit(1);
}

const faultsDir = join(process.cwd(), "scripts", "chaos", "faults");
const faults = readdirSync(faultsDir).filter((f) => f.endsWith(".mjs"));
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = getReportsDir();
assertNoPlatformReportsPath(reportDir);
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, `CHAOS_REPORT_${ts}.md`);
assertNoPlatformReportsPath(reportPath);

const lines = [
  `# Chaos Report ${ts}`,
  `Mode: ${safe ? "SAFE" : "RUN"}`,
  `Faults: ${faults.join(", ")}`
];

writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
const removed = rotateReports({ prefix: "CHAOS_REPORT_", keep: 10, dir: reportDir });
if (removed) console.log(`Chaos report rotation: removed ${removed}`);
console.log(`Chaos report written: ${reportPath}`);
