const apiBase = "http://localhost:7070/api";
const headers = { "Content-Type": "application/json", "x-role": "cp.admin" };

let manifest = null;
let currentRelease = "dev-001";
const STRICT_MANIFEST_MODE = window.STRICT_MANIFEST_MODE !== false;

const nav = document.getElementById("nav");
const view = document.getElementById("view");
const releaseInput = document.getElementById("releaseId");
const previewInput = document.getElementById("previewId");
const modeSelect = document.getElementById("mode");

document.getElementById("loadManifest").onclick = async () => {
  const mode = modeSelect?.value || "active";
  if (mode === "preview") {
    const previewId = previewInput.value;
    currentRelease = `preview-${previewId}`;
    const res = await fetch(`${apiBase}/runtime/manifest?release=${currentRelease}&preview=${previewId}`, { headers });
    if (!res.ok) {
      manifest = null;
      renderLocked();
      return;
    }
    manifest = await res.json();
    renderNav();
    window.onhashchange();
    return;
  }

  currentRelease = releaseInput.value;
  const res = await fetch(`${apiBase}/runtime/manifest?release=${currentRelease}`, { headers });
  if (!res.ok) {
    manifest = null;
    renderLocked();
    return;
  }
  manifest = await res.json();
  renderNav();
  window.onhashchange();
};

function renderLocked() {
  nav.innerHTML = "";
  view.innerHTML = `<section><h2>System Locked — Manifest Required</h2><p>No valid manifest loaded.</p></section>`;
}

function renderNav() {
  nav.innerHTML = "";
  const routes = (manifest?.routes?.routes || []).filter((r) => r.surface === "cp");
  const navSpecs = (manifest?.nav?.nav_specs || []).filter((n) => n.surface === "cp");
  const labelByPath = new Map(navSpecs.map((n) => [n.path, n.label || n.id]));
  const links = routes.map((r) => ({ label: labelByPath.get(r.path) || r.path, hash: `#route:${r.route_id}` }));
  for (const l of links) {
    const a = document.createElement("a");
    a.href = l.hash;
    a.textContent = l.label;
    nav.appendChild(a);
  }
}

function renderPagesView() {
  const pages = manifest?.pages?.pages || [];
  view.innerHTML = `
    <section>
      <h2>Pages</h2>
      <button id="newPageBtn">New Page</button>
      <ul>${pages.map((p) => `<li>${p.id} / ${p.slug}</li>`).join("")}</ul>
    </section>
    <section id="editor"></section>
  `;
  document.getElementById("newPageBtn").onclick = () => renderEditor();
}

function renderEditor() {
  const el = document.getElementById("editor");
  el.innerHTML = `
    <h3>Page Editor</h3>
    <div class="grid">
      <div>
        <label>Page ID</label><input id="pageId" />
        <label>Slug</label><input id="pageSlug" />
        <label>Title Key</label><input id="pageTitle" />
        <label>Layout Template</label><input id="layoutId" />
      </div>
      <div>
        <label>Widget IDs (comma)</label><input id="widgetIds" />
        <label>Changeset ID</label><input id="csId" />
        <button id="createChangeset">Create Changeset</button>
        <button id="preview">Preview</button>
        <button id="publish">Publish</button>
      </div>
    </div>
  `;
  document.getElementById("createChangeset").onclick = async () => {
    const cs = await fetch(`${apiBase}/changesets`, { method: "POST", headers }).then((r) => r.json());
    document.getElementById("csId").value = cs.id;
  };
  document.getElementById("preview").onclick = async () => {
    const csId = document.getElementById("csId").value;
    await createPageOps(csId);
    await fetch(`${apiBase}/changesets/${csId}/preview`, { method: "POST", headers });
    await fetch(`${apiBase}/changesets/${csId}/validate`, { method: "POST", headers });
    alert("Preview compiled + gates run");
  };
  document.getElementById("publish").onclick = async () => {
    const csId = document.getElementById("csId").value;
    await createPageOps(csId);
    await fetch(`${apiBase}/changesets/${csId}/publish`, { method: "POST", headers });
    alert("Published");
  };
}

