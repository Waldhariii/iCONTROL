import type { ActorContext } from "../securityContext";
import { requireCapability } from "../policy/policyEngine";

export function guardAdminEntitlements(actor: ActorContext) {
  return requireCapability(actor, "canAdminEntitlements", "ERR_POLICY_ADMIN_ENTITLEMENTS_DENIED");
}

export function guardAdminGlobalTheme(actor: ActorContext) {
  return requireCapability(actor, "canAdminGlobalTheme", "ERR_POLICY_ADMIN_THEME_DENIED");
}
