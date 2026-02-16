/**
 * Level 11: Unified platform event stream. Append-only JSONL under runtime/reports/platform_events.jsonl.
 */
import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "runtime", "reports");
const STREAM_PATH = join(REPORTS, "platform_events.jsonl");

/**
 * @param {{ type: string, [key: string]: unknown }} event
 */
export function emitPlatformEvent(event) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...event
  }) + "\n";
  mkdirSync(dirname(STREAM_PATH), { recursive: true });
  appendFileSync(STREAM_PATH, line, "utf-8");
}
