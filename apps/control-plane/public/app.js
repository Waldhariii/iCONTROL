const apiBase = "http://localhost:7070/api";
const headers = { "Content-Type": "application/json", "x-role": "cp.admin" };

let manifest = null;
let currentRelease = "dev-001";

const nav = document.getElementById("nav");
const view = document.getElementById("view");
const releaseInput = document.getElementById("releaseId");

document.getElementById("loadManifest").onclick = async () => {
  currentRelease = releaseInput.value;
  manifest = await fetch(`${apiBase}/runtime/manifest/${currentRelease}`, { headers }).then((r) => r.json());
  renderNav();
  renderPagesView();
};

function renderNav() {
  nav.innerHTML = "";
  const routes = (manifest?.routes?.routes || []).filter((r) => r.surface === "cp");
  const links = routes.length
    ? routes.map((r) => ({ label: r.path, hash: `#route:${r.route_id}` }))
    : [
        { label: "Pages", hash: "#pages" },
        { label: "Routes", hash: "#routes" },
        { label: "Navigation", hash: "#nav" },
        { label: "Releases", hash: "#releases" }
      ];
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
    capabilities_required: [],
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

window.onhashchange = () => {
  if (!manifest) return;
  if (location.hash === "#pages") renderPagesView();
};
