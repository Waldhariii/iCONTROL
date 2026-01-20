type AuditEvent = {
  ts: string;
  actor: string;
  action: string;
  target?: string;
};

const buffer: AuditEvent[] = [];

function _append(event: Omit<AuditEvent,"ts">) {
  const e: AuditEvent = {
    ts: new Date().toISOString(),
    ...event,
  };

  buffer.push(e);

  // MVI: console-only, no persistence
  console.info("[AUDIT]", e.action, e.target || "");
}

/**
 * Primary audit primitive (internal use)
 */
export function audit(event: Omit<AuditEvent,"ts">) {
  _append(event);
}

/**
 * Compatibility alias (used by entitlements / governance)
 * Explicit naming for compliance readability
 */
export function appendAuditEvent(
  actor: string,
  action: string,
  target?: string
) {
  _append({ actor, action, target });
}

/**
 * Read-only snapshot (debug / tests only)
 */
export function getAuditSnapshot() {
  return [...buffer];
}
