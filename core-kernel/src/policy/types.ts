/**
 * Policy Engine V1 — contract-first skeleton (RBAC/ABAC-ready).
 * Strictly side-effect free.
 */

export type Subject = Readonly<{
  tenantId: string;
  userId: string;
  roles: readonly string[];
  claims?: Readonly<Record<string, string | number | boolean>>;
}>;

export type Resource = Readonly<{
  type: string;           // e.g. "job", "invoice", "doc"
  id?: string;
  attrs?: Readonly<Record<string, string | number | boolean>>;
}>;

export type Action = string; // e.g. "jobs.read", "jobs.write", "cp.modules.toggle"

export type Decision = Readonly<{
  allow: boolean;
  reason: string;         // stable code, e.g. "OK_POLICY_ALLOW" / "ERR_POLICY_DENY"
  obligations?: Readonly<Record<string, string | number | boolean>>; // e.g. "audit": true
}>;

export type PolicyContext = Readonly<{
  safeMode: boolean;
  entitlements?: Readonly<Record<string, string | number | boolean>>;
  activation?: Readonly<Record<string, string>>; // ActivationKey -> ActivationState
}>;

export type PolicyRule = (args: {
  subject: Subject;
  action: Action;
  resource?: Resource;
  ctx: PolicyContext;
}) => Decision | null; // null => "not applicable"

export type PolicyEngine = Readonly<{
  evaluate: (args: {
    subject: Subject;
    action: Action;
    resource?: Resource;
    ctx: PolicyContext;
  }) => Decision;
}>;
