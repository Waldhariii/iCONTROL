import type { Decision, PolicyContext, PolicyEngine, PolicyRule, Resource, Subject, Action } from "./types";

const DENY_DEFAULT: Decision = { allow: false, reason: "ERR_POLICY_DENY_DEFAULT" };

function allow(reason: string): Decision {
  return { allow: true, reason };
}

function deny(reason: string): Decision {
  return { allow: false, reason };
}

/**
 * Built-in baseline rules (V1):
 * - SAFE_MODE restricts sensitive actions to control-plane governance actions only.
 * - If no rule matches, deny by default.
 */
export function createPolicyEngine(rules: readonly PolicyRule[]): PolicyEngine {
  return Object.freeze({
    evaluate({ subject, action, resource, ctx }: { subject: Subject; action: Action; resource?: Resource; ctx: PolicyContext }): Decision {
      // 1) SAFE_MODE hard guard (minimal skeleton)
      if (ctx.safeMode) {
        // allow only a minimal CP governance namespace; everything else denied
        if (action.startsWith("cp.")) return allow("OK_SAFE_MODE_CP_ALLOW");
        return deny("ERR_SAFE_MODE_DENY_NON_CP");
      }

      // 2) Evaluate registered rules in order; first non-null decides
      for (const rule of rules) {
        const d = rule({
          subject,
          action,
          ctx,
          ...(resource !== undefined ? { resource } : {}),
        });
        if (d) return d;
      }

      return DENY_DEFAULT;
    },
  });
}
