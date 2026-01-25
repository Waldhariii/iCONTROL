import { getLogger } from "../utils/logger";
import type { WriteResult, WriteCommand } from "./contracts";

export type AuditEntry = {
  kind: string;
  tenantId: string;
  actorId?: string;
  correlationId: string;
  status: WriteResult["status"];
  ts: string;
  meta?: Record<string, unknown>;
};

export interface AuditHook {
  append: (entry: AuditEntry) => void;
}

export function createAuditHook(): AuditHook {
  const logger = getLogger("WRITE_AUDIT");
  return {
    append(entry) {
      logger.warn("WRITE_AUDIT_STUB_APPEND", {
        kind: entry.kind,
        tenant_id: entry.tenantId,
        correlation_id: entry.correlationId,
        status: entry.status,
      });
    },
  };
}
