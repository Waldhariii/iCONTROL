import type { PolicyContext, WriteIntent } from "../policy/types";
import { canWrite } from "../policy/policyEngine";
import { makeAuditEvent } from "../audit/auditTrail";
import { Vfs, type VfsScope } from "../storage/vfs";
import { useTenantContext } from "../../core/tenant/tenantContext";
import { getApiBase } from "../../core/runtime/apiBase";
import { getSession } from "../../localAuth";
import { getPermissionClaims } from "../../runtime/rbac";

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

type ValidationResult = { ok: true } | { ok: false; reason: string };

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim().length > 0;
const isOneOf = (v: any, allowed: string[]) => typeof v === "string" && allowed.includes(v);

function validateCommand(type: string, payload: any): ValidationResult {
  switch (type) {
    case "TENANT_CREATE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "tenant.id requis" };
      if (!isNonEmptyString(payload?.name)) return { ok: false, reason: "tenant.name requis" };
      if (payload?.plan && !isOneOf(String(payload.plan), ["FREE", "PRO", "ENTERPRISE"])) {
        return { ok: false, reason: "tenant.plan invalide" };
      }
      return { ok: true };
    case "TENANT_UPDATE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "tenant.id requis" };
      if (payload?.plan && !isOneOf(String(payload.plan), ["FREE", "PRO", "ENTERPRISE"])) {
        return { ok: false, reason: "tenant.plan invalide" };
      }
      return { ok: true };
    case "TENANT_DELETE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "tenant.id requis" };
      return { ok: true };
    case "PROVIDER_CREATE":
      if (!isNonEmptyString(payload?.name)) return { ok: false, reason: "provider.name requis" };
      if (!isOneOf(String(payload?.type), ["storage", "ocr", "messaging", "payments", "email", "sms"])) {
        return { ok: false, reason: "provider.type invalide" };
      }
      if (payload?.status && !isOneOf(String(payload.status), ["ACTIVE", "DISABLED", "EXPERIMENTAL"])) {
        return { ok: false, reason: "provider.status invalide" };
      }
      if (payload?.health_status && !isOneOf(String(payload.health_status), ["OK", "WARN", "ERR", "UNKNOWN"])) {
        return { ok: false, reason: "provider.health_status invalide" };
      }
      return { ok: true };
    case "PROVIDER_UPDATE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "provider.id requis" };
      if (payload?.status && !isOneOf(String(payload.status), ["ACTIVE", "DISABLED", "EXPERIMENTAL"])) {
        return { ok: false, reason: "provider.status invalide" };
      }
      if (payload?.health_status && !isOneOf(String(payload.health_status), ["OK", "WARN", "ERR", "UNKNOWN"])) {
        return { ok: false, reason: "provider.health_status invalide" };
      }
      return { ok: true };
    case "PROVIDER_DELETE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "provider.id requis" };
      return { ok: true };
    case "POLICY_CREATE":
      if (!isNonEmptyString(payload?.name)) return { ok: false, reason: "policy.name requis" };
      if (payload?.status && !isOneOf(String(payload.status), ["ACTIVE", "DISABLED", "EXPERIMENTAL"])) {
        return { ok: false, reason: "policy.status invalide" };
      }
      return { ok: true };
    case "POLICY_UPDATE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "policy.id requis" };
      if (payload?.status && !isOneOf(String(payload.status), ["ACTIVE", "DISABLED", "EXPERIMENTAL"])) {
        return { ok: false, reason: "policy.status invalide" };
      }
      return { ok: true };
    case "POLICY_DELETE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "policy.id requis" };
      return { ok: true };
    case "SECURITY_UPDATE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "security.id requis" };
      if (payload?.status && !isOneOf(String(payload.status), ["ENFORCED", "ACTIVE", "SCHEDULED", "DISABLED"])) {
        return { ok: false, reason: "security.status invalide" };
      }
      return { ok: true };
    case "SECURITY_DELETE":
      if (!isNonEmptyString(payload?.id)) return { ok: false, reason: "security.id requis" };
      return { ok: true };
    case "BRANDING_UPDATE":
      if (payload?.primary_color && typeof payload.primary_color !== "string") {
        return { ok: false, reason: "branding.primary_color invalide" };
      }
      if (payload?.logo_url && typeof payload.logo_url !== "string") {
        return { ok: false, reason: "branding.logo_url invalide" };
      }
      return { ok: true };
    default:
      return { ok: true };
  }
}

