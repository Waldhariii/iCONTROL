/**
 * Phase AL: Release promote + rollback smoke — hermetic PORT=0, S2S, verify reports + index.
 */
import { execSync } from "child_process";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const manifestsDir = join(process.cwd(), "runtime", "manifests");
  const reportsDir = join(process.cwd(), "runtime", "reports");

  execSync("node scripts/ci/compile.mjs rel-al-A dev", {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: manifestsDir }
  });
  execSync("node scripts/ci/compile.mjs rel-al-B dev", {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: manifestsDir }
  });
  writeFileSync(
    join(temp.ssotDir, "changes", "active_release.json"),
    JSON.stringify({ active_release_id: "rel-al-A", active_env: "dev", updated_at: new Date().toISOString(), updated_by: "ci" }, null, 2) + "\n"
  );

  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  const api = `${baseUrl}/api`;
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["release.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };

  const corrPromote = `promote-${Date.now()}`;
  const resPromote = await fetch(`${api}/release/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ from: "rel-al-A", to: "rel-al-B", correlation_id: corrPromote })
  });
  if (resPromote.status !== 200) throw new Error(`promote status ${resPromote.status}: ${await resPromote.text()}`);
  const promoteReportDir = join(reportsDir, "releases", corrPromote);
  if (!existsSync(promoteReportDir)) throw new Error(`missing report dir ${promoteReportDir}`);
  if (!existsSync(join(promoteReportDir, "PROMOTE_REPORT.json"))) throw new Error("missing PROMOTE_REPORT.json");
  if (!existsSync(join(promoteReportDir, "PROMOTE_REPORT.md"))) throw new Error("missing PROMOTE_REPORT.md");
  const promoteReport = JSON.parse(readFileSync(join(promoteReportDir, "PROMOTE_REPORT.json"), "utf-8"));
  if (promoteReport.correlation_id !== corrPromote || promoteReport.to !== "rel-al-B") throw new Error("promote report mismatch");

  const indexPath = join(reportsDir, "index", "releases_latest.jsonl");
  if (!existsSync(indexPath)) throw new Error("missing releases_latest.jsonl");
  let indexLines = readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean);
  const lastAfterPromote = indexLines.length ? JSON.parse(indexLines[indexLines.length - 1]) : null;
  if (!lastAfterPromote || lastAfterPromote.action !== "promote" || lastAfterPromote.to !== "rel-al-B") throw new Error("index promote entry mismatch");

  const corrRollback = `rollback-${Date.now()}`;
  const resRollback = await fetch(`${api}/release/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ to: "rel-al-A", reason: "smoke test", correlation_id: corrRollback })
  });
  if (resRollback.status !== 200) throw new Error(`rollback status ${resRollback.status}: ${await resRollback.text()}`);
  const rollbackReportDir = join(reportsDir, "releases", corrRollback);
  if (!existsSync(rollbackReportDir)) throw new Error(`missing rollback report dir ${rollbackReportDir}`);
  if (!existsSync(join(rollbackReportDir, "ROLLBACK_REPORT.json"))) throw new Error("missing ROLLBACK_REPORT.json");
  const rollbackReport = JSON.parse(readFileSync(join(rollbackReportDir, "ROLLBACK_REPORT.json"), "utf-8"));
  if (rollbackReport.correlation_id !== corrRollback || rollbackReport.to !== "rel-al-A") throw new Error("rollback report mismatch");

  indexLines = readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean);
  const lastAfterRollback = indexLines.length ? JSON.parse(indexLines[indexLines.length - 1]) : null;
  if (!lastAfterRollback || lastAfterRollback.action !== "rollback" || lastAfterRollback.to !== "rel-al-A") throw new Error("index rollback entry mismatch");

  killServer(server);
  temp.cleanup();
  console.log("Release promote/rollback smoke PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
