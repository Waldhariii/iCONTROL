import type { AuditEvent } from "./types";

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeEvent(input: AuditEvent): AuditEvent {
  // Defensive normalize: ensure ts exists
  const ts = input.ts && typeof input.ts === "string" ? input.ts : nowIso();
  return { ...input, ts };
}
