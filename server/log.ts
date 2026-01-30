export type LogLevel = "INFO" | "WARN" | "ERR";

export type LogEvent = {
  ts: string;               // ISO
  level: LogLevel;          // INFO|WARN|ERR
  code: string;             // INFO_*|WARN_*|ERR_*
  scope: string;            // subsystem/service name
  message: string;          // human short
  context?: Record<string, unknown>;
};

function nowIso() {
  return new Date().toISOString();
}

function emit(ev: LogEvent) {
  // Strict JSONL for deterministic parsing in CI/ops
  const line = JSON.stringify(ev);
  // Avoid console.* to keep contract clean and tooling-friendly
  process.stdout.write(line + "\n");
}

export function log(level: LogLevel, code: string, scope: string, message: string, context?: Record<string, unknown>) {
  emit({ ts: nowIso(), level, code, scope, message, context });
}

export function info(code: string, scope: string, message: string, context?: Record<string, unknown>) {
  log("INFO", code, scope, message, context);
}
export function warn(code: string, scope: string, message: string, context?: Record<string, unknown>) {
  log("WARN", code, scope, message, context);
}
export function err(code: string, scope: string, message: string, context?: Record<string, unknown>) {
  log("ERR", code, scope, message, context);
}
