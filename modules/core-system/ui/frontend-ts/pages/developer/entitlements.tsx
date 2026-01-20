/**
 * ICONTROL_CP_DEVELOPER_ENTITLEMENTS_V2
 * SSOT Developer Entitlements page (CP)
 */
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { OBS } from "/src/core/runtime/obs";
import { recordObs } from "/src/core/runtime/audit";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";
import { canAccess } from "./contract";

import { getRole } from "/src/runtime/rbac";
import { coreBaseStyles } from "../../shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";
import { createContextualEmptyState } from "/src/core/ui/emptyState";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showToast } from "/src/core/ui/toast";
import { createCardSkeleton } from "/src/core/ui/skeletonLoader";
import { getMountEl } from "/src/router";
import { loadEntitlements, saveEntitlements, clearEntitlements, DEFAULT_ENTITLEMENTS, type Entitlements } from "/src/core/entitlements";
import { navigate } from "/src/runtime/navigate";

type EntitlementStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

type EntitlementRow = {
  id: string;
  plan: string;
  status: EntitlementStatus;
  source: string;
  updatedAt?: string;
};

type EntitlementsData = {
  rows: EntitlementRow[];
  plan: string;
  active: number;
  inactive: number;
  expired: number;
  lastUpdated: string;
};

type Mode = "live" | "demo" | "error";

let currentRoot: HTMLElement | null = null;

function getTenantId(): string {
  return "local";
}

export function renderDeveloperEntitlementsPage(root: HTMLElement): void {
  void renderDeveloperEntitlementsPageAsync(root);
}

async function renderDeveloperEntitlementsPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "developer_entitlements", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const { shell, content } = createPageShell({
        title: "Developer Entitlements",
        subtitle: "Provisioning manuel et gouvernance",
        safeMode: mapSafeMode(safeMode),
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const grid = document.createElement("div");
  grid.style.minWidth = "0";
  grid.style.boxSizing = "border-box";
      grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";
      grid.appendChild(createCardSkeleton());
      grid.appendChild(createCardSkeleton());
      content.appendChild(grid);

      const { card: detailCard, body: detailBody } = createSectionCard({
        title: "Entitlements",
        description: "Chargement..."
      });
      detailBody.appendChild(createCardSkeleton());
      content.appendChild(detailCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, error, mode, entitlements } = await getEntitlementsData();
  renderData(root, data, error, mode, entitlements);
}

function renderData(
  root: HTMLElement,
  data: EntitlementsData,
  error: string | null,
  mode: Mode,
  entitlements: Entitlements
): void {
  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();

    const statusBadge = mode === "live"
      ? { label: "LIVE", tone: "ok" as const }
      : mode === "demo"
        ? { label: "DEMO", tone: "warn" as const }
        : { label: "ERREUR", tone: "err" as const };

    const { shell, content } = createPageShell({
      title: "Developer Entitlements",
      subtitle: "Provisioning manuel et gouvernance",
      safeMode: mapSafeMode(getSafeMode()),
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";

    const { card: summaryCard, body: summaryBody } = createSectionCard({
      title: "Resume",
      description: "Entitlements et plan"
    });
    if (error) {
      summaryBody.appendChild(createErrorState({ code: "ERR_ENTITLEMENTS_FETCH", message: error }));
    }
    summaryBody.appendChild(createKpiRow("Plan", data.plan, data.plan === "FREE" ? "warn" : "ok"));
    summaryBody.appendChild(createKpiRow("Actifs", String(data.active), data.active > 0 ? "ok" : "warn"));
    summaryBody.appendChild(createKpiRow("Inactifs", String(data.inactive), "neutral"));
    summaryBody.appendChild(createKpiRow("Expires", String(data.expired), data.expired > 0 ? "warn" : "ok"));
    grid.appendChild(summaryCard);

    const { card: govCard, body: govBody } = createSectionCard({
      title: "Gouvernance",
      description: "Roles et SAFE_MODE"
    });
    govBody.appendChild(createKpiRow("Role", getRole(), "neutral"));
    govBody.appendChild(createKpiRow("SAFE_MODE", mapSafeMode(getSafeMode()), mapSafeMode(getSafeMode()) === "STRICT" ? "err" : mapSafeMode(getSafeMode()) === "COMPAT" ? "warn" : "ok"));
    govBody.appendChild(createKpiRow("Tenant", getTenantId(), "neutral"));
    grid.appendChild(govCard);

    content.appendChild(grid);

    const { card: provisionCard, body: provisionBody } = createSectionCard({
      title: "Provisioning manuel",
      description: "Activation/desactivation locale"
    });

    const planSelect = document.createElement("select");
    planSelect.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:#121516;color:var(--ic-text,#e7ecef);font-size:12px;";
    ["FREE", "PRO", "ENTERPRISE"].forEach((plan) => {
      const opt = document.createElement("option");
      opt.value = plan;
      opt.textContent = plan;
      planSelect.appendChild(opt);
    });
    planSelect.value = entitlements.plan;

    const moduleInput = document.createElement("input");
    moduleInput.placeholder = "ex: recommendations.pro";
    moduleInput.value = "recommendations.pro";
    moduleInput.style.cssText = "flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:#121516;color:var(--ic-text,#e7ecef);font-size:12px;";

    const setPlanBtn = createActionButton("Appliquer plan", () => {
      const next = { ...entitlements, plan: planSelect.value as Entitlements["plan"] };
      persistEntitlements(next);
    });

    const enableBtn = createActionButton("Activer module", () => {
      const key = moduleInput.value.trim();
      if (!key) return;
      const next = { ...entitlements, modules: { ...entitlements.modules, [key]: true } };
      persistEntitlements(next);
    });

    const disableBtn = createActionButton("Desactiver module", () => {
      const key = moduleInput.value.trim();
      if (!key) return;
      const next = { ...entitlements, modules: { ...entitlements.modules, [key]: false } };
      persistEntitlements(next);
    });

    const resetBtn = createActionButton("Reset FREE", () => {
      clearEntitlements(getTenantId());
      persistEntitlements({ ...DEFAULT_ENTITLEMENTS, modules: { ...DEFAULT_ENTITLEMENTS.modules } });
    });

    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; align-items:center;";
    row.appendChild(planSelect);
    row.appendChild(setPlanBtn);
    row.appendChild(moduleInput);
    row.appendChild(enableBtn);
    row.appendChild(disableBtn);
    row.appendChild(resetBtn);

    provisionBody.appendChild(row);
    content.appendChild(provisionCard);

    const { card: detailCard, body: detailBody } = createSectionCard({
      title: "Entitlements",
      description: "Liste detaillee (recherche + filtres)"
    });

    const state = { search: "", status: "", plan: "" };
    const tableContainer = document.createElement("div");

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher module, statut...",
      onSearch: (v) => {
        state.search = (v || "").toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Statut",
          options: [
            { label: "Tous", value: "" },
            { label: "ACTIVE", value: "ACTIVE" },
            { label: "INACTIVE", value: "INACTIVE" },
            { label: "EXPIRED", value: "EXPIRED" }
          ],
          onChange: (v) => {
            state.status = v;
            renderTable();
          }
        },
        {
          label: "Plan",
          options: [
            { label: "Tous", value: "" },
            { label: "FREE", value: "FREE" },
            { label: "PRO", value: "PRO" },
            { label: "ENTERPRISE", value: "ENTERPRISE" }
          ],
          onChange: (v) => {
            state.plan = v;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refreshEntitlements() },
        { label: "Exporter JSON", onClick: () => exportJson(data.rows) },
        { label: "Aller a Developer", onClick: () => { navigate("#/developer"); } }
      ]
    });

    detailBody.appendChild(toolbar);
    detailBody.appendChild(tableContainer);

    const columns: TableColumn<EntitlementRow>[] = [
      { key: "id", label: "Module", sortable: true },
      { key: "plan", label: "Plan", sortable: true, render: (v) => createBadge(String(v), "neutral") },
      {
        key: "status",
        label: "Statut",
        sortable: true,
        render: (v) => createBadge(String(v), String(v) === "ACTIVE" ? "ok" : String(v) === "EXPIRED" ? "err" : "warn")
      },
      { key: "source", label: "Source", sortable: true, render: (v) => createBadge(String(v), "neutral") },
      { key: "updatedAt", label: "Updated", sortable: true, render: (v) => {
          const div = document.createElement("div");
          div.textContent = v ? formatDateTime(String(v)) : "—";
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      }
    ];

    function renderTable(): void {
      tableContainer.innerHTML = "";
      const filtered = data.rows.filter((row) => {
        const matchStatus = !state.status || row.status === state.status;
        const matchPlan = !state.plan || row.plan === state.plan;
        const q = state.search;
        const matchSearch = !q || row.id.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
        return matchStatus && matchPlan && matchSearch;
      });

      const table = createDataTable({
        columns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 12,
        actions: (row) => [
          { label: "Copier ID", onClick: () => copyToClipboard(row.id) },
          { label: "Copier plan", onClick: () => copyToClipboard(row.plan) },
          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
        ]
      });
      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("developer_entitlements", {
          searchQuery: state.search || undefined,
          onClearFilter: () => {
            state.search = "";
            state.status = "";
            state.plan = "";
            if (searchInput) searchInput.value = "";
            renderTable();
          }
        }));
      }
    }

    renderTable();
    content.appendChild(detailCard);
    root.appendChild(shell);
  });
}

