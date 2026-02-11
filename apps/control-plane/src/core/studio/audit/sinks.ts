import type { AuditEvent, AuditSink } from "./types";
import { normalizeEvent } from "./format";

export class MemorySink implements AuditSink {
  private readonly events: AuditEvent[] = [];

  write(e: AuditEvent): void {
    this.events.push(normalizeEvent(e));
  }

  snapshot(): readonly AuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}
