import type { AuditEvent, AuditLevel, AuditSink } from "./types";
import { nowIso, normalizeEvent } from "./format";

export class AuditLogger {
  constructor(private readonly sink: AuditSink) {}

  emit(e: Omit<AuditEvent, "ts"> & { ts?: string }): void {
    try {
      const event: AuditEvent = normalizeEvent({ ts: e.ts ?? nowIso(), ...e } as AuditEvent);
      this.sink.write(event);
    } catch {
      // Never throw (governed logging)
    }
  }

  info(category: string, action: string, message?: string, meta?: Record<string, unknown>): void {
    this.emit({ level: "INFO", category, action, message, meta });
  }

  warn(category: string, action: string, message?: string, meta?: Record<string, unknown>): void {
    this.emit({ level: "WARN", category, action, message, meta });
  }

  error(category: string, action: string, message?: string, meta?: Record<string, unknown>): void {
    this.emit({ level: "ERROR", category, action, message, meta });
  }
}

export function createLogger(sink: AuditSink): AuditLogger {
  return new AuditLogger(sink);
}

export function levelRank(l: AuditLevel): number {
  return l === "ERROR" ? 3 : l === "WARN" ? 2 : 1;
}
