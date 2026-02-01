import type { ActorContext } from "../securityContext";
import { requireCapability } from "../policy/policyEngine";
import { warn } from "../observability";
import { ERR } from "../observability";

export function guardAdminEntitlements(actor: ActorContext) {
  const d = requireCapability(actor, "canAdminEntitlements", ERR.POLICY_ADMIN_ENTITLEMENTS_DENIED);
  if (!d.allow) {
    warn(d.reasonCode, "Policy deny: admin entitlements", { tenantId: actor.tenantId, actorId: actor.actorId, role: actor.role, appKind: "CP", surface: "settings" }, { cap: "canAdminEntitlements" });
  }
  return d;
}

export function guardAdminGlobalTheme(actor: ActorContext) {
  const d = requireCapability(actor, "canAdminGlobalTheme", ERR.POLICY_ADMIN_THEME_DENIED);
  if (!d.allow) {
    warn(d.reasonCode, "Policy deny: admin global theme", { tenantId: actor.tenantId, actorId: actor.actorId, role: actor.role, appKind: "CP", surface: "settings" }, { cap: "canAdminGlobalTheme" });
  }
  return d;
}