async function createPageOps(csId) {
  const pageId = document.getElementById("pageId").value;
  const slug = document.getElementById("pageSlug").value;
  const title = document.getElementById("pageTitle").value;
  const layoutId = document.getElementById("layoutId").value;
  const widgetIds = document.getElementById("widgetIds").value.split(",").map((s) => s.trim()).filter(Boolean);

  const page_definition = {
    id: pageId,
    surface: "cp",
    key: pageId,
    slug,
    title_key: title,
    module_id: "studio",
    default_layout_template_id: layoutId,
    capabilities_required: ["studio.access"],
    owner_team: "studio",
    tags: [],
    state: "active"
  };

  const page_version = {
    page_id: pageId,
    version: "1.0.0",
    status: "draft",
    layout_instance_id: layoutId,
    widget_instance_ids: widgetIds,
    nav_binding_ids: [],
    design_version_lock: "v1",
    checksum: "local",
    rollback_ref: "",
    created_by: "studio",
    created_at: new Date().toISOString(),
    diff_ref: ""
  };

  await fetch(`${apiBase}/studio/pages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ changeset_id: csId, page_definition, page_version })
  });
}

function renderRoutesView() {
  view.innerHTML = `
    <section>
      <h2>Routes</h2>
      <button id="loadRoutes">Refresh</button>
      <ul id="routesList"></ul>
      <h3>Add Route</h3>
      <input id="routeId" placeholder="route_id" />
      <input id="routePath" placeholder="/cp/path" />
      <input id="routePageId" placeholder="page_id" />
      <input id="csIdRoute" placeholder="changeset_id" />
      <button id="addRoute">Add</button>
    </section>
  `;
  document.getElementById("loadRoutes").onclick = async () => {
    const list = await fetch(`${apiBase}/studio/routes`, { headers }).then((r) => r.json());
    document.getElementById("routesList").innerHTML = list.map((r) => `<li>${r.route_id} ${r.path}</li>`).join("");
  };
  document.getElementById("addRoute").onclick = async () => {
    const route_spec = {
      route_id: document.getElementById("routeId").value,
      surface: "cp",
      path: document.getElementById("routePath").value,
      page_id: document.getElementById("routePageId").value,
      guard_pack_id: "guard:default",
      flag_gate_id: "flag:default",
      entitlement_gate_id: "entitlement:default",
      priority: 10,
      canonical: true,
      aliases: [],
      deprecation_date: "",
      redirect_to: ""
    };
    const changeset_id = document.getElementById("csIdRoute").value;
    await fetch(`${apiBase}/studio/routes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ changeset_id, route_spec })
    });
    alert("Route op added");
  };
}

function renderNavView() {
  view.innerHTML = `
    <section>
      <h2>Navigation</h2>
      <button id="loadNav">Refresh</button>
      <ul id="navList"></ul>
      <h3>Add Nav Spec</h3>
      <input id="navId" placeholder="nav_id" />
      <input id="navRouteId" placeholder="route_id" />
      <input id="csIdNav" placeholder="changeset_id" />
      <button id="addNav">Add</button>
    </section>
  `;
  document.getElementById("loadNav").onclick = async () => {
    const list = await fetch(`${apiBase}/studio/nav`, { headers }).then((r) => r.json());
    document.getElementById("navList").innerHTML = list.map((n) => `<li>${n.id} ${n.route_id}</li>`).join("");
  };
  document.getElementById("addNav").onclick = async () => {
    const nav_spec = { id: document.getElementById("navId").value, route_id: document.getElementById("navRouteId").value };
    const changeset_id = document.getElementById("csIdNav").value;
    await fetch(`${apiBase}/studio/nav`, {
      method: "POST",
      headers,
      body: JSON.stringify({ changeset_id, nav_spec })
    });
    alert("Nav op added");
  };
}

