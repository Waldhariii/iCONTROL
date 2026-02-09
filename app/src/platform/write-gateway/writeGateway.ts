import type { PolicyContext, WriteIntent } from "../policy/types";
import { canWrite } from "../policy/policyEngine";
import { makeAuditEvent } from "../audit/auditTrail";
import { Vfs, type VfsScope } from "../storage/vfs";
import { useTenantContext } from "../../core/tenant/tenantContext";

export type WriteResult =
  | { ok: true }
  | { ok: false; code: string; reason: string };

function auditLog(_ev: ReturnType<typeof makeAuditEvent>): void {
  // Baseline: no-op. Hook to your logs provider later.
  // Intentionally side-effect-light.
}

export async function write(ctx: PolicyContext, intent: WriteIntent, fn: () => Promise<void> | void): Promise<WriteResult> {
  const decision = canWrite(ctx, intent);
  auditLog(makeAuditEvent(ctx, {
    kind: "WRITE_ATTEMPT",
    op: intent.op,
    ...(intent.key ? { key: intent.key } : {}),
    ...(intent.meta ? { details: intent.meta } : {}),
  }));

  if (decision.ok === false) {
    auditLog(makeAuditEvent(ctx, {
      kind: "WRITE_BLOCKED",
      op: intent.op,
      ...(intent.key ? { key: intent.key } : {}),
      details: { code: decision.code, reason: decision.reason },
    }));
    return { ok: false, code: decision.code, reason: decision.reason };
  }

  try {
    await fn();
    auditLog(makeAuditEvent(ctx, {
      kind: "WRITE_OK",
      op: intent.op,
      ...(intent.key ? { key: intent.key } : {}),
      ...(intent.meta ? { details: intent.meta } : {}),
    }));
    return { ok: true };
  } catch (e) {
    return { ok: false, code: "WRITE_FAILED", reason: (e as Error)?.message ?? "unknown" };
  }
}

export async function vfsSet(ctx: PolicyContext, scope: VfsScope, key: string, value: string): Promise<WriteResult> {
  return write(ctx, { op: "storage:set", namespace: `tenant:${scope.tenantId}/ns:${scope.namespace}`, key }, () => {
    Vfs.set(scope, key, value);
  });
}

export async function vfsDel(ctx: PolicyContext, scope: VfsScope, key: string): Promise<WriteResult> {
  return write(ctx, { op: "storage:delete", namespace: `tenant:${scope.tenantId}/ns:${scope.namespace}`, key }, () => {
    Vfs.del(scope, key);
  });
}

// Read path is intentionally policy-free in this adapter and kept for legacy compatibility.
export function vfsGet(scope: VfsScope, key: string): string | null {
  return Vfs.get(scope, key);
}

export interface WriteCommand {
  type: string;
  payload: any;
  tenantId?: string;
}

class WriteGatewayImpl {
  async execute(command: WriteCommand): Promise<void> {
    const { type, tenantId } = command;
    // TODO: Implement audit, validation, persistence, and event emission.
    console.log(`[WriteGateway] ${type} | Tenant: ${tenantId ?? "unknown"}`);
    return Promise.resolve();
  }
}

const writeGatewayInstance = new WriteGatewayImpl();

export function useWriteGateway() {
  const { tenantId } = useTenantContext();
  return {
    execute: (command: Omit<WriteCommand, "tenantId">) => {
      return writeGatewayInstance.execute({ ...command, tenantId });
    },
  };
}
