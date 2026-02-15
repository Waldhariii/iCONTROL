import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

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
const reportDir = join(process.cwd(), "runtime", "reports");
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, `CHAOS_REPORT_${ts}.md`);

const lines = [
  `# Chaos Report ${ts}`,
  `Mode: ${safe ? "SAFE" : "RUN"}`,
  `Faults: ${faults.join(", ")}`
];

writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
console.log(`Chaos report written: ${reportPath}`);
