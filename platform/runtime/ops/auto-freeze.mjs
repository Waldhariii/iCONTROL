/**
 * Phase AO: Auto-freeze — evaluate signals and set change_freeze when budget/anomaly/SLO violated.
 */
import { writeFileSync, mkdirSync, appendFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * @param {{
 *   tenant_id?: string,
 *   signals: { budget_burn_high?: boolean, anomaly?: boolean, slo_violation?: boolean },
 *   correlation_id: string,
 *   ssotDir: string,
 *   reportsDir: string
 * }} opts
 * @returns {{ applied: boolean, freeze_enabled: boolean, correlation_id: string, report_dir: string }}
 */
export function evaluateAndFreeze(opts) {
  const { tenant_id, signals = {}, correlation_id, ssotDir, reportsDir } = opts;
  const reportDir = join(reportsDir, "ops", correlation_id || `autofreeze-${Date.now()}`);
  mkdirSync(reportDir, { recursive: true });

  const trigger =
    Boolean(signals.budget_burn_high) ||
    Boolean(signals.anomaly) ||
    Boolean(signals.slo_violation);
  let applied = false;
  let freeze_enabled = false;

  const freezePath = join(ssotDir, "governance", "change_freeze.json");
  const current = existsSync(freezePath) ? JSON.parse(readFileSync(freezePath, "utf-8")) : { enabled: false, scopes: {} };

  if (trigger) {
    const updated = {
      ...current,
      enabled: true,
      scope: current.scope || "platform:*",
      reason: current.reason || "Auto-freeze: budget/anomaly/SLO",
      enabled_at: new Date().toISOString(),
      enabled_by: "auto-freeze",
      allow_actions: current.allow_actions || [],
      scopes: { ...(current.scopes || {}), content_mutations: true }
    };
    writeFileSync(freezePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
    applied = true;
    freeze_enabled = true;
  } else {
    freeze_enabled = Boolean(current.enabled);
  }

  const report = {
    action: "auto_freeze_evaluate",
    tenant_id: tenant_id || null,
    signals,
    trigger,
    applied,
    freeze_enabled,
    correlation_id,
    at: new Date().toISOString()
  };
  writeFileSync(join(reportDir, "AUTO_FREEZE_REPORT.json"), JSON.stringify(report, null, 2), "utf-8");
  writeFileSync(
    join(reportDir, "AUTO_FREEZE_REPORT.md"),
    `# Auto-Freeze Report\n\ntenant_id: ${tenant_id || "n/a"}\ntrigger: ${trigger}\napplied: ${applied}\nfreeze_enabled: ${freeze_enabled}\ncorrelation_id: ${correlation_id}\n`,
    "utf-8"
  );

  const indexDir = join(reportsDir, "index");
  mkdirSync(indexDir, { recursive: true });
  appendFileSync(
    join(indexDir, "ops_latest.jsonl"),
    JSON.stringify({ ts: report.at, action: "auto_freeze_evaluate", tenant_id: tenant_id || null, trigger, applied, correlation_id }) + "\n",
    "utf-8"
  );

  return { applied, freeze_enabled, correlation_id, report_dir: reportDir };
}
