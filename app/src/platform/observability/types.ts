import type { AnyCode } from "./errorCodes";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEvent = {
  ts: string;               // ISO
  level: LogLevel;
  code: AnyCode;
  message: string;

  correlationId: string;

  // Governance context (optional, but strongly encouraged)
  tenantId?: string;
  actorId?: string;
  role?: string;

  // Surface/context
  appKind?: "APP" | "CP";
  surface?: string;
  op?: string;

  // Structured details (avoid PII)
  details?: Record<string, unknown>;
};
