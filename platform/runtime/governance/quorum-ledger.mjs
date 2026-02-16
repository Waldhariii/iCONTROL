/**
 * Phase AQ: Quorum check and governance ledger. Artifacts under runtime/reports/governance/.
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

/**
 * @param {string} ssotDir
 * @param {string} action
 * @param {string} targetId
 * @param {{ required?: number }} opts
 * @returns {boolean}
 */
export function checkQuorum(ssotDir, action, targetId, opts = {}) {
  const required = opts.required ?? 2;
  const safe = String(action).replace(/[^a-z0-9-]/gi, "_");
  const path = join(ssotDir, "changes", "reviews", `${safe}-${targetId}.json`);
  if (!existsSync(path)) return false;
  const review = JSON.parse(readFileSync(path, "utf-8"));
  const approvals = review.approvals || [];
  if ((review.required_approvals ?? required) > approvals.length) return false;
  if (review.status !== "approved") return false;
  return true;
}

/**
 * @param {string} reportsDir
 * @param {{ ts: string, action: string, target_id: string, met: boolean, correlation_id?: string }} entry
 */
export function appendQuorumEvent(reportsDir, entry) {
  const dir = join(reportsDir, "governance");
  mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({
    ts: entry.ts || new Date().toISOString(),
    action: entry.action,
    target_id: entry.target_id,
    met: !!entry.met,
    correlation_id: entry.correlation_id || null
  }) + "\n";
  appendFileSync(join(dir, "quorum_latest.jsonl"), line, "utf-8");
}
