import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  schemaGate,
  collisionGate,
  orphanGate,
  policyGate,
  tokenGate,
  tokenNoHardcodeGate,
  themeArtifactGate,
  accessGate,
  quotaGate,
  planIntegrityGate,
  qosConfigGate,
  noisyNeighborGate,
  extensionPermissionGate,
  extensionIsolationGate,
  extensionReviewGate,
  extensionSignatureGate,
  dataCatalogGate,
  retentionPolicyGate,
  exportControlGate,
  connectorConfigGate,
  webhookSecurityGate,
  webhookNoWeakSigGate,
  secretRefGate,
  rotationIntegrityGate,
  s2sTransportGate,
  replayProtectionGate,
  egressGovernanceGate,
  retryDlqGate,
  sloGate,
  canaryGate,
  drillGate,
  chaosGate,
  perfBudgetGate,
  isolationGate,
  driftGate,
  noFallbackGate,
  governanceGate,
  freezeGate,
  designFreezeGate,
  freezeScopeGate,
  quorumGate,
  opsPolicyGate,
  runbookIntegrityGate,
  breakGlassGate,
  compatibilityGate,
  deprecationGate,
  migrationGate,
  contractTestGate,
  semverGate,
  tenantTemplateGate,
  templateIntegrityGate,
  tenantFactoryGate,
  domainIsolationGate,
  moduleActivationGate,
  modulePageOwnershipGate,
  dataGovCoverageGate,
  budgetCoverageGate,
  moduleAuthoringGate,
  activationSafetyGate,
  marketplacePermissionGate,
  marketplacePlanGate,
  marketplaceImpactGate,
  marketplaceCompatGate,
  billingDormantGate,
  ratingIntegrityGate,
  invoiceNoSecretsGate,
  noSecretsEvidenceGate,
  coreChangeGate,
  reportPathGate,
  scriptCatalogGate,
  artifactBudgetGate,
  widgetBindingGate,
  sectionNoRouteGate,
  pageGraphGate,
  widgetIsolationGate,
  bindingGate,
  actionPolicyGate,
  manifestFingerprintGate
} from "./gates.mjs";

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

const ssotDir = process.env.SSOT_DIR || "./platform/ssot";
const manifestsDir = process.env.MANIFESTS_DIR || "./runtime/manifests";

const gates = [
  () => schemaGate({ ssotDir, manifestsDir, releaseId }),
  () => collisionGate({ ssotDir, manifestsDir, releaseId }),
  () => orphanGate({ ssotDir, manifestsDir, releaseId }),
  () => policyGate({ manifestsDir, releaseId }),
  () => accessGate({ ssotDir }),
  () => quotaGate({ ssotDir }),
  () => planIntegrityGate({ ssotDir }),
  () => qosConfigGate({ ssotDir }),
  () => noisyNeighborGate({ ssotDir }),
  () => extensionPermissionGate({ ssotDir }),
  () => extensionIsolationGate({ ssotDir }),
  () => extensionReviewGate({ ssotDir }),
  () => extensionSignatureGate({ ssotDir, manifestsDir }),
  () => dataCatalogGate({ ssotDir }),
  () => retentionPolicyGate({ ssotDir }),
  () => exportControlGate({ ssotDir }),
  () => connectorConfigGate({ ssotDir }),
  () => webhookSecurityGate({ ssotDir }),
  () => webhookNoWeakSigGate({ ssotDir }),
  () => secretRefGate({ ssotDir }),
  () => rotationIntegrityGate({ ssotDir }),
  () => s2sTransportGate({ ssotDir }),
  () => replayProtectionGate({ ssotDir }),
  () => egressGovernanceGate({ ssotDir }),
  () => retryDlqGate({ ssotDir }),
  () => sloGate({ ssotDir }),
  () => canaryGate({ ssotDir }),
  () => drillGate(),
  () => chaosGate(),
  () => tokenGate({ ssotDir, releaseId, manifestsDir }),
  () => tokenNoHardcodeGate(),
  () => themeArtifactGate({ releaseId, manifestsDir }),
  () => perfBudgetGate({ ssotDir }),
  () => isolationGate({ ssotDir, manifestsDir, releaseId }),
  () => driftGate({ manifestsDir, releaseId }),
  () => noFallbackGate(),
  () => governanceGate({ ssotDir }),
  () => freezeGate({ ssotDir }),
  () => designFreezeGate({ ssotDir }),
  () => freezeScopeGate({ ssotDir }),
  () => quorumGate({ ssotDir }),
  () => opsPolicyGate({ ssotDir }),
  () => runbookIntegrityGate({ ssotDir }),
  () => breakGlassGate({ ssotDir }),
  () => semverGate({ ssotDir, manifestsDir, releaseId }),
  () => compatibilityGate({ ssotDir }),
  () => deprecationGate({ ssotDir }),
  () => migrationGate({ ssotDir }),
  () => contractTestGate({ ssotDir }),
  () => tenantTemplateGate({ ssotDir }),
  () => templateIntegrityGate({ ssotDir }),
  () => tenantFactoryGate({ ssotDir }),
  () => domainIsolationGate({ ssotDir }),
  () => dataGovCoverageGate({ ssotDir }),
  () => budgetCoverageGate({ ssotDir }),
  () => moduleActivationGate({ ssotDir, manifestsDir, releaseId }),
  () => modulePageOwnershipGate({ ssotDir }),
  () => moduleAuthoringGate({ ssotDir }),
  () => activationSafetyGate({ ssotDir }),
  () => marketplacePermissionGate({ ssotDir }),
  () => marketplacePlanGate({ ssotDir }),
  () => marketplaceImpactGate({ ssotDir }),
  () => marketplaceCompatGate({ ssotDir }),
  () => billingDormantGate({ ssotDir }),
  () => ratingIntegrityGate({ ssotDir }),
  () => invoiceNoSecretsGate(),
  () => noSecretsEvidenceGate(),
  () => coreChangeGate(),
  () => reportPathGate(),
  () => scriptCatalogGate(),
  () => widgetBindingGate({ ssotDir }),
  () => sectionNoRouteGate({ ssotDir }),
  () => pageGraphGate({ manifestsDir, releaseId }),
  () => widgetIsolationGate({ ssotDir }),
  () => bindingGate({ ssotDir }),
  () => actionPolicyGate({ ssotDir }),
  () => manifestFingerprintGate({ manifestsDir, releaseId }),
  () => artifactBudgetGate()
];

