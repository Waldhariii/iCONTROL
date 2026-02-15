import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT_FORBIDDEN_FILES = [
  "CI_REPORT.md"
];
const ROOT_FORBIDDEN_EXTS = [".log", ".tmp"];
const ROOT_FORBIDDEN_PREFIXES = [
  "platform_manifest.",
  "route_catalog.",
  "theme_manifest.",
  "guards.",
  "render_graph.",
  "datasource_contracts.",
  "workflow_dags.",
  "checksums.",
  "compat_matrix."
];

function assertNoRootGeneratedFiles(when) {
  const entries = readdirSync(".");
  const offenders = [];
  for (const name of entries) {
    const st = statSync(name);
    if (st.isDirectory()) continue;
    if (ROOT_FORBIDDEN_FILES.includes(name)) offenders.push(name);
    if (ROOT_FORBIDDEN_EXTS.some((ext) => name.endsWith(ext))) offenders.push(name);
    if (ROOT_FORBIDDEN_PREFIXES.some((p) => name.startsWith(p))) offenders.push(name);
  }
  if (offenders.length) {
    throw new Error(`[${when}] Root generated files detected: ${offenders.join(", ")}`);
  }
}

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
  "node scripts/ci/test-governance-authz.mjs",
  "node scripts/ci/test-quorum.mjs",
  "node scripts/ci/test-break-glass.mjs",
  "node scripts/ci/test-freeze-mode.mjs",
  "node scripts/ci/test-finops-gates.mjs",
  "node scripts/ci/test-qos-rate-limit.mjs",
  "node scripts/ci/test-qos-concurrency.mjs",
  "node scripts/ci/test-qos-priority.mjs",
  "node scripts/ci/test-qos-circuit-breaker.mjs",
  "node scripts/ci/test-qos-budgets.mjs",
  "node scripts/ci/test-token-gate.mjs",
  "node scripts/ci/test-audit.mjs"
];

assertNoRootGeneratedFiles("pre-run");

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
if (existsSync("CI_REPORT.md")) throw new Error("CI_REPORT.md must not exist at repo root (pre-run)");
const reportPath = path.join(process.cwd(), "runtime", "reports", "CI_REPORT.md");
mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, md + "\n");
if (existsSync("CI_REPORT.md")) throw new Error("CI_REPORT.md must not exist at repo root (post-run)");
if (!existsSync(reportPath)) throw new Error("CI report missing at runtime/reports/CI_REPORT.md");
assertNoRootGeneratedFiles("post-run");
console.log(`CI report written: ${reportPath}`);
