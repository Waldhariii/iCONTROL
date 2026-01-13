export type AuditLevel = "INFO" | "WARN" | "ERR";

export type AuditEvent = {
  ts: string;               // ISO
  level: AuditLevel;
  code: string;             // WARN_* / ERR_*
  scope?: string;           // ex: "entitlements"
  message?: string;
  meta?: Record<string, any>;
};

const KEY = "icontrol.auditLog.v1";
const MAX = 500;

function nowIso() {
  return new Date().toISOString();
}

export function readAuditLog(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAuditLog(events: AuditEvent[]) {
  const trimmed = events.slice(-MAX);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function appendAuditEvent(ev: Omit<AuditEvent, "ts"> & { ts?: string }) {
  const events = readAuditLog();
  events.push({ ts: ev.ts ?? nowIso(), ...ev });
  writeAuditLog(events);
}

export function exportAuditLogJson(): string {
  return JSON.stringify(readAuditLog(), null, 2);
}

export function clearAuditLog() {
  localStorage.removeItem(KEY);
}