function slugifyGate(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseObjects(gateName, details) {
  const out = [];
  const text = String(details || "");
  if (!text) return out;
  if (gateName === "Orphan Gate") {
    const routes = text.match(/Orphan routes:\s*([^|]+)/i);
    if (routes && routes[1]) {
      for (const id of routes[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        out.push({ kind: "route_spec", id, path: `studio/routes/${id}` });
      }
    }
    const widgets = text.match(/Orphan widgets:\s*([^|]+)/i);
    if (widgets && widgets[1]) {
      for (const id of widgets[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        out.push({ kind: "widget_instance", id, path: `studio/widgets/${id}` });
      }
    }
  }
  if (gateName === "Policy Gate") {
    const routes = text.match(/Routes without guard:\s*([^|]+)/i);
    if (routes && routes[1]) {
      for (const id of routes[1].split(",").map((s) => s.trim()).filter(Boolean)) {
        out.push({ kind: "route_spec", id, path: `studio/routes/${id}`, field: "guard_pack_id" });
      }
    }
  }
  if (gateName === "Template Integrity Gate") {
    const m = text.match(/template_id=([^ ]+)\s+base_plan_id=([^ ]+)\s+offenders=([^|]+)/i);
    if (m) {
      out.push({ kind: "tenant_template", id: m[1], field: "module_activations_default" });
      const offenders = m[3].split(",").map((s) => s.trim()).filter(Boolean);
      for (const off of offenders) {
        const id = off.split("(")[0];
        out.push({ kind: "domain_module", id, field: "tier" });
      }
    }
  }
  return out;
}

function normalizeGateResult(r, ctx) {
  const gateId = slugifyGate(r.gate);
  const severity = r.ok ? "info" : "error";
  const message = r.details || (r.ok ? "ok" : "failed");
  const objects = parseObjects(r.gate, r.details);
  const remediation = { steps: [], links: [] };
  if (!r.ok && r.gate === "Policy Gate") remediation.steps.push("Assign guard_pack_id for all routes.");
  if (!r.ok && r.gate === "Orphan Gate") remediation.steps.push("Remove or fix orphan routes/widgets.");
  if (!r.ok && r.gate === "Template Integrity Gate") remediation.steps.push("Disable pro modules on free templates or upgrade plan.");
  return {
    gate_id: gateId,
    gate_name: r.gate,
    severity,
    message,
    objects,
    remediation,
    correlation_id: ctx.correlation_id
  };
}

function writeGateIndex(entry) {
  const reportsDir = join(process.cwd(), "runtime", "reports");
  const idxDir = join(reportsDir, "index");
  mkdirSync(idxDir, { recursive: true });
  appendFileSync(join(idxDir, "gates_latest.jsonl"), JSON.stringify(entry) + "\n", "utf-8");
}

const results = [];
for (const gate of gates) {
  const r = gate();
  results.push(r);
  if (!r.ok) break;
}

const ok = results.every((r) => r.ok);
const reportMd = results.map((r) => `${r.ok ? "PASS" : "FAIL"} - ${r.gate}${r.details ? ": " + r.details : ""}`).join("\n");
const scope = process.env.GATE_SCOPE || "active";
const correlationId = process.env.CORRELATION_ID || randomUUID();
const normalized = results.map((r) => normalizeGateResult(r, { correlation_id: correlationId }));
const reportJson = {
  release_id: releaseId,
  scope,
  correlation_id: correlationId,
  ok,
  generated_at: new Date().toISOString(),
  results: normalized
};

writeFileSync("./governance/gates/gates-report.md", reportMd + "\n", "utf-8");
writeFileSync("./governance/gates/gates-report.json", JSON.stringify(reportJson, null, 2) + "\n", "utf-8");
const reportsDir = join(process.cwd(), "runtime", "reports");
const gatesDir = join(reportsDir, "gates");
mkdirSync(gatesDir, { recursive: true });
const gatePath = join(gatesDir, `gates_${scope}_${releaseId}.json`);
writeFileSync(gatePath, JSON.stringify(reportJson, null, 2) + "\n", "utf-8");
writeGateIndex({
  ts: new Date().toISOString(),
  release_id: releaseId,
  scope,
  correlation_id: correlationId,
  ok,
  path: gatePath
});

console.log(reportMd);
if (!ok) process.exit(2);