function renderModulesView() {
  view.innerHTML = `
    <section>
      <h2>Modules</h2>
      <button id="loadModules">Refresh</button>
      <button id="newModule">New Module</button>
      <ul id="modulesList"></ul>
    </section>
  `;
  document.getElementById("loadModules").onclick = async () => {
    const list = await fetch(`${apiBase}/studio/modules`, { headers }).then((r) => r.json());
    document.getElementById("modulesList").innerHTML = list
      .map((m) => `<li>${m.module_id} (${m.tier}) v${m.latest_version || "n/a"} - active_tenants:${m.active_tenants} <button data-id="${m.module_id}" class="edit">Edit</button></li>`)
      .join("");
    document.querySelectorAll(".edit").forEach((b) => {
      b.onclick = () => {
        location.hash = `/cp/studio/modules/${b.dataset.id}`;
      };
    });
  };
  document.getElementById("newModule").onclick = () => {
    location.hash = `/cp/studio/modules/new`;
  };
}

async function renderMarketplaceCatalog() {
  const catalog = await fetch(`${apiBase}/marketplace/catalog`, { headers }).then((r) => r.json()).catch(() => []);
  view.innerHTML = `
    <section>
      <h2>Marketplace</h2>
      <div>
        <label>Tenant ID</label><input id="marketTenant" value="tenant:default" />
        <button id="openTenantMarket">Open Tenant Marketplace</button>
      </div>
      <h3>Catalog</h3>
      <ul>${catalog.map((c) => `<li>${c.type} ${c.id} v${c.version} (${c.tier}) [${c.review_status}]</li>`).join("")}</ul>
    </section>
  `;
  document.getElementById("openTenantMarket").onclick = () => {
    const tenantId = document.getElementById("marketTenant").value;
    location.hash = `/cp/studio/tenants/${tenantId}/marketplace`;
  };
}

async function renderTenantMarketplace(tenantId) {
  const [catalog, installed] = await Promise.all([
    fetch(`${apiBase}/marketplace/catalog`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${apiBase}/marketplace/tenants/${tenantId}/installed`, { headers }).then((r) => r.json()).catch(() => ({ modules: [], extensions: [] }))
  ]);
  const installedMap = new Map();
  for (const m of installed.modules || []) installedMap.set(`module:${m.module_id}`, m);
  for (const e of installed.extensions || []) installedMap.set(`extension:${e.extension_id}`, e);
  view.innerHTML = `
    <section>
      <h2>Tenant Marketplace</h2>
      <div>Tenant: <strong>${tenantId}</strong></div>
      <button id="backToCatalog">Back</button>
      <h3>Catalog</h3>
      <ul id="marketItems"></ul>
      <h3>Pending Reviews</h3>
      <ul id="reviewList"></ul>
      <pre id="impactOut"></pre>
    </section>
  `;
  document.getElementById("backToCatalog").onclick = () => {
    location.hash = "/cp/studio/marketplace";
  };
  const list = document.getElementById("marketItems");
  list.innerHTML = catalog.map((c) => {
    const key = `${c.type}:${c.id}`;
    const state = installedMap.get(key)?.state || "not_installed";
    return `<li>
      ${c.type} ${c.id} v${c.version} (${c.tier}) [${c.review_status}] state=${state}
      <button data-act="install" data-type="${c.type}" data-id="${c.id}" data-version="${c.version}">Install</button>
      <button data-act="enable" data-type="${c.type}" data-id="${c.id}" data-version="${c.version}">Enable</button>
      <button data-act="disable" data-type="${c.type}" data-id="${c.id}" data-version="${c.version}">Disable</button>
      <button data-act="uninstall" data-type="${c.type}" data-id="${c.id}" data-version="${c.version}">Uninstall</button>
      <button data-act="impact" data-type="${c.type}" data-id="${c.id}" data-version="${c.version}">Preview Impact</button>
    </li>`;
  }).join("");
  list.querySelectorAll("button").forEach((b) => {
    b.onclick = async () => {
      const type = b.dataset.type;
      const id = b.dataset.id;
      const version = b.dataset.version;
      const act = b.dataset.act;
      const url = act === "impact"
        ? `${apiBase}/marketplace/tenants/${tenantId}/impact`
        : `${apiBase}/marketplace/tenants/${tenantId}/${act}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ type, id, version, reason: "studio" })
      });
      const out = await res.text();
      document.getElementById("impactOut").textContent = out;
      if (act !== "impact") alert(`${act} done`);
    };
  });
  const reviews = await fetch(`${apiBase}/marketplace/reviews?status=pending`, { headers }).then((r) => r.json()).catch(() => []);
  const reviewList = document.getElementById("reviewList");
  reviewList.innerHTML = reviews.map((r) => `<li>${r.id} ${r.extension_id} v${r.version} status=${r.status}
    <button data-act="approve" data-id="${r.id}">Approve</button>
    <button data-act="reject" data-id="${r.id}">Reject</button>
  </li>`).join("");
  reviewList.querySelectorAll("button").forEach((b) => {
    b.onclick = async () => {
      const act = b.dataset.act;
      const id = b.dataset.id;
      await fetch(`${apiBase}/marketplace/reviews/${id}/${act}`, { method: "POST", headers });
      alert(`Review ${act}`);
    };
  });
}

