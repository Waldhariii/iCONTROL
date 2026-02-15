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
  perfBudgetGate,
  isolationGate,
  driftGate,
  noFallbackGate,
  governanceGate,
  freezeGate,
  quorumGate
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
  () => tokenGate({ ssotDir, releaseId, manifestsDir }),
  () => perfBudgetGate({ ssotDir }),
  () => isolationGate({ ssotDir, manifestsDir, releaseId }),
  () => driftGate({ manifestsDir, releaseId }),
  () => noFallbackGate(),
  () => governanceGate({ ssotDir }),
  () => freezeGate({ ssotDir }),
  () => quorumGate({ ssotDir })
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
