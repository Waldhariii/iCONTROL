import { nsKey } from "../runtime/storageNs";
import { isSafeMode } from "../runtime/safeMode";

export type AuditLevel = "INFO" | "WARN" | "ERR";

export type AuditEvent = {
  ts: string;               // ISO
  level: AuditLevel;
  code: string;             // WARN_* / ERR_*
  scope?: string;           // ex: "entitlements"
  message?: string;
  meta?: Record<string, any>;
};

const BASE_KEY = "auditLog.v1";
const MAX = 500;

function nowIso() {
  return new Date().toISOString();
}

function key(): string {
  return nsKey(BASE_KEY);
}

export function readAuditLog(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAuditLog(events: AuditEvent[]) {
  if (isSafeMode()) return; // governance: read-only
  const trimmed = events.slice(-MAX);
  localStorage.setItem(key(), JSON.stringify(trimmed));
}

export function appendAuditEvent(ev: Omit<AuditEvent, "ts"> & { ts?: string }) {
  if (isSafeMode()) return; // governance: read-only
  const events = readAuditLog();
  events.push({ ts: ev.ts ?? nowIso(), ...ev });
  writeAuditLog(events);
}

export function exportAuditLogJson(): string {
  return JSON.stringify(readAuditLog(), null, 2);
}

export function clearAuditLog() {
  if (isSafeMode()) return; // governance: read-only
  localStorage.removeItem(key());
}
