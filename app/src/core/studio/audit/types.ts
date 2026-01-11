export type AuditLevel = "INFO" | "WARN" | "ERROR";

export type AuditEvent = {
  ts: string;              // ISO string
  level: AuditLevel;
  category: string;        // ex: "governance", "security", "studio"
  action: string;          // ex: "rbac_denied", "schema_invalid"
  message?: string;
  meta?: Record<string, unknown>;
};

export type AuditSink = {
  write: (e: AuditEvent) => void;
};
