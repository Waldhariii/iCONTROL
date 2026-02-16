/**
 * Phase AL: Release promotion — set active release to `to`, write report + index.
 */
import { writeFileSync, mkdirSync, appendFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * @param {{ from: string, to: string, canary_policy_id?: string, correlation_id: string, ssotDir: string, reportsDir: string }} opts
 * @returns {{ ok: boolean, from: string, to: string, correlation_id: string, report_dir: string }}
 */
export function promoteRelease(opts) {
  const { from, to, correlation_id, ssotDir, reportsDir } = opts;
  const reportDir = join(reportsDir, "releases", correlation_id || `promote-${Date.now()}`);
  mkdirSync(reportDir, { recursive: true });

  const activePath = join(ssotDir, "changes", "active_release.json");
  const previous = existsSync(activePath) ? JSON.parse(readFileSync(activePath, "utf-8")) : {};
  const previousId = previous.active_release_id || "";

  const updated = {
    active_release_id: to,
    active_env: previous.active_env || "dev",
    updated_at: new Date().toISOString(),
    updated_by: "promote"
  };
  writeFileSync(activePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  const report = {
    action: "promote",
    from: previousId,
    to,
    correlation_id,
    at: new Date().toISOString(),
    ok: true
  };
  writeFileSync(join(reportDir, "PROMOTE_REPORT.json"), JSON.stringify(report, null, 2), "utf-8");
  writeFileSync(
    join(reportDir, "PROMOTE_REPORT.md"),
    `# Promote Report\n\nfrom: ${previousId}\nto: ${to}\ncorrelation_id: ${correlation_id}\nok: true\n`,
    "utf-8"
  );

  const indexDir = join(reportsDir, "index");
  mkdirSync(indexDir, { recursive: true });
  const indexLine = JSON.stringify({
    ts: new Date().toISOString(),
    action: "promote",
    from: previousId,
    to,
    correlation_id,
    ok: true
  }) + "\n";
  appendFileSync(join(indexDir, "releases_latest.jsonl"), indexLine, "utf-8");

  return { ok: true, from: previousId, to, correlation_id, report_dir: reportDir };
}
