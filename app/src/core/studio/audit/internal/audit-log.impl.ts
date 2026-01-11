export type AuditEvent = {
  ts: string;
  actor: string;
  code: string;
  message: string;
  meta?: Record<string, unknown>;
};

export function appendAudit(logs: AuditEvent[], event: AuditEvent): AuditEvent[] {
  return [...logs, event];
}
