#!/usr/bin/env bash
set -euo pipefail

# ==========================================================
# CURSOR — GO DASHBOARD (CP Cockpit Dominant V1)
# Extension-first • Tokens-only • Permission-first (RBAC)
# Works with Level 11 freeze: NO business logic in core/platform/runtime/governance
# All business surfaces live under extensions/
# ==========================================================

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT"

echo "====================================================================="
echo "GO DASHBOARD CP — Cockpit Dominant V1"
echo "ROOT=$ROOT"
echo "RUN_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "====================================================================="

# ----------------------------------------------------------
# 0) Preconditions / guardrails
# ----------------------------------------------------------
test ! -f ./CI_REPORT.md || { echo "ERR: root CI_REPORT.md forbidden"; exit 1; }
git status -sb

# ----------------------------------------------------------
# 1) Create extension dashboard surface pack (extermination)
# ----------------------------------------------------------
EXT="extensions/official/extermination"
PACK="$EXT/ssot/packs/extermination_v1"

mkdir -p \
  "$EXT/widgets" \
  "$EXT/ui" \
  "$EXT/docs" \
  "$EXT/tests" \
  "$EXT/.meta" \
  "$PACK/studio/pages" \
  "$PACK/studio/routes" \
  "$PACK/studio/nav" \
  "$PACK/studio/widgets" \
  "$PACK/studio/workflows" \
  "$PACK/data" \
  "$PACK/cp" \
  "$PACK/cp/panels"

# Ensure pack index references exists
if ! test -f "$EXT/ssot/packs/index.json"; then
  cat > "$EXT/ssot/packs/index.json" <<'JSON'
{
  "version": "packs_index.v1",
  "packs": []
}
JSON
fi

node --input-type=module - <<'NODE'
import fs from "fs";
const p = "extensions/official/extermination/ssot/packs/index.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
if (!Array.isArray(j.packs)) j.packs = [];
const id = "pack:extermination:v1";
if (!j.packs.find(x => x && x.pack_id === id)) {
  j.packs.push({ pack_id: id, path: "extensions/official/extermination/ssot/packs/extermination_v1" });
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("OK: packs/index.json added", id);
} else {
  console.log("OK: packs/index.json already has", id);
}
NODE

# ----------------------------------------------------------
# 2) SSOT: Create CP Cockpit page + route + nav (extension pack)
# ----------------------------------------------------------
# NOTE: we keep widget_catalog/instances minimal; panels drive what is visible.
cat > "$PACK/studio/pages/page_definitions.json" <<'JSON'
[
  {
    "version": "page_definition.v1",
    "page_id": "page:cp_cockpit",
    "slug": "cp-cockpit",
    "name": "CP Cockpit",
    "surface_id": "surface:cp",
    "module_id": "module:control_plane",
    "owner": "extension:official:extermination",
    "status": "active"
  }
]
JSON

cat > "$PACK/studio/pages/page_instances.json" <<'JSON'
[
  {
    "version": "page_version.v1",
    "page_version_id": "pv:cp_cockpit:v1",
    "page_id": "page:cp_cockpit",
    "layout_instance_id": "layout-1",
    "widget_instance_ids": [],
    "sections": [
      { "section_key": "tab:activity", "name": "Activity", "widget_instance_ids": [] },
      { "section_key": "main", "name": "Cockpit", "widget_instance_ids": [] }
    ],
    "status": "active"
  }
]
JSON

cat > "$PACK/studio/routes/route_specs.json" <<'JSON'
[
  {
    "version": "route_spec.v1",
    "route_id": "route:cp:cockpit",
    "path": "/cp/cockpit",
    "page_id": "page:cp_cockpit",
    "guard_pack_id": "guard:default",
    "surface_id": "surface:cp",
    "owner": "extension:official:extermination",
    "status": "active"
  }
]
JSON

