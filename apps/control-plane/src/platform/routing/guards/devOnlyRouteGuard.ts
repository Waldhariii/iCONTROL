import { isDevOnlyAllowed } from "../../../core/policies/devOnly";
import { auditWarnOnce } from "../../audit/auditOnce";
import { DEV_ONLY_CP_ROUTES } from "./devOnlyRoutes";

export type DevOnlyGuardInput = {
  routeKey: string;
  marker: string;
  fallback: string;
};

export function guardDevOnlyRoute(input: DevOnlyGuardInput): string | null {
  /* ICONTROL_DEVONLY_ROUTE_GUARD_V1 */
  if (isDevOnlyAllowed()) return null;

  try {
    auditWarnOnce("WARN_DEVONLY_ROUTE_BLOCKED", {
      scope: "cp.router",
      route: input.routeKey,
      marker: input.marker,
    });
  } catch {}

  return input.fallback;
}

export function guardDevOnlyRouteByKey(routeKey: string): string | null {
  /* ICONTROL_DEVONLY_ROUTE_GUARD_BY_KEY_V1 */
  const rule = DEV_ONLY_CP_ROUTES.find(r => r.routeKey === routeKey);
  if (!rule) return null;
  return guardDevOnlyRoute({ routeKey: rule.routeKey, marker: rule.marker, fallback: rule.fallback });
}
