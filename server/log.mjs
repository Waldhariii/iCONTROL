export function nowIso() {
  return new Date().toISOString();
}

export function emit(ev) {
  const line = JSON.stringify(ev);
  process.stdout.write(line + "\n");
}

export function log(level, code, scope, message, context) {
  emit({ ts: nowIso(), level, code, scope, message, context });
}

export function info(code, scope, message, context) {
  log("INFO", code, scope, message, context);
}
export function warn(code, scope, message, context) {
  log("WARN", code, scope, message, context);
}
export function err(code, scope, message, context) {
  log("ERR", code, scope, message, context);
}
