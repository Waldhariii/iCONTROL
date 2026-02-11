/**
 * SSOT: Control Plane activation registry.
 * Goal: define WHAT can be toggled per tenant, without embedding business logic in surfaces/modules.
 *
 * Rules:
 * - keys are stable identifiers (no renames without migration).
 * - defaultState must be explicit.
 * - activation is evaluated through PolicyEngine (never direct reads in modules).
 */
export type ActivationKey =
  | "core.safe_mode"
  | "core.entitlements"
  | "core.policy_engine"
  | "module.jobs"
  | "module.crm"
  | "module.docs"
  | "module.ocr"
  | "module.billing";

export type ActivationState = "on" | "off" | "beta" | "hidden";

export type ActivationEntry = Readonly<{
  key: ActivationKey;
  defaultState: ActivationState;
  description: string;
}>;

export const ACTIVATION_REGISTRY: readonly ActivationEntry[] = [
  { key: "core.safe_mode", defaultState: "on", description: "SAFE_MODE kill-switch + CP-only enforcement." },
  { key: "core.entitlements", defaultState: "on", description: "Entitlements + quotas evaluation (global)." },
  { key: "core.policy_engine", defaultState: "on", description: "Central policy evaluation engine (RBAC/ABAC skeleton)." },

  // Business modules (default OFF until explicitly enabled per tenant)
  { key: "module.jobs", defaultState: "off", description: "Work Orders / Jobs module." },
  { key: "module.crm", defaultState: "off", description: "CRM module." },
  { key: "module.docs", defaultState: "off", description: "Documents module." },
  { key: "module.ocr", defaultState: "off", description: "OCR module." },
  { key: "module.billing", defaultState: "off", description: "Billing module." },
] as const;

export function getDefaultActivationMap(): Record<ActivationKey, ActivationState> {
  const out = {} as Record<ActivationKey, ActivationState>;
  for (const e of ACTIVATION_REGISTRY) out[e.key] = e.defaultState;
  return out;
}
