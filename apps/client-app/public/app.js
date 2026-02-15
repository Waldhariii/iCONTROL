const apiBase = "http://localhost:7070/api";
const headers = { "Content-Type": "application/json", "x-role": "cp.admin" };
const tenantId = "tenant:default";

let manifest = null;
let currentRelease = "dev-001";

const nav = document.getElementById("nav");
const view = document.getElementById("view");
const releaseInput = document.getElementById("releaseId");

document.getElementById("loadManifest").onclick = async () => {
  currentRelease = releaseInput.value;
  const res = await fetch(`${apiBase}/runtime/manifest?release=${currentRelease}`, { headers });
  if (!res.ok) {
    view.innerHTML = `<section><h2>System Locked — Manifest Required</h2></section>`;
    return;
  }
  manifest = await res.json();
  await applyTheme();
  renderNav();
  renderRoute();
};

async function applyTheme() {
  const theme = manifest?.themes || {};
  const releaseId = manifest?.release_id || currentRelease;
  try {
    const res = await fetch(`${apiBase}/runtime/theme-vars?release=${releaseId}`, { headers });
    if (res.ok) {
      const css = await res.text();
      let el = document.getElementById("theme-vars");
      if (!el) {
        el = document.createElement("style");
        el.id = "theme-vars";
        document.head.appendChild(el);
      }
      el.textContent = css;
    }
  } catch {}
  const root = document.documentElement;
  if (theme.active_theme_id) root.dataset.theme = theme.active_theme_id;
  if (theme.active_theme_variant) root.dataset.themeVariant = theme.active_theme_variant;
  if (theme.active_density_id) root.dataset.density = theme.active_density_id;
  if (theme.active_typography_id) root.dataset.typography = theme.active_typography_id;
  if (theme.active_motion_id) root.dataset.motion = theme.active_motion_id;
}

function renderNav() {
  nav.innerHTML = "";
  const routes = (manifest?.routes?.routes || []).filter((r) => r.surface === "client");
  for (const r of routes) {
    if (!moduleActiveForRoute(r)) continue;
    const a = document.createElement("a");
    a.href = `#${r.path}`;
    a.textContent = r.path;
    nav.appendChild(a);
  }
}

function isEntitled(route, page) {
  const tenantEnt = new Set((manifest?.tenant_entitlements || []).filter((e) => e.tenant_id === tenantId && e.enabled !== false).map((e) => e.entitlement_id));
  if (route?.entitlement_gate_id && !tenantEnt.has(route.entitlement_gate_id)) return false;
  const requiredCaps = page?.capabilities_required || [];
  const caps = new Set(manifest?.capabilities || []);
  for (const cap of requiredCaps) {
    if (!caps.has(cap)) return false;
  }
  return true;
}

function guardAllowed(route) {
  const guardPacks = new Set((manifest?.permissions?.guard_packs || []).map((g) => g.guard_pack_id));
  if (guardPacks.size === 0) return true;
  if (route?.guard_pack_id && !guardPacks.has(route.guard_pack_id)) return false;
  return true;
}

function parseHash() {
  const raw = location.hash ? location.hash.slice(1) : "/";
  const [path, query] = raw.split("?");
  const params = new URLSearchParams(query || "");
  return { path: path || "/", section: params.get("section") || "" };
}