cat > "$PACK/studio/nav/nav_specs.json" <<'JSON'
[
  {
    "version": "nav_spec.v1",
    "nav_id": "nav:cp:cockpit",
    "section": "Control Plane",
    "label": "Cockpit",
    "path": "/cp/cockpit",
    "icon": "dashboard",
    "owner": "extension:official:extermination",
    "status": "active"
  }
]
JSON

cat > "$PACK/studio/widgets/widget_catalog.json" <<'JSON'
[]
JSON
cat > "$PACK/studio/widgets/widget_instances.json" <<'JSON'
[]
JSON

# Optional stub workflow (safe): refresh KPIs (dry_run/execute allowed by policies)
cat > "$PACK/studio/workflows/workflow_definitions.json" <<'JSON'
[
  {
    "workflow_id": "workflow:cp_refresh_kpis",
    "name": "CP Refresh KPIs",
    "module_id": "module:control_plane",
    "status": "active"
  }
]
JSON

cat > "$PACK/data/query_catalog.json" <<'JSON'
[]
JSON

# ----------------------------------------------------------
# 3) Panels registry (permission-first dashboard)
# Panels are declarative; CP filters by effective_scopes.
# ----------------------------------------------------------
cat > "$PACK/cp/panels/panels.cockpit.v1.json" <<'JSON'
{
  "version": "cp_panels.v1",
  "page_id": "page:cp_cockpit",
  "panels": [
    {
      "panel_id": "panel:kpi.health",
      "title": "Platform Health",
      "required_scopes": ["observability.read"],
      "layout_hint": { "row": "A", "span": 3 },
      "datagov_scope": "datagov:platform",
      "isolation_profile": "iso:cp_read",
      "widget_contracts": ["widget:vertical_kpi_health@v1"]
    },
    {
      "panel_id": "panel:ops.freeze",
      "title": "Freeze Status",
      "required_scopes": ["release.freeze.evaluate"],
      "layout_hint": { "row": "A", "span": 3 },
      "datagov_scope": "datagov:platform",
      "isolation_profile": "iso:cp_ops",
      "widget_contracts": []
    },
    {
      "panel_id": "panel:releases.active",
      "title": "Active Release",
      "required_scopes": ["release.read"],
      "layout_hint": { "row": "B", "span": 6 },
      "datagov_scope": "datagov:platform",
      "isolation_profile": "iso:cp_read",
      "widget_contracts": []
    },
    {
      "panel_id": "panel:security.audit",
      "title": "Audit Feed",
      "required_scopes": ["audit.read"],
      "layout_hint": { "row": "C", "span": 12 },
      "datagov_scope": "datagov:security",
      "isolation_profile": "iso:cp_security",
      "widget_contracts": []
    }
  ]
}
JSON

# ----------------------------------------------------------
# 4) Widget contract: KPI Health (tokens-only, policy-required)
# (If it already exists, keep it; otherwise write minimal valid contract)
# ----------------------------------------------------------
WIDGET_CONTRACT="$EXT/widgets/widget.vertical_kpi_health.widget.json"
if ! test -f "$WIDGET_CONTRACT"; then
  cat > "$WIDGET_CONTRACT" <<'JSON'
{
  "widget_id": "widget:vertical_kpi_health",
  "version": "v1",
  "name": "KPI Health",
  "owner": "extension:official:extermination",
  "ui": {
    "entrypoint": "extensions/official/extermination/ui/widgets/kpi_health.js",
    "render_kind": "panel",
    "tokens_only": true
  },
  "contracts": {
    "inputs": [],
    "outputs": [],
    "bindings": [],
    "actions": { "policy_required": true }
  },
  "security": {
    "required_scopes": ["observability.read"],
    "datagov_scope": "datagov:platform",
    "isolation_profile": "iso:cp_read"
  },
  "observability": { "events": ["widget.render", "widget.error"] }
}
JSON
fi

mkdir -p "$EXT/ui/widgets"
if ! test -f "$EXT/ui/widgets/kpi_health.js"; then
  cat > "$EXT/ui/widgets/kpi_health.js" <<'JS'
