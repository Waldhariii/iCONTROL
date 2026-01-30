import { getLogger } from "../utils/logger";
import type { WriteCommand, WriteResult } from "./contracts";
import type { PolicyHook } from "./policyHook";
import type { AuditHook, AuditEntry } from "./auditHook";

export type WriteAdapter = {
  name: string;
  apply: (cmd: WriteCommand) => WriteResult;
};

export type WriteGateway = {
  execute: (cmd: WriteCommand) => WriteResult;
};

export type WriteGatewayDeps = {
  policy: PolicyHook;
  audit: AuditHook;
  adapter: WriteAdapter;
  safeMode?: { enabled?: boolean };
};

const logger = getLogger("WRITE_GATEWAY");

export function createCorrelationId(prefix = "wg"): string {
  try {
    const v = crypto?.randomUUID?.();
    if (v) return `${prefix}_${v}`;
  } catch {}
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalizeCommand(cmd: WriteCommand): WriteCommand {
  return {
    ...cmd,
    kind: String(cmd.kind || "").trim(),
    tenantId: String(cmd.tenantId || "").trim(),
    correlationId: String(cmd.correlationId || "").trim(),
  };
}

function invalidCommand(cmd: WriteCommand): string | null {
  if (!cmd.kind) return "ERR_WRITE_CMD_KIND_REQUIRED";
  if (!cmd.tenantId) return "ERR_WRITE_CMD_TENANT_REQUIRED";
  if (!cmd.correlationId) return "ERR_WRITE_CMD_CORRELATION_REQUIRED";
  return null;
}

export function createWriteGateway(deps: WriteGatewayDeps): WriteGateway {
  const safe = deps.safeMode?.enabled !== false;

  return {
    execute(raw: WriteCommand): WriteResult {
      const cmd = normalizeCommand(raw);
      const err = invalidCommand(cmd);
      if (err) {
        logger.warn("WRITE_GATEWAY_CMD_INVALID", {
          error: err,
          kind: cmd.kind,
          tenant_id: cmd.tenantId,
          correlation_id: cmd.correlationId,
        });
        return { status: "ERROR", correlationId: cmd.correlationId, error: err };
      }

      let policyAllowed = true;
      try {
        const decision = deps.policy.evaluate(cmd);
        policyAllowed = !!decision?.allowed;
        if (!policyAllowed) {
          logger.warn("WRITE_GATEWAY_POLICY_DENY", {
            kind: cmd.kind,
            tenant_id: cmd.tenantId,
            correlation_id: cmd.correlationId,
            reason: decision?.reason || "POLICY_DENY",
          });
        }
      } catch (e) {
        logger.warn("WRITE_GATEWAY_POLICY_ERROR", {
          kind: cmd.kind,
          tenant_id: cmd.tenantId,
          correlation_id: cmd.correlationId,
          error: String(e),
        });
        if (!safe) {
          return { status: "ERROR", correlationId: cmd.correlationId, error: "ERR_POLICY_EVAL" };
        }
      }

      if (!policyAllowed) {
        return { status: "ERROR", correlationId: cmd.correlationId, error: "ERR_POLICY_DENY" };
      }

      let result: WriteResult = { status: "ERROR", correlationId: cmd.correlationId, error: "ERR_WRITE_UNKNOWN" };
      try {
        result = deps.adapter.apply(cmd);
      } catch (e) {
        logger.error("WRITE_GATEWAY_ADAPTER_ERROR", {
          kind: cmd.kind,
          tenant_id: cmd.tenantId,
          correlation_id: cmd.correlationId,
          adapter: deps.adapter.name,
          error: String(e),
        });
        if (!safe) {
          return { status: "ERROR", correlationId: cmd.correlationId, error: "ERR_ADAPTER_APPLY" };
        }
        result = { status: "ERROR", correlationId: cmd.correlationId, error: "ERR_ADAPTER_APPLY" };
      }

      const auditEntry: AuditEntry = {
        kind: cmd.kind,
        tenantId: cmd.tenantId,
        actorId: cmd.actor?.id,
        correlationId: cmd.correlationId,
        status: result.status,
        ts: new Date().toISOString(),
        meta: cmd.meta,
      };

      try {
        deps.audit.append(auditEntry);
      } catch (e) {
        logger.warn("WRITE_GATEWAY_AUDIT_ERROR", {
          kind: cmd.kind,
          tenant_id: cmd.tenantId,
          correlation_id: cmd.correlationId,
          error: String(e),
        });
      }

      logger.info("WRITE_GATEWAY_EXEC", {
        kind: cmd.kind,
        tenant_id: cmd.tenantId,
        actor_id: cmd.actor?.id,
        correlation_id: cmd.correlationId,
        status: result.status,
      });

      return result;
    },
  };
}