async function renderModuleEditor(moduleId) {
  let moduleData = null;
  if (moduleId && moduleId !== "new") {
    moduleData = await fetch(`${apiBase}/studio/modules/${moduleId}`, { headers }).then((r) => r.json());
  }
  const mod = moduleData?.module || {
    module_id: "",
    name: "",
    tier: "free",
    surfaces: ["client"],
    provides: { pages: [], routes: [], nav: [], widgets: [], forms: [], workflows: [], datasources: [] },
    required_capabilities: ["client.access"],
    default_entitlements: ["entitlement:default"],
    dependencies: ["platform:datasource"]
  };
  view.innerHTML = `
    <section>
      <h2>Module Editor</h2>
      <div class="grid">
        <div>
          <label>Module ID</label><input id="modId" value="${mod.module_id}" />
          <label>Name</label><input id="modName" value="${mod.name}" />
          <label>Tier</label><input id="modTier" value="${mod.tier}" />
          <label>Capabilities (comma)</label><input id="modCaps" value="${(mod.required_capabilities || []).join(",")}" />
          <label>Entitlements (comma)</label><input id="modEnts" value="${(mod.default_entitlements || []).join(",")}" />
          <label>Dependencies (comma)</label><input id="modDeps" value="${(mod.dependencies || []).join(",")}" />
        </div>
        <div>
          <label>Provides (JSON)</label>
          <textarea id="modProvides" rows="10">${JSON.stringify(mod.provides || {}, null, 2)}</textarea>
          <label>Changeset ID</label><input id="modCsId" />
          <button id="createChangesetMod">Create Changeset</button>
          <button id="saveModule">Save</button>
          <button id="previewModule">Preview</button>
          <button id="publishModule">Publish</button>
          <label>Tenant ID</label><input id="modTenant" value="tenant:default" />
          <button id="activateModule">Activate</button>
          <button id="deactivateModule">Deactivate</button>
        </div>
      </div>
    </section>
  `;
  document.getElementById("createChangesetMod").onclick = async () => {
    const cs = await fetch(`${apiBase}/changesets`, { method: "POST", headers }).then((r) => r.json());
    document.getElementById("modCsId").value = cs.id;
  };
  document.getElementById("saveModule").onclick = async () => {
    const csId = document.getElementById("modCsId").value;
    const module = {
      module_id: document.getElementById("modId").value,
      name: document.getElementById("modName").value,
      tier: document.getElementById("modTier").value,
      surfaces: ["client"],
      provides: JSON.parse(document.getElementById("modProvides").value || "{}"),
      required_capabilities: document.getElementById("modCaps").value.split(",").map((s) => s.trim()).filter(Boolean),
      default_entitlements: document.getElementById("modEnts").value.split(",").map((s) => s.trim()).filter(Boolean),
      dependencies: document.getElementById("modDeps").value.split(",").map((s) => s.trim()).filter(Boolean)
    };
    const method = moduleId && moduleId !== "new" ? "PATCH" : "POST";
    const url = moduleId && moduleId !== "new" ? `${apiBase}/studio/modules/${module.module_id}` : `${apiBase}/studio/modules`;
    await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ changeset_id: csId, module })
    });
    alert("Module saved to changeset");
  };
  document.getElementById("previewModule").onclick = async () => {
    const csId = document.getElementById("modCsId").value;
    await fetch(`${apiBase}/changesets/${csId}/preview`, { method: "POST", headers });
    await fetch(`${apiBase}/changesets/${csId}/validate`, { method: "POST", headers });
    alert("Preview compiled + gates run");
  };
  document.getElementById("publishModule").onclick = async () => {
    const csId = document.getElementById("modCsId").value;
    const id = document.getElementById("modId").value;
    await fetch(`${apiBase}/studio/modules/${id}/publish`, {
      method: "POST",
      headers,
      body: JSON.stringify({ changeset_id: csId })
    });
    alert("Published");
  };
  document.getElementById("activateModule").onclick = async () => {
    const id = document.getElementById("modId").value;
    const tenantId = document.getElementById("modTenant").value;
    await fetch(`${apiBase}/studio/modules/${id}/activate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tenant_id: tenantId })
    });
    alert("Activated");
  };
  document.getElementById("deactivateModule").onclick = async () => {
    const id = document.getElementById("modId").value;
    const tenantId = document.getElementById("modTenant").value;
    await fetch(`${apiBase}/studio/modules/${id}/deactivate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tenant_id: tenantId })
    });
    alert("Deactivated");
  };
}