/**
 * Tokens-only widget stub (no raw colors).
 * The CP shell can embed this later; for now it's a contract placeholder.
 */
export function renderKpiHealth(el, data) {
  el.innerHTML = `
    <div class="ic-panel">
      <div class="ic-title">KPI Health</div>
      <div class="ic-body">stub</div>
    </div>
  `;
}
JS
fi

# ----------------------------------------------------------
# 5) CP shell: load panels + permission-first filtering (no hardcoded colors)
# Minimal patch to apps/control-plane/public/app.js:
# - fetch /api/access/effective
# - load panels JSON from extension pack path via static fetch (served by Vite later)
# For now: copy panels into apps/control-plane/public/assets/ so the shell can load it
# without needing a new backend route (Level 11 safe).
# ----------------------------------------------------------
mkdir -p apps/control-plane/public/assets/panels
cp -f "$PACK/cp/panels/panels.cockpit.v1.json" apps/control-plane/public/assets/panels/panels.cockpit.v1.json

# Patch app.js: add helper to load panels and filter by scopes, then render list
APP_JS="apps/control-plane/public/app.js"
test -f "$APP_JS" || { echo "ERR: missing $APP_JS"; exit 1; }

node --input-type=module - <<'NODE'
import fs from "fs";

const p = "apps/control-plane/public/app.js";
let s = fs.readFileSync(p, "utf8");

// Remove old __IC_CP_DASH_PERM__ block (up to "let manifest")
s = s.replace(
  /\n\/\* __IC_CP_DASH_PERM__ \*\/[\s\S]*?(?=\nlet manifest = null)/m,
  "\n"
);

// Remove existing CP Cockpit V1 block so we can re-apply (idempotent)
const cockpitBlockStart = "/*__IC_CP_PANELS_V1__*/";
const cockpitBlockEnd = "} else {\n  window.__icBootCockpit();\n}";
const idx1 = s.indexOf(cockpitBlockStart);
if (idx1 !== -1) {
  const idx2 = s.indexOf(cockpitBlockEnd, idx1);
  if (idx2 !== -1) {
    s = s.slice(0, idx1) + s.slice(idx2 + cockpitBlockEnd.length);
  }
}

function ensureOnce(marker, block) {
  if (s.includes(marker)) return;
  s = s + "\n\n" + block + "\n";
}

ensureOnce(
  "/*__IC_CP_PANELS_V1__*/",
  `/*__IC_CP_PANELS_V1__*/
async function icFetchEffectiveScopes(roleIdsCsv) {
  const headers = {};
  if (roleIdsCsv) headers["x-ic-role-ids"] = roleIdsCsv;
  const r = await fetch("/api/access/effective", { headers });
  const j = await r.json();
  return j && j.ok ? j : { ok: false, effective_scopes: [], reasons: ["access_endpoint_failed"] };
}

function icHasScopes(effective, required) {
  const eff = new Set(effective || []);
  if (eff.has("*")) return true;
  for (const sc of (required || [])) if (!eff.has(sc)) return false;
  return true;
}

function icFilterPanels(panels, effective) {
  const eff = effective || [];
  const visible = [];
  const hidden = [];
  for (const p of (panels || [])) {
    const req = p.required_scopes || [];
    if (icHasScopes(eff, req)) visible.push(p);
    else hidden.push({ panel: p, missing: req.filter(x => !eff.includes(x)) });
  }
  return { visible, hidden };
}

async function icLoadPanelsCockpit() {
  const r = await fetch("/assets/panels/panels.cockpit.v1.json");
  const j = await r.json();
  return (j && Array.isArray(j.panels)) ? j.panels : [];
}

function icRenderPanels(el, result) {
  const { visible, hidden } = result;
  const v = visible.map(p => \`<li><b>\${p.title}</b> <span class="ic-muted">(\${p.panel_id})</span></li>\`).join("");
  const h = hidden.map(x => \`<li><b>\${x.panel.title}</b> <span class="ic-muted">hidden</span> <code>\${(x.missing||[]).join(",")}</code></li>\`).join("");
  el.innerHTML = \`
    <div class="ic-panel">
      <div class="ic-title">Cockpit Panels</div>
      <div class="ic-body">
        <div><b>Visible</b><ul>\${v || "<li>none</li>"}</ul></div>
        <div style="margin-top:12px"><b>Hidden (missing scopes)</b><ul>\${h || "<li>none</li>"}</ul></div>
      </div>
    </div>\`;
}`
);

