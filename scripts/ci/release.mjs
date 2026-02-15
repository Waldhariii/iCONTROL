import { applyChangeset } from "../../platform/runtime/changes/patch-engine.mjs";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createReleaseCandidate, compileSignedManifest, rollout, activate, rollback, sloCheck } from "../../platform/runtime/release/orchestrator.mjs";

const args = process.argv.slice(2);
const changesetId = args[args.indexOf("--from-changeset") + 1];
const env = args[args.indexOf("--env") + 1] || "dev";
const strategy = args[args.indexOf("--strategy") + 1] || "canary";
const ssotDir = process.env.SSOT_DIR || "./platform/ssot";
const manifestsDir = process.env.MANIFESTS_DIR;
if (manifestsDir && !process.env.OUT_DIR) process.env.OUT_DIR = manifestsDir;

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
const activeCsId = `cs-active-release-${releaseId}`;
const changesetsDir = join(ssotDir, "changes/changesets");
mkdirSync(changesetsDir, { recursive: true });
const activeCsPath = join(changesetsDir, `${activeCsId}.json`);
if (!existsSync(activeCsPath)) {
  const cs = {
    id: activeCsId,
    status: "draft",
    created_by: "release",
    created_at: new Date().toISOString(),
    scope: "global",
    ops: [
      {
        op: "update",
        target: { kind: "active_release", ref: "active_release" },
        value: { active_release_id: releaseId, active_env: env, updated_at: new Date().toISOString(), updated_by: "release" },
        preconditions: { expected_exists: true }
      }
    ]
  };
  writeFileSync(activeCsPath, JSON.stringify(cs, null, 2));
}
applyChangeset(activeCsId);
console.log(`Release complete: ${releaseId}`);
