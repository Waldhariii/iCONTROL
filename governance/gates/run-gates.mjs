import { writeFileSync } from "fs";
import {
  schemaGate,
  collisionGate,
  orphanGate,
  policyGate,
  tokenGate,
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
  reportPathGate,
  scriptCatalogGate
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
  () => perfBudgetGate({ ssotDir }),
  () => isolationGate({ ssotDir, manifestsDir, releaseId }),
  () => driftGate({ manifestsDir, releaseId }),
  () => noFallbackGate(),
  () => governanceGate({ ssotDir }),
  () => freezeGate({ ssotDir }),
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
  () => reportPathGate(),
  () => scriptCatalogGate()
];

const results = [];
for (const gate of gates) {
  const r = gate();
  results.push(r);
  if (!r.ok) break;
}

const ok = results.every((r) => r.ok);
const reportMd = results.map((r) => `${r.ok ? "PASS" : "FAIL"} - ${r.gate}${r.details ? ": " + r.details : ""}`).join("\n");
const reportJson = { release_id: releaseId, ok, results };

writeFileSync("./governance/gates/gates-report.md", reportMd + "\n", "utf-8");
writeFileSync("./governance/gates/gates-report.json", JSON.stringify(reportJson, null, 2) + "\n", "utf-8");

console.log(reportMd);
if (!ok) process.exit(2);