async function renderReleasesView() {
  const list = await fetch(`${apiBase}/releases`, { headers }).then((r) => r.json());
  view.innerHTML = `
    <section>
      <h2>Releases</h2>
      <ul>${list.map((r) => `<li>${r.release_id} <button data-id="${r.release_id}" class="act">Activate</button> <button data-id="${r.release_id}" class="rb">Rollback</button></li>`).join("")}</ul>
    </section>
  `;
  document.querySelectorAll(".act").forEach((b) => {
    b.onclick = async () => {
      await fetch(`${apiBase}/releases/${b.dataset.id}/activate`, { method: "POST", headers });
      alert("Activated");
    };
  });
  document.querySelectorAll(".rb").forEach((b) => {
    b.onclick = async () => {
      await fetch(`${apiBase}/releases/${b.dataset.id}/rollback`, { method: "POST", headers });
      alert("Rolled back");
    };
  });
}

async function renderHealthView() {
  const gates = await fetch(`${apiBase}/gates/${currentRelease}/report`, { headers }).then((r) => r.json()).catch(() => null);
  const drift = await fetch(`${apiBase}/drift/report`, { headers }).then((r) => r.json()).catch(() => null);
  view.innerHTML = `
    <section>
      <h2>Health</h2>
      <pre>${JSON.stringify(gates, null, 2)}</pre>
      <pre>${JSON.stringify(drift, null, 2)}</pre>
    </section>
  `;
}

window.onhashchange = () => {
  if (!manifest) return renderLocked();
  const raw = location.hash ? location.hash.slice(1) : "";
  let path = raw;
  if (raw.startsWith("route:")) {
    const routeId = raw.replace(/^route:/, "");
    const route = (manifest?.routes?.routes || []).find((r) => r.route_id === routeId);
    if (route?.path) path = route.path;
  }
  if (path.endsWith("/cp/studio/pages")) renderPagesView();
  else if (path.endsWith("/cp/studio/routes")) renderRoutesView();
  else if (path.endsWith("/cp/studio/nav")) renderNavView();
  else if (path.startsWith("/cp/studio/modules/")) {
    const id = path.split("/")[4];
    renderModuleEditor(id);
  }
  else if (path.endsWith("/cp/studio/modules")) renderModulesView();
  else if (path.startsWith("/cp/studio/tenants/") && path.endsWith("/marketplace")) {
    const id = path.split("/")[4];
    renderTenantMarketplace(id);
  }
  else if (path.endsWith("/cp/studio/marketplace")) renderMarketplaceCatalog();
  else if (path.endsWith("/cp/studio/releases")) renderReleasesView();
  else if (path.endsWith("/cp/studio/health")) renderHealthView();
};

if (STRICT_MANIFEST_MODE) {
  renderLocked();
}
