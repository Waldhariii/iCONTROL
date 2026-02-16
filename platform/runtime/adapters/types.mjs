/**
 * Phase AF: Adapter runtime types. No core schema changes; shapes for runtime only.
 */

/**
 * @typedef {{
 *   correlation_id: string,
 *   actor: string,
 *   inputs: Record<string, unknown>,
 *   dry_run: boolean,
 *   artifacts_dir: string,
 *   workflow_id?: string,
 *   step_id?: string
 * }} AdapterContext
 */

/**
 * @typedef {{
 *   ok: boolean,
 *   step_id: string,
 *   kind: string,
 *   artifact_ids?: string[],
 *   error?: string,
 *   [key: string]: unknown
 * }} AdapterStepResult
 */

/**
 * @typedef {{
 *   kind: string,
 *   version: string,
 *   capabilities?: string[],
 *   run: (ctx: AdapterContext) => Promise<AdapterStepResult>
 * }} Adapter
 */

export const ALLOWLIST_KINDS = [
  "storage.write",
  "storage.read",
  "pdf.generate",
  "ocr.ingest",
  "accounting.sync",
  "notify.send"
];
