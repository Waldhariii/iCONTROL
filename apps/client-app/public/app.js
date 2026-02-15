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
  renderNav();
  renderRoute();
};

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

function renderRoute() {
  const path = location.hash ? location.hash.slice(1) : "/";
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

  const rendered = widgetsForPage.map((w) => safeRender(w));
  view.innerHTML = `
    <section>
      <h2>${page?.title_key || page?.id}</h2>
      <pre>${JSON.stringify(rendered, null, 2)}</pre>
    </section>
  `;
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
