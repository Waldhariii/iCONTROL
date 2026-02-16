/**
 * Phase AQ: Breakglass check and governance ledger. Artifacts under runtime/reports/governance/.
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

const ACTION_ACCOUNTING_EXECUTE = "accounting.execute";

/**
 * @param {string} ssotDir
 * @param {string} action
 * @param {{ scope?: string }} opts
 * @returns {boolean}
 */
export function checkBreakglass(ssotDir, action, opts = {}) {
  const path = join(ssotDir, "governance", "break_glass.json");
  if (!existsSync(path)) return false;
  const bg = JSON.parse(readFileSync(path, "utf-8"));
  if (!bg.enabled || !bg.expires_at) return false;
  const exp = Date.parse(bg.expires_at);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const allowed = bg.allowed_actions || [];
  const match = allowed.some((a) => a === action || (a.endsWith(".*") && action.startsWith(a.slice(0, -2))));
  if (!match) return false;
  const scope = opts.scope || "platform:*";
  if (bg.scope && bg.scope !== "platform:*" && scope !== bg.scope) return false;
  return true;
}

/**
 * @param {string} reportsDir
 * @param {{ ts: string, action: string, allowed: boolean, correlation_id?: string }} entry
 */
export function appendBreakglassEvent(reportsDir, entry) {
  const dir = join(reportsDir, "governance");
  mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({
    ts: entry.ts || new Date().toISOString(),
    action: entry.action,
    allowed: !!entry.allowed,
    correlation_id: entry.correlation_id || null
  }) + "\n";
  appendFileSync(join(dir, "breakglass_latest.jsonl"), line, "utf-8");
}

export { ACTION_ACCOUNTING_EXECUTE };