function renderRoute() {
  const { path, section } = parseHash();
  const routes = (manifest?.routes?.routes || []).filter((r) => r.surface === "client");
  const route = routes.find((r) => r.path === path);
  if (!route) {
    view.innerHTML = `<section><h2>Not Found</h2></section>`;
    return;
  }
  if (!moduleActiveForRoute(route)) {
    view.innerHTML = `<section><h2>Not Found</h2></section>`;
    return;
  }
  const pages = manifest.pages?.pages || [];
  const versions = manifest.pages?.page_versions || [];
  const page = pages.find((p) => p.id === route.page_id);
  if (!guardAllowed(route) || !isEntitled(route, page)) {
    view.innerHTML = `<section><h2>Access Denied</h2><p>Entitlement or guard missing.</p></section>`;
    return;
  }
  const version = versions.find((v) => v.page_id === route.page_id) || {};
  const widgets = manifest.pages?.widgets || [];
  const widgetIds = version.widget_instance_ids || [];
  const widgetsForPage = widgets.filter((w) => widgetIds.includes(w.id));
  const sectionsV2Entry = (manifest.pages?.sections_v2 || []).find((ps) => ps.page_id === route.page_id);
  const sections = (manifest.pages?.sections || []).filter((s) => s.page_id === route.page_id);
  const ordered = sections.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const orderedV2 = sectionsV2Entry ? (sectionsV2Entry.sections || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const useV2 = orderedV2.length > 0;
  const activeKey = section || (useV2 ? orderedV2[0]?.key : ordered[0]?.section_key) || "__default";
  const activeV2 = useV2 ? orderedV2.find((s) => s.key === activeKey) || orderedV2[0] : null;
  const active = !useV2 ? (ordered.find((s) => s.section_key === activeKey) || ordered[0]) : null;
  const activeWidgetIds = useV2 && activeV2 ? new Set((activeV2.widgets || []).map((n) => n.id)) : new Set(active?.widget_instance_ids || widgetIds);
  const widgetsForSection = useV2 && activeV2
    ? (activeV2.widgets || []).map((n) => {
        const fromCatalog = widgets.find((w) => w.id === n.id);
        return { id: n.id, widget_id: n.widget_type || fromCatalog?.widget_id, props: n.props || fromCatalog?.props || {}, props_schema: fromCatalog?.props_schema || { allowed_props: Object.keys(n.props || {}).concat("datasource_id", "title", "columns", "fields") } };
      })
    : widgetsForPage.filter((w) => activeWidgetIds.has(w.id));
  const rendered = widgetsForSection.map((w) => safeRender(w));

  const tabList = useV2 ? orderedV2 : ordered.map((s) => ({ key: s.section_key, label: s.title_key || s.section_key }));
  const tabs = tabList
    .map((s) => {
      const key = s.key || s.section_key;
      const label = s.label || s.title_key || key;
      const isActive = key === activeKey;
      return `<button data-section="${key}" ${isActive ? "data-active=\"1\"" : ""}>${label}</button>`;
    })
    .join("");

  view.innerHTML = `
    <section>
      <h2>${page?.title_key || page?.id}</h2>
      ${ordered.length ? `<div id="tabs">${tabs}</div>` : ""}
      <pre>${JSON.stringify(rendered, null, 2)}</pre>
    </section>
  `;
  const tabEl = document.getElementById("tabs");
  if (tabEl) {
    tabEl.onclick = (e) => {
      const btn = e.target.closest("button[data-section]");
      if (!btn) return;
      const next = btn.getAttribute("data-section");
      location.hash = `${path}?section=${next}`;
    };
  }
}

function safeRender(widget) {
  const schema = widget.props_schema || { allowed_props: [] };
  const allowed = new Set(schema.allowed_props || []);
  const props = widget.props || {};
  for (const k of Object.keys(props)) {
    if (!allowed.has(k)) {
      throw new Error(`Prop not allowed: ${k}`);
    }
  }
  return { widget_id: widget.id, props, rendered: true };
}

function moduleActiveForRoute(route) {
  const pages = manifest.pages?.pages || [];
  const page = pages.find((p) => p.id === route.page_id);
  const moduleId = page?.module_id;
  if (!moduleId) return true;
  const activations = (manifest?.module_activations || []).filter((m) => m.tenant_id === tenantId && m.state === "active");
  return activations.some((a) => a.module_id === moduleId);
}

window.onhashchange = () => {
  if (!manifest) return;
  renderRoute();
};