function createKpiRow(label: string, value: string, tone: "ok" | "warn" | "err" | "neutral"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size:12px;color:var(--ic-mutedText,#a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = `font-size:13px;font-weight:600;color:${tone === "err" ? "var(--ic-error,#f48771)" : tone === "warn" ? "var(--ic-warn,#f59e0b)" : tone === "ok" ? "var(--ic-success,#4ec9b0)" : "var(--ic-text,#e7ecef)"};`;
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function createActionButton(label: string, onClick: () => void): HTMLElement {
  const btn = document.createElement("button");
  btn.className = "cxBtn";
  btn.textContent = label;
  btn.style.cssText = "padding:8px 12px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:var(--ic-panel,#1a1d1f);color:var(--ic-text,#e7ecef);font-size:12px;font-weight:600;cursor:pointer;";
  btn.onclick = onClick;
  return btn;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

async function getEntitlementsData(): Promise<{ data: EntitlementsData; error: string | null; mode: Mode; entitlements: Entitlements }> {
  const tenantId = getTenantId();
  const localEntitlements = loadEntitlements(tenantId);
  const demoRows = buildDemoRows();
  let rows: EntitlementRow[] = [];
  let plan = localEntitlements.plan || "FREE";
  let error: string | null = null;
  let mode: Mode = "demo";

  const apiRes = await fetchJsonSafe("/api/cp/entitlements");
  if (apiRes.ok && apiRes.data) {
    rows = normalizeApiRows(apiRes.data);
    plan = apiRes.data.plan || plan;
    mode = "live";
  } else if (apiRes.error) {
    error = apiRes.error;
  }

  const subRes = await fetchJsonSafe("/api/cp/subscriptions");
  if (subRes.ok && subRes.data && mode !== "live") {
    rows = normalizeSubscriptionRows(subRes.data);
    mode = "live";
  }

  if (rows.length === 0) {
    rows = normalizeLocalRows(localEntitlements);
  }

  if (rows.length === 0) {
    rows = demoRows;
  }

  const counts = countRows(rows);
  const data: EntitlementsData = {
    rows,
    plan: plan || "FREE",
    active: counts.active,
    inactive: counts.inactive,
    expired: counts.expired,
    lastUpdated: new Date().toISOString()
  };

  return { data, error, mode, entitlements: localEntitlements };
}

function normalizeLocalRows(entitlements: Entitlements): EntitlementRow[] {
  const rows: EntitlementRow[] = [];
  const updatedAt = new Date().toISOString();
  Object.entries(entitlements.modules || {}).forEach(([key, enabled]) => {
    rows.push({
      id: key,
      plan: entitlements.plan || "FREE",
      status: enabled ? "ACTIVE" : "INACTIVE",
      source: "LOCAL",
      updatedAt
    });
  });
  return rows;
}

function normalizeApiRows(raw: any): EntitlementRow[] {
  const rows: EntitlementRow[] = [];
  const list = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
  list.forEach((item: any) => {
    rows.push({
      id: String(item.id || item.key || item.module || "unknown"),
      plan: String(item.plan || item.tier || "FREE"),
      status: mapStatus(item.status),
      source: String(item.source || "API"),
      updatedAt: item.updatedAt || item.updated_at
    });
  });
  return rows;
}

function normalizeSubscriptionRows(raw: any): EntitlementRow[] {
  const rows: EntitlementRow[] = [];
  const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.rows) ? raw.rows : [];
  list.forEach((item: any) => {
    rows.push({
      id: String(item.name || item.id || "module"),
      plan: String(item.plan || "FREE"),
      status: item.status === "ACTIVE" ? "ACTIVE" : item.status === "EXPIRED" ? "EXPIRED" : "INACTIVE",
      source: "SUBSCRIPTION",
      updatedAt: item.updatedAt || item.activatedAt || item.expiresAt
    });
  });
  return rows;
}

function mapStatus(value: any): EntitlementStatus {
  const v = String(value || "ACTIVE").toUpperCase();
  if (v == "EXPIRED") return "EXPIRED";
  if (v == "INACTIVE") return "INACTIVE";
  return "ACTIVE";
}

function countRows(rows: EntitlementRow[]): { active: number; inactive: number; expired: number } {
  return {
    active: rows.filter((r) => r.status === "ACTIVE").length,
    inactive: rows.filter((r) => r.status === "INACTIVE").length,
    expired: rows.filter((r) => r.status === "EXPIRED").length
  };
}

function buildDemoRows(): EntitlementRow[] {
  const now = Date.now();
  const make = (i: number, status: EntitlementStatus): EntitlementRow => ({
    id: `module.demo.${i}`,
    plan: i % 3 === 0 ? "ENTERPRISE" : i % 2 === 0 ? "PRO" : "FREE",
    status,
    source: "DEMO",
    updatedAt: new Date(now - i * 1000 * 60 * 5).toISOString()
  });
  return [
    make(1, "ACTIVE"),
    make(2, "ACTIVE"),
    make(3, "ACTIVE"),
    make(4, "INACTIVE"),
    make(5, "INACTIVE"),
    make(6, "INACTIVE"),
    make(7, "EXPIRED"),
    make(8, "ACTIVE"),
    make(9, "ACTIVE"),
    make(10, "INACTIVE"),
    make(11, "ACTIVE"),
    make(12, "ACTIVE")
  ];
}

function persistEntitlements(next: Entitlements): void {
  saveEntitlements(getTenantId(), next);
  showToast({ status: "success", message: "Entitlements sauvegardes." });
  refreshEntitlements();
}

function exportJson(rows: EntitlementRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_entitlements_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    showToast({ status: "warning", message: "Aucune valeur a copier." });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: "success", message: "Copie reussie." });
  } catch {
    showToast({ status: "warning", message: "Copie impossible (permissions navigateur)." });
  }
}

function refreshEntitlements(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderDeveloperEntitlementsPageAsync(target);
}
