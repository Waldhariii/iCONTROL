import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { getReportsDir, assertNoPlatformReportsPath } from "./test-utils.mjs";

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
  "node scripts/ci/test-diff-engine-smoke.mjs",
  "node scripts/ci/test-studio-preview-flow.mjs",
  "node scripts/ci/test-render-graph-v2-smoke.mjs",
  "node scripts/ci/test-studio-designer-flow-min.mjs",
  "node scripts/ci/test-designer-sections-tabs-flow.mjs",
  "node scripts/ci/test-designer-widget-binding-action.mjs",
  "node scripts/ci/test-business-docs-modules-present.mjs",
  "node scripts/ci/test-bizdocs-pages-present.mjs",
  "node scripts/ci/test-bizdocs-actions-workflows.mjs",
  "node scripts/ci/test-workflow-runner-dryrun.mjs",
  "node scripts/ci/test-workflow-execute-localfs.mjs",
  "node scripts/ci/test-cp-cockpit-smoke.mjs",
  "node scripts/ci/test-pdf-export-action-policy.mjs",
  "node scripts/ci/test-manifest-determinism.mjs",
  "node scripts/ci/test-diff-noise-gate.mjs",
  "node scripts/ci/test-freeze-designer-blocks-apply.mjs",
  "node scripts/ci/test-no-tabs-routes.mjs",
  "node scripts/ci/test-delete-flow.mjs",
  "node scripts/ci/test-cp-strict.mjs",
  "node scripts/ci/test-client-loader.mjs",
  "node scripts/ci/test-client-render.mjs",
  "node scripts/ci/test-client-surface-filter.mjs",
  "node scripts/ci/test-entitlement-block.mjs",
  "node scripts/ci/test-domain-widgets-safe.mjs",
  "node scripts/ci/test-module-activation-jobs.mjs",
  "node scripts/ci/test-module-activation-documents.mjs",
  "node scripts/ci/test-module-activation-billing.mjs",
  "node scripts/ci/test-module-isolation.mjs",
  "node scripts/ci/test-module-datagov-coverage.mjs",
  "node scripts/ci/test-tabs-as-sections.mjs",
  "node scripts/ci/test-widget-binding-gate.mjs",
  "node scripts/ci/test-module-pages-rendergraph.mjs",
  "node scripts/ci/test-demo-modules-smoke.mjs",
  "node scripts/ci/test-studio-modules-preview-isolation.mjs",
  "node scripts/ci/test-studio-modules-flow.mjs",
  "node scripts/ci/test-studio-modules-deactivate.mjs",
  "node scripts/ci/test-marketplace-catalog.mjs",
  "node scripts/ci/test-template-integrity-gate.mjs",
  "node scripts/ci/test-marketplace-install-module.mjs",
  "node scripts/ci/test-marketplace-install-extension.mjs",
  "node scripts/ci/test-marketplace-plan-block.mjs",
  "node scripts/ci/test-marketplace-impact-report.mjs",
  "node scripts/ci/test-marketplace-latest-approved.mjs",
  "node scripts/ci/test-marketplace-preflight.mjs",
  "node scripts/ci/test-observability-correlation.mjs",
  "node scripts/ci/test-report-path-guard.mjs",
  "node scripts/ci/test-core-change-gate.mjs",
  "node scripts/ci/test-artifact-budget-gate.mjs",
  "node scripts/ci/test-preview-isolation.mjs",
  "node scripts/ci/test-active-release-stability.mjs",
  "node scripts/ci/test-active-release-ssot.mjs",
  "node scripts/ci/test-cp-down-client-works.mjs",
  "node scripts/ci/test-governance-authz.mjs",
  "node scripts/ci/test-quorum.mjs",
  "node scripts/ci/test-break-glass.mjs",
  "node scripts/ci/test-ops-runbook-dryrun.mjs",
  "node scripts/ci/test-ops-runbook-quorum-required.mjs",
  "node scripts/ci/test-ops-breakglass-override.mjs",
  "node scripts/ci/test-ops-evidence-pack.mjs",
  "node scripts/ci/test-runbook-promote-pack-temp.mjs",
  "node scripts/ci/test-runbook-rollback-temp.mjs",
  "node scripts/ci/test-runbook-freeze-respected.mjs",
  "node scripts/ci/test-script-catalog-gate.mjs",
  "node scripts/ci/test-freeze-mode.mjs",
  "node scripts/ci/test-finops-gates.mjs",
  "node scripts/ci/test-billing-dormant-blocks-publish.mjs",
  "node scripts/ci/test-billing-compute-invoice.mjs",
  "node scripts/ci/test-billing-webhook-disabled.mjs",
  "node scripts/ci/test-rating-integrity.mjs",
  "node scripts/ci/test-qos-rate-limit.mjs",
  "node scripts/ci/test-qos-concurrency.mjs",
  "node scripts/ci/test-qos-priority.mjs",
  "node scripts/ci/test-qos-circuit-breaker.mjs",
  "node scripts/ci/test-qos-budgets.mjs",
  "node scripts/ci/test-extensions-signature.mjs",
  "node scripts/ci/test-extensions-installation.mjs",
  "node scripts/ci/test-extensions-permissions.mjs",
  "node scripts/ci/test-extensions-killswitch.mjs",
  "node scripts/ci/test-datagov-classification.mjs",
  "node scripts/ci/test-datagov-export-masking.mjs",
  "node scripts/ci/test-datagov-legal-hold.mjs",
  "node scripts/ci/test-datagov-retention-runner.mjs",
  "node scripts/ci/test-integration-inbound-signature.mjs",
  "node scripts/ci/test-webhook-replay.mjs",
  "node scripts/ci/test-webhook-valid-signed.mjs",
  "node scripts/ci/test-s2s-deny-without-auth.mjs",
  "node scripts/ci/test-s2s-hmac-allow.mjs",
  "node scripts/ci/test-token-exchange-issue-and-use.mjs",
  "node scripts/ci/test-s2s-scope-enforcement.mjs",
  "node scripts/ci/test-s2s-mtls-stub.mjs",
  "node scripts/ci/test-integration-outbound-masking.mjs",
  "node scripts/ci/test-integration-retry-dlq.mjs",
  "node scripts/ci/test-integration-secretref-scan.mjs",
  "node scripts/ci/test-slo-config.mjs",
  "node scripts/ci/test-canary-analyzer.mjs",
  "node scripts/ci/test-restore-drill-smoke.mjs",
  "node scripts/ci/test-evidence-pack.mjs",
  "node scripts/ci/test-evidence-pack-contains-observability.mjs",
  "node scripts/ci/test-rotation-runner.mjs",
  "node scripts/ci/test-chaos-smoke.mjs",
  "node scripts/ci/test-compat-diff.mjs",
  "node scripts/ci/test-migration-dryrun.mjs",
  "node scripts/ci/test-deprecation-policy.mjs",
  "node scripts/ci/test-contract-backcompat-smoke.mjs",
  "node scripts/ci/test-tenant-factory-dryrun.mjs",
  "node scripts/ci/test-tenant-factory-apply.mjs",
  "node scripts/ci/test-tenant-factory-quorum.mjs",
  "node scripts/ci/test-tenant-factory-audit.mjs",
  "node scripts/ci/test-release-pack-export.mjs",
  "node scripts/ci/test-release-pack-import-staging.mjs",
  "node scripts/ci/test-release-pack-activate-temp.mjs",
  "node scripts/ci/test-dr-drill-from-pack-smoke.mjs",
  "node scripts/ci/test-airgap-verify.mjs",
  "node scripts/maintenance/bootstrap.mjs --ci-safe",
  "node scripts/ci/test-token-gate.mjs",
  "node scripts/ci/test-design-freeze-gate.mjs",
  "node scripts/ci/test-theme-vars-present-in-pack.mjs",
  "node scripts/ci/test-theme-switch-preview.mjs",
  "node scripts/ci/test-density-compact.mjs",
  "node scripts/ci/test-audit.mjs",
  "node scripts/ci/test-no-secrets-evidence.mjs"
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
const reportPath = path.join(getReportsDir(), "CI_REPORT.md");
assertNoPlatformReportsPath(reportPath);
mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, md + "\n");
if (existsSync("CI_REPORT.md")) throw new Error("CI_REPORT.md must not exist at repo root (post-run)");
if (!existsSync(reportPath)) throw new Error("CI report missing at runtime/reports/CI_REPORT.md");
assertNoRootGeneratedFiles("post-run");
console.log(`CI report written: ${reportPath}`);
