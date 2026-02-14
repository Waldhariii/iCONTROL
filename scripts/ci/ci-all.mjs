import { writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";

const steps = [
  "pnpm install",
  "node scripts/maintenance/generate-keys.mjs",
  "node scripts/maintenance/generate-schemas-index.mjs",
  "node scripts/ci/validate-ssot.mjs",
  "node scripts/ci/compile.mjs dev-001 dev",
  "node scripts/ci/run-gates.mjs dev-001",
  "node scripts/ci/test-gates.mjs",
  "node scripts/ci/test-api.mjs",
  "node scripts/ci/test-studio-flow.mjs",
  "node scripts/ci/test-delete-flow.mjs",
  "node scripts/ci/test-cp-strict.mjs",
  "node scripts/ci/test-client-loader.mjs",
  "node scripts/ci/test-client-render.mjs",
  "node scripts/ci/test-client-surface-filter.mjs",
  "node scripts/ci/test-entitlement-block.mjs",
  "node scripts/ci/test-preview-isolation.mjs",
  "node scripts/ci/test-active-release-stability.mjs",
  "node scripts/ci/test-active-release-ssot.mjs",
  "node scripts/ci/test-cp-down-client-works.mjs",
  "node scripts/ci/test-token-gate.mjs",
  "node scripts/ci/test-audit.mjs"
];

const report = [];
for (const cmd of steps) {
  try {
    execSync(cmd, { stdio: "inherit", env: { ...process.env, STRICT_SCHEMA: "1" } });
    report.push({ cmd, status: "PASS" });
  } catch (err) {
    report.push({ cmd, status: "FAIL" });
    break;
  }
}

const md = report.map((r) => `- ${r.status} ${r.cmd}`).join("\n");
const reportDir = "runtime/reports";
mkdirSync(reportDir, { recursive: true });
const reportPath = `${reportDir}/CI_REPORT.md`;
writeFileSync(reportPath, md + "\n");
if (existsSync("CI_REPORT.md")) {
  throw new Error("CI_REPORT.md must not be written to repo root");
}
console.log(`CI report written: ${reportPath}`);
