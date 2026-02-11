import type { PolicyRule } from "./types";

/**
 * V1 placeholder rules:
 * - Role-based allowlist for CP toggles
 * - Activation gating for modules (deny if activation state is off/hidden)
 */

export const ruleCpToggleRequiresAdmin: PolicyRule = ({ subject, action }) => {
  if (!action.startsWith("cp.modules.toggle")) return null;
  const ok = subject.roles.includes("admin") || subject.roles.includes("owner");
  return ok ? { allow: true, reason: "OK_CP_TOGGLE_ADMIN" } : { allow: false, reason: "ERR_CP_TOGGLE_NOT_ADMIN" };
};

export const ruleActivationGate: PolicyRule = ({ action, ctx }) => {
  // Convention: module actions start with "<module>." and map to "module.<name>" activation keys.
  // Example: "jobs.read" -> activation "module.jobs"
  const [ns] = action.split(".", 1);
  if (!ns) return null;

  const key = `module.${ns}`;
  const state = ctx.activation?.[key];
  if (!state) return null; // if unknown, do not decide here

  if (state === "off" || state === "hidden") return { allow: false, reason: "ERR_MODULE_DISABLED" };
  return null;
};

export const POLICY_RULESET_V1: readonly PolicyRule[] = [
  ruleCpToggleRequiresAdmin,
  ruleActivationGate,
] as const;
