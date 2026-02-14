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
  const links = routes.map((r) => ({ label: r.path, hash: `#route:${r.route_id}` }));
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
  const path = location.hash ? location.hash.slice(1) : "";
  if (path.endsWith("/cp/studio/pages")) renderPagesView();
  else if (path.endsWith("/cp/studio/routes")) renderRoutesView();
  else if (path.endsWith("/cp/studio/nav")) renderNavView();
  else if (path.endsWith("/cp/studio/releases")) renderReleasesView();
  else if (path.endsWith("/cp/studio/health")) renderHealthView();
};

if (STRICT_MANIFEST_MODE) {
  renderLocked();
}
