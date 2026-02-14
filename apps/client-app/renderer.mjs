import { renderSafeWidget } from "../../core/kernel/safe-renderer/safe-renderer.mjs";

export function renderFromManifest(manifest, path) {
  const routes = (manifest?.routes?.routes || []).filter((r) => r.surface === "client");
  const route = routes.find((r) => r.path === path);
  if (!route) throw new Error("Route not found");
  const pages = manifest.pages?.pages || [];
  const versions = manifest.pages?.page_versions || [];
  const page = pages.find((p) => p.id === route.page_id);
  const entitlements = new Set((manifest?.entitlements || []).map((e) => e.id));
  if (route.entitlement_gate_id && !entitlements.has(route.entitlement_gate_id)) {
    throw new Error("Access denied: entitlement");
  }
  const guardPacks = new Set((manifest?.permissions?.guard_packs || []).map((g) => g.guard_pack_id));
  if (guardPacks.size > 0 && route.guard_pack_id && !guardPacks.has(route.guard_pack_id)) {
    throw new Error("Access denied: guard");
  }
  const version = versions.find((v) => v.page_id === route.page_id);
  const widgets = manifest.pages?.widgets || [];
  const widgetIds = version?.widget_instance_ids || [];
  const widgetsForPage = widgets.filter((w) => widgetIds.includes(w.id));
  const rendered = widgetsForPage.map((w) => renderSafeWidget({ widgetId: w.id, props: w.props || {}, manifest }));
  return { page, rendered };
}
