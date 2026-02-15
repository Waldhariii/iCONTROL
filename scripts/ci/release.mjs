import { applyChangeset } from "../../platform/runtime/changes/patch-engine.mjs";
import { createReleaseCandidate, compileSignedManifest, rollout, activate, rollback, sloCheck } from "../../platform/runtime/release/orchestrator.mjs";

const args = process.argv.slice(2);
const changesetId = args[args.indexOf("--from-changeset") + 1];
const env = args[args.indexOf("--env") + 1] || "dev";
const strategy = args[args.indexOf("--strategy") + 1] || "canary";

if (!changesetId) {
  console.error("Missing --from-changeset <id>");
  process.exit(1);
}

applyChangeset(changesetId);
const releaseId = createReleaseCandidate(changesetId);
compileSignedManifest(releaseId, env);
const gatesOk = sloCheck(releaseId);
if (!gatesOk) {
  rollback(releaseId, "Gates/SLO failed pre-rollout");
  process.exit(2);
}

const rolloutResult = rollout(releaseId, strategy);
if (rolloutResult.decision === "fail") {
  rollback(releaseId, "Canary analysis failed");
  process.exit(2);
}
if (rolloutResult.decision === "warn") {
  console.error("Canary analysis WARN: hold for quorum");
  process.exit(3);
}

const ok = sloCheck(releaseId);
if (!ok) {
  rollback(releaseId, "SLO synthetic failure");
  process.exit(2);
}

activate(releaseId, "global");
console.log(`Release complete: ${releaseId}`);
