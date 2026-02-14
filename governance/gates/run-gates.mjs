import { writeFileSync } from "fs";
import {
  schemaGate,
  collisionGate,
  orphanGate,
  policyGate,
  tokenGate,
  accessGate,
  perfBudgetGate,
  isolationGate,
  driftGate
} from "./gates.mjs";

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

const ssotDir = "./platform/ssot";
const manifestsDir = "./runtime/manifests";

const gates = [
  () => schemaGate({ ssotDir, manifestsDir, releaseId }),
  () => collisionGate({ ssotDir, manifestsDir, releaseId }),
  () => orphanGate({ ssotDir, manifestsDir, releaseId }),
  () => policyGate({ manifestsDir, releaseId }),
  () => accessGate({ ssotDir }),
  () => tokenGate({ ssotDir }),
  () => perfBudgetGate({ ssotDir }),
  () => isolationGate({ ssotDir, manifestsDir, releaseId }),
  () => driftGate({ manifestsDir, releaseId })
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
