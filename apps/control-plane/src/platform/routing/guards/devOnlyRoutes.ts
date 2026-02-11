export type DevOnlyRouteRule = {
  routeKey: string;        // semantic key used by router guard
  seg: string;             // URL segment
  fallback: string;        // router fallback id (e.g., "dashboard_cp")
  marker: string;          // marker for contracts
};

/* ICONTROL_DEVONLY_ROUTES_SSOT_V1 */
export const DEV_ONLY_CP_ROUTES: readonly DevOnlyRouteRule[] = Object.freeze([
  {
    routeKey: "ui-showcase",
    seg: "ui-showcase",
    fallback: "dashboard_cp",
    marker: "ICONTROL_CP_UI_SHOWCASE_ROUTER_GUARD",
  },
]);