class WriteGatewayImpl {
  async execute(command: WriteCommand): Promise<WriteResult> {
    const { type, tenantId, payload } = command;
    const API_BASE = getApiBase();

    try {
      const validation = validateCommand(type, payload);
      if (!validation.ok) {
        return { ok: false, code: "VALIDATION_FAILED", reason: validation.reason };
      }
      switch (type) {
        case "TENANT_CREATE":
          await this.postJson(`${API_BASE}/api/tenants`, payload, tenantId);
          return { ok: true };
        case "TENANT_UPDATE":
          await this.putJson(`${API_BASE}/api/tenants/${payload?.id}`, payload, tenantId);
          return { ok: true };
        case "TENANT_DELETE":
          await this.deleteJson(`${API_BASE}/api/tenants/${payload?.id}`, tenantId);
          return { ok: true };
        case "PROVIDER_CREATE":
          await this.postJson(`${API_BASE}/api/cp/providers`, payload, tenantId);
          return { ok: true };
        case "PROVIDER_UPDATE":
          await this.putJson(`${API_BASE}/api/cp/providers/${payload?.id}`, payload, tenantId);
          return { ok: true };
        case "PROVIDER_DELETE":
          await this.deleteJson(`${API_BASE}/api/cp/providers/${payload?.id}`, tenantId);
          return { ok: true };
        case "POLICY_CREATE":
          await this.postJson(`${API_BASE}/api/cp/policies`, payload, tenantId);
          return { ok: true };
        case "POLICY_UPDATE":
          await this.putJson(`${API_BASE}/api/cp/policies/${payload?.id}`, payload, tenantId);
          return { ok: true };
        case "POLICY_DELETE":
          await this.deleteJson(`${API_BASE}/api/cp/policies/${payload?.id}`, tenantId);
          return { ok: true };
        case "SECURITY_UPDATE":
          await this.putJson(`${API_BASE}/api/cp/security/${payload?.id}`, payload, tenantId);
          return { ok: true };
        case "SECURITY_DELETE":
          await this.deleteJson(`${API_BASE}/api/cp/security/${payload?.id}`, tenantId);
          return { ok: true };
        case "BRANDING_UPDATE":
          await this.putJson(`${API_BASE}/api/cp/branding`, payload, tenantId);
          return { ok: true };
        default:
          console.warn(`[WriteGateway] Unhandled command: ${type}`);
          return { ok: false, code: "UNHANDLED_COMMAND", reason: `No handler for ${type}` };
      }
    } catch (e) {
      return { ok: false, code: "WRITE_FAILED", reason: (e as Error)?.message ?? "unknown" };
    }
  }

  private buildHeaders(tenantId?: string): Record<string, string> {
    const s = getSession();
    const role = String((s as any)?.role || "USER").toUpperCase();
    const userId = String((s as any)?.username || (s as any)?.userId || "");
    const perms = getPermissionClaims();
    return {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId ?? "default",
      "x-user-role": role,
      "x-user-id": userId,
      "x-user-permissions": perms.join(","),
    };
  }

  private async postJson(url: string, body: any, tenantId?: string): Promise<void> {
    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(tenantId),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const detail = await this.safeReadError(res);
      throw new Error(detail || `HTTP ${res.status} POST ${url}`);
    }
  }

  private async putJson(url: string, body: any, tenantId?: string): Promise<void> {
    const res = await fetch(url, {
      method: "PUT",
      headers: this.buildHeaders(tenantId),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const detail = await this.safeReadError(res);
      throw new Error(detail || `HTTP ${res.status} PUT ${url}`);
    }
  }

  private async deleteJson(url: string, tenantId?: string): Promise<void> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.buildHeaders(tenantId),
    });
    if (!res.ok) {
      const detail = await this.safeReadError(res);
      throw new Error(detail || `HTTP ${res.status} DELETE ${url}`);
    }
  }

  private async safeReadError(res: Response): Promise<string | null> {
    try {
      const data = await res.json();
      if (data?.message) return String(data.message);
      if (data?.error) return String(data.error);
      return null;
    } catch {
      return null;
    }
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