ensureOnce(
  "/*__IC_CP_COCKPIT_BOOT__*/",
  `/*__IC_CP_COCKPIT_BOOT__*/
window.__icBootCockpit = async function __icBootCockpit() {
  const mount = document.querySelector("#app") || document.body;
  const roleIds = (window.localStorage.getItem("ic.role_ids") || "role:viewer");
  const access = await icFetchEffectiveScopes(roleIds);
  const panels = await icLoadPanelsCockpit();
  const filtered = icFilterPanels(panels, access.effective_scopes || []);
  const host = document.createElement("div");
  host.className = "ic-root";
  host.innerHTML = \`
    <div class="ic-header">
      <div class="ic-h1">CP Cockpit (permission-first)</div>
      <div class="ic-muted">roles: <code>\${roleIds}</code></div>
      <div class="ic-muted">Try: localStorage.setItem("ic.role_ids","role:operator"); location.reload()</div>
    </div>
    <div id="ic-panels"></div>\`;
  mount.innerHTML = "";
  mount.appendChild(host);
  icRenderPanels(host.querySelector("#ic-panels"), filtered);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.__icBootCockpit());
} else {
  window.__icBootCockpit();
}`
);

fs.writeFileSync(p, s, "utf8");
console.log("OK: patched", p);
NODE

# ----------------------------------------------------------
# 6) Quick syntax / gates / CI targeted (best effort)
# ----------------------------------------------------------
echo
echo "=== A) Syntax check CP ==="
node --check apps/control-plane/public/app.js

echo
echo "=== B) SSOT validate + gates (dev-001) ==="
# Some repos expose scripts/ci/validate-ssot.mjs; fallback to core module if needed.
if test -f "core/contracts/schema/validate-ssot.mjs"; then
  node core/contracts/schema/validate-ssot.mjs
elif test -f "scripts/ci/validate-ssot.mjs"; then
  node scripts/ci/validate-ssot.mjs
else
  echo "WARN: validate-ssot not found, skipping"
fi
ADR_APPROVED=1 node governance/gates/run-gates.mjs dev-001

echo
echo "=== C) Focus CI (widget + access + cp syntax) ==="
node scripts/ci/test-access-scopes-matrix.mjs
node scripts/ci/test-control-plane-syntax.mjs
node scripts/ci/test-widget-contract-pack.mjs

echo
echo "====================================================================="
echo "DONE — Cockpit v1 skeleton created (permission-first panels)."
echo
echo "Next:"
echo "1) Start API on free port:"
echo "   HOST=127.0.0.1 PORT=0 CI=true pnpm api:dev"
echo "   (or kill port 7070 occupant if you want default)"
echo
echo "2) Start CP:"
echo "   pnpm cp:dev"
echo "   URL: http://127.0.0.1:5173"
echo
echo "3) Test role filtering:"
echo "   localStorage.setItem('ic.role_ids','role:viewer'); location.reload()"
echo "   localStorage.setItem('ic.role_ids','role:operator'); location.reload()"
echo "   localStorage.setItem('ic.role_ids','role:security_officer'); location.reload()"
echo
echo "4) Full CI proof (optional):"
echo "   node scripts/ci/ci-all.mjs"
echo
echo "5) Commit + tag (if all green):"
echo "   git add -A"
echo "   git commit -m \"feat(cp): dominant cockpit v1 (permission-first panels via extension pack)\""
echo "   git tag phaseCP_COCKPIT_DOMINANT_V1_$(date -u +%Y%m%d_%H%M)"
echo "====================================================================="
