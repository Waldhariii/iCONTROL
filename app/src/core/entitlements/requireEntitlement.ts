import { hasEntitlement } from "./resolve";
import { WARN_ENTITLEMENTS_MISSING_PRO } from "./warnings";
import { appendAuditEvent } from "../audit/auditLog";

export function requireEntitlement(entitlement: string, context?: { route?: string }) {
  if (!hasEntitlement(entitlement)) {
    const code = entitlement === "pro" ? WARN_ENTITLEMENTS_MISSING_PRO : "WARN_ENTITLEMENTS_MISSING";
    appendAuditEvent({
      level: "WARN",
      code,
      scope: "entitlements",
      message: `Missing entitlement: ${entitlement}`,
      meta: { entitlement, route: context?.route ?? null },
    });

    const err: any = new Error("Entitlement missing");
    err.code = code;
    throw err;
  }
}
