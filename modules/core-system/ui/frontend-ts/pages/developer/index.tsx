/**
 * ICONTROL_CP_DEVELOPER_V2
 * SSOT Developer page (CP)
 */
import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { OBS } from "/src/core/runtime/obs";
import { recordObs } from "/src/core/runtime/audit";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";
import { canAccess } from "./contract";

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
import { navigate } from "/src/runtime/navigate";

type DevDomain = "build" | "flags" | "runtime" | "security" | "entitlements" | "demo";

type DevSeverity = "INFO" | "WARN" | "ERR";

type DevRow = {
  domain: DevDomain;
  key: string;
  value: string;
  severity?: DevSeverity;
  updatedAt?: string;
};

type DevData = {
  rows: DevRow[];
  lastUpdated: string;
};

type Mode = "live" | "demo" | "error";

let currentRoot: HTMLElement | null = null;

export function renderDeveloperPage(root: HTMLElement): void {
  void renderDeveloperPageAsync(root);
}

async function renderDeveloperPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "developer", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const { shell, content } = createPageShell({
        title: "Developer",
        subtitle: "Outils developpeur — diagnostics, entitlements, runtime",
        safeMode: mapSafeMode(safeMode),
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const grid = document.createElement("div");
  grid.style.minWidth = "0";
  grid.style.boxSizing = "border-box";
      grid.style.cssText = "display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; width:100%;";
      for (let i = 0; i < 4; i += 1) {
        grid.appendChild(createCardSkeleton());
      }
      content.appendChild(grid);

      const { card: detailCard, body: detailBody } = createSectionCard({
        title: "Details",
        description: "Signaux runtime (chargement)"
      });
      detailBody.appendChild(createCardSkeleton());
      content.appendChild(detailCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, error, mode } = await getDevData();
  renderData(root, data, error, mode);
}

function renderData(root: HTMLElement, data: DevData, error: string | null, mode: Mode): void {
  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();

    const statusBadge = mode === "live"
      ? { label: "LIVE", tone: "ok" as const }
      : mode === "demo"
        ? { label: "DEMO", tone: "warn" as const }
        : { label: "ERREUR", tone: "err" as const };

    const { shell, content } = createPageShell({
      title: "Developer",
      subtitle: "Outils developpeur — diagnostics, entitlements, runtime",
      safeMode: mapSafeMode(getSafeMode()),
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; width:100%;";

    const rows = data.rows;
    const errCount = rows.filter((r) => (r.severity || "INFO") === "ERR").length;
    const warnCount = rows.filter((r) => (r.severity || "INFO") === "WARN").length;
    const domains = new Set(rows.map((r) => r.domain));

    const { card: kpiCard, body: kpiBody } = createSectionCard({
      title: "Pilotage",
      description: "Synthese et etat des diagnostics"
    });
    if (error) {
      kpiBody.appendChild(createErrorState({ code: "ERR_DEVELOPER_FETCH", message: error }));
    }
    kpiBody.appendChild(createKpiRow("ERR (approx)", String(errCount), errCount > 0 ? "err" : "ok"));
    kpiBody.appendChild(createKpiRow("WARN (approx)", String(warnCount), warnCount > 0 ? "warn" : "ok"));
    kpiBody.appendChild(createKpiRow("Domaines", String(domains.size)));
    kpiBody.appendChild(createKpiRow("Derniere mise a jour", formatDateTime(data.lastUpdated)));
    grid.appendChild(kpiCard);

    const { card: actionsCard, body: actionsBody } = createSectionCard({
      title: "Actions",
      description: "Operations auditees (safe-mode compatible)"
    });
    const safeMode = mapSafeMode(getSafeMode());
    actionsBody.appendChild(createBadge(`SAFE_MODE: ${safeMode}`, safeMode === "STRICT" ? "err" : safeMode === "COMPAT" ? "warn" : "ok"));
    actionsBody.appendChild(createActionButton("Rafraichir", true, () => refresh()));
    actionsBody.appendChild(createActionButton("Exporter JSON", false, () => exportJson(rows)));
    actionsBody.appendChild(createActionButton("Ouvrir entitlements", false, () => { navigate("#/developer/entitlements"); }));
    grid.appendChild(actionsCard);

    const { card: runtimeCard, body: runtimeBody } = createSectionCard({
      title: "Runtime",
      description: "Infos build et contexte"
    });
    runtimeBody.appendChild(createKpiRow("UserAgent", `${navigator.userAgent.slice(0, 48)}...`));
    runtimeBody.appendChild(createKpiRow("Lang", navigator.language || "n/a"));
    runtimeBody.appendChild(createKpiRow("Online", navigator.onLine ? "Oui" : "Non"));
    grid.appendChild(runtimeCard);

    const { card: flagsCard, body: flagsBody } = createSectionCard({
      title: "Flags & Entitlements",
      description: "Visibilite par domaine"
    });
    flagsBody.appendChild(createKpiRow("Entitlements", String(rows.filter((r) => r.domain === "entitlements").length)));
    flagsBody.appendChild(createKpiRow("Flags", String(rows.filter((r) => r.domain === "flags").length)));
    flagsBody.appendChild(createKpiRow("Securite", String(rows.filter((r) => r.domain === "security").length)));
    grid.appendChild(flagsCard);

    content.appendChild(grid);

    const { card: detailCard, body: detailBody } = createSectionCard({
      title: "Details",
      description: "Signaux runtime (recherche + filtres)"
    });

    const state = { search: "", domain: "" };
    const tableContainer = document.createElement("div");
    const domainOptions = Array.from(new Set(rows.map((r) => r.domain))).sort();

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher cle ou valeur...",
      onSearch: (v) => {
        state.search = (v || "").toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Domaine",
          options: [{ label: "Tous", value: "" }].concat(domainOptions.map((d) => ({ label: d, value: d }))),
          onChange: (v) => {
            state.domain = v;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refresh() },
        { label: "Copier resume", onClick: () => copyToClipboard(buildSummary(rows)) }
      ]
    });

    detailBody.appendChild(toolbar);
    detailBody.appendChild(tableContainer);

    const columns: TableColumn<DevRow>[] = [
      { key: "domain", label: "Domaine", sortable: true, render: (v) => createBadge(String(v), "neutral") },
      {
        key: "severity",
        label: "Severite",
        sortable: true,
        render: (v) => {
          const sev = String(v || "INFO");
          const tone = sev === "ERR" ? "err" : sev === "WARN" ? "warn" : "info";
          return createBadge(sev, tone);
        }
      },
      {
        key: "key",
        label: "Cle",
        sortable: true,
        render: (v) => {
          const div = document.createElement("div");
          div.textContent = String(v);
          div.style.cssText = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-weight: 600;";
          return div;
        }
      },
      {
        key: "value",
        label: "Valeur",
        sortable: false,
        render: (v) => {
          const div = document.createElement("div");
          div.textContent = String(v);
          div.style.cssText = "font-size: 12px; color: var(--ic-text, #e7ecef); white-space: pre-wrap;";
          return div;
        }
      },
      {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        render: (v) => {
          const div = document.createElement("div");
          div.textContent = v ? formatDateTime(String(v)) : "—";
          div.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
          return div;
        }
      }
    ];

    function renderTable(): void {
      tableContainer.innerHTML = "";
      const filtered = rows.filter((r) => {
        const matchDomain = !state.domain || r.domain === state.domain;
        const q = state.search;
        const matchSearch = !q || r.key.toLowerCase().includes(q) || r.value.toLowerCase().includes(q);
        return matchDomain && matchSearch;
      });

      const table = createDataTable({
        columns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 12,
        actions: (row) => [
          { label: "Copier cle", onClick: () => copyToClipboard(row.key) },
          { label: "Copier valeur", onClick: () => copyToClipboard(row.value) },
          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
        ]
      });

      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("developer", {
          searchQuery: state.search || undefined,
          onClearFilter: () => {
            state.search = "";
            state.domain = "";
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

function createKpiRow(label: string, value: string, tone?: "ok" | "warn" | "err"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText =
    "font-size: 13px; font-weight: 600; color: " +
    (tone == "err" ? "var(--ic-error, #f48771)" : tone == "warn" ? "var(--ic-warn, #f59e0b)" : tone == "ok" ? "var(--ic-success, #4ec9b0)" : "var(--ic-text, #e7ecef)") +
    ";";
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function createActionButton(label: string, primary: boolean, onClick: () => void): HTMLElement {
  const btn = document.createElement("button");
  btn.className = "cxBtn";
  btn.textContent = label;
  btn.style.cssText = "margin-top:8px; padding:10px 14px; border-radius:10px; border:1px solid var(--ic-border,#2b3136); background:" + (primary ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)") + "; color: var(--ic-text,#e7ecef); cursor:pointer; font-weight:600; text-align:left; width:100%;";
  btn.onclick = onClick;
  return btn;
}

async function getDevData(): Promise<{ data: DevData; error: string | null; mode: Mode }> {
  const demo = buildDemo();
  let rows: DevRow[] = [];
  let error: string | null = null;
  let live = false;

  const runtimeRes = await fetchJsonSafe("/api/cp/runtime-config");
  if (runtimeRes.ok && runtimeRes.data) {
    rows = rows.concat(normalizeRuntime(runtimeRes.data));
    live = true;
  } else if (runtimeRes.error) {
    error = runtimeRes.error;
  }

  const systemRes = await fetchJsonSafe("/api/cp/system");
  if (systemRes.ok && systemRes.data) {
    rows = rows.concat(normalizeSystem(systemRes.data));
    live = true;
  } else if (!error && systemRes.error) {
    error = systemRes.error;
  }

  const flagsRes = await fetchJsonSafe("/api/cp/feature-flags");
  if (flagsRes.ok && flagsRes.data) {
    rows = rows.concat(normalizeFlags(flagsRes.data));
    live = true;
  } else if (!error && flagsRes.error) {
    error = flagsRes.error;
  }

  if (rows.length == 0) {
    rows = demo.rows;
  }

  const mode: Mode = live ? "live" : error ? "error" : "demo";

  return {
    data: {
      rows,
      lastUpdated: new Date().toISOString()
    },
    error,
    mode
  };
}

function normalizeRuntime(raw: any): DevRow[] {
  const rows: DevRow[] = [];
  if (typeof raw == "object") {
    for (const [key, value] of Object.entries(raw)) {
      rows.push({ domain: "runtime", key: String(key), value: String(value), severity: "INFO", updatedAt: new Date().toISOString() });
    }
  }
  return rows;
}

function normalizeSystem(raw: any): DevRow[] {
  const rows: DevRow[] = [];
  if (typeof raw == "object") {
    for (const [key, value] of Object.entries(raw)) {
      rows.push({ domain: "build", key: String(key), value: String(value), severity: "INFO", updatedAt: new Date().toISOString() });
    }
  }
  return rows;
}

function normalizeFlags(raw: any): DevRow[] {
  const rows: DevRow[] = [];
  const flags = raw?.flags || raw;
  if (flags && typeof flags == "object") {
    for (const [key, value] of Object.entries(flags)) {
      rows.push({ domain: "flags", key: String(key), value: String(value), severity: "INFO", updatedAt: new Date().toISOString() });
    }
  }
  return rows;
}

function buildDemo(): DevData {
  const now = Date.now();
  const rows: DevRow[] = [
    { domain: "runtime", key: "runtime.version", value: "v0.2.x", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 5).toISOString() },
    { domain: "runtime", key: "runtime.env", value: "production", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 6).toISOString() },
    { domain: "flags", key: "featureFlags.enabled", value: "true", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 8).toISOString() },
    { domain: "flags", key: "featureFlags.count", value: "12", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 9).toISOString() },
    { domain: "entitlements", key: "entitlements.active", value: "6", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 10).toISOString() },
    { domain: "entitlements", key: "entitlements.expired", value: "1", severity: "WARN", updatedAt: new Date(now - 1000 * 60 * 11).toISOString() },
    { domain: "security", key: "safeMode", value: mapSafeMode(getSafeMode()), severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 3).toISOString() },
    { domain: "security", key: "audit.cache", value: "enabled", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 2).toISOString() },
    { domain: "build", key: "build.hash", value: "a1b2c3d", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 12).toISOString() },
    { domain: "build", key: "build.time", value: new Date(now - 1000 * 60 * 60).toISOString(), severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 12).toISOString() },
    { domain: "demo", key: "demo.note", value: "Donnees de reference", severity: "INFO", updatedAt: new Date(now - 1000 * 60 * 1).toISOString() }
  ];
  return { rows, lastUpdated: new Date(now).toISOString() };
}

function buildSummary(rows: DevRow[]): string {
  return rows.map((r) => `${r.domain}:${r.key}=${r.value}`).slice(0, 6).join(" | ");
}

function exportJson(rows: DevRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_developer_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
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

function refresh(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderDeveloperPageAsync(target);
}
