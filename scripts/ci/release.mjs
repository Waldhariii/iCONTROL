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

rollout(releaseId, strategy);

const ok = sloCheck(releaseId);
if (!ok) {
  rollback(releaseId, "SLO synthetic failure");
  process.exit(2);
}

activate(releaseId, "global");
console.log(`Release complete: ${releaseId}`);
