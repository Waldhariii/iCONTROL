/**
 * ICONTROL_CP_SYSTEM_V2
 * SSOT System/SAFE_MODE page (CP)
 */
import { getRole } from "/src/runtime/rbac";
import { safeRender } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared";
import { recordObs } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/audit";
import { OBS } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/obsCodes";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { renderAccessDenied } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/renderAccessDenied";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/system/contract";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";
import { createContextualEmptyState } from "/src/core/ui/emptyState";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showToast } from "/src/core/ui/toast";
import { getMountEl } from "/src/router";

type SystemDomain = "safeMode" | "rbac" | "runtime" | "featureFlags" | "security" | "demo";
type SystemSource = "CP" | "SYSTEM" | "DEMO";
type SystemSeverity = "INFO" | "WARN" | "ERR";

type SystemRow = {
  key: string;
  value: string;
  domain: SystemDomain;
  severity?: SystemSeverity;
  source?: SystemSource;
  updatedAt?: string;
};

type SystemData = {
  safeMode: "OFF" | "COMPAT" | "STRICT";
  rows: SystemRow[];
  lastUpdated: string;
};

type SystemMode = "live" | "demo" | "error";

let currentRoot: HTMLElement | null = null;

export function renderSystemPage(root: HTMLElement): void {
  void renderSystemPageAsync(root);
}

async function renderSystemPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "system", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(safeMode);
      const { shell, content } = createPageShell({
        title: "Système",
        subtitle: "SAFE_MODE, gouvernance, configuration runtime",
        safeMode: safeModeValue,
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const grid = document.createElement("div");
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        width: 100%;
      `;
      for (let i = 0; i < 3; i += 1) {
        const skeleton = document.createElement("div");
        skeleton.style.cssText = "height: 140px; border: 1px solid var(--ic-border, #2b3136); border-radius: 10px; background: rgba(255,255,255,0.03);";
        grid.appendChild(skeleton);
      }
      content.appendChild(grid);

      const { card: detailCard, body: detailBody } = createSectionCard({
        title: "Détails",
        description: "Configuration et politiques runtime"
      });
      const tableSkeleton = document.createElement("div");
      tableSkeleton.style.cssText = "height: 180px; border: 1px solid var(--ic-border, #2b3136); border-radius: 10px; background: rgba(255,255,255,0.03);";
      detailBody.appendChild(tableSkeleton);
      content.appendChild(detailCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, errors, mode } = await getSystemData(mapSafeMode(safeMode));
  renderData(root, data, errors, mode, safeMode, role);
}

function renderData(
  root: HTMLElement,
  data: SystemData,
  errors: { data?: string },
  mode: SystemMode,
  safeModeRaw: string,
  role: string
): void {
  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(safeModeRaw);
    const statusBadge = mode === "live"
      ? { label: "LIVE", tone: "ok" as const }
      : mode === "demo"
        ? { label: "DEMO", tone: "warn" as const }
        : { label: "ERREUR", tone: "err" as const };

    const { shell, content } = createPageShell({
      title: "Système",
      subtitle: "SAFE_MODE, gouvernance, configuration runtime",
      safeMode: safeModeValue,
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      width: 100%;
    `;

    const { card: safeModeCard, body: safeModeBody } = createSectionCard({
      title: "SAFE_MODE",
      description: "Niveau de sécurité et restrictions d'écriture"
    });
    safeModeBody.appendChild(createBadge(`SAFE_MODE: ${data.safeMode}`, data.safeMode === "STRICT" ? "err" : data.safeMode === "COMPAT" ? "warn" : "ok"));
    safeModeBody.appendChild(createKpiRow("Mode", data.safeMode));
    safeModeBody.appendChild(createKpiRow("Impact", data.safeMode === "STRICT" ? "Ecritures bloquées" : data.safeMode === "COMPAT" ? "Compatibilité priorisée" : "Mode normal"));
    safeModeBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));
    grid.appendChild(safeModeCard);

    const { card: govCard, body: govBody } = createSectionCard({
      title: "Gouvernance",
      description: "RBAC, politiques et accès"
    });
    govBody.appendChild(createKpiRow("Rôle courant", role || "UNKNOWN"));
    govBody.appendChild(createKpiRow("Accès Système", canAccess(role as any, safeModeRaw as any) ? "Oui" : "Non"));
    govBody.appendChild(createKpiRow("Policy SAFE_MODE", safeModeValue === "STRICT" ? "Writes blocked" : "Audit-only"));
    grid.appendChild(govCard);

    const { card: cfgCard, body: cfgBody } = createSectionCard({
      title: "Configuration",
      description: "Clés runtime et flags"
    });
    cfgBody.appendChild(createKpiRow("Clés", formatNumber(data.rows.length)));
    cfgBody.appendChild(createKpiRow("Domaines", formatNumber(new Set(data.rows.map((r) => r.domain)).size)));
    cfgBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));
    grid.appendChild(cfgCard);

    content.appendChild(grid);

    const { card: detailCard, body: detailBody } = createSectionCard({
      title: "Détails",
      description: "Configuration et politiques runtime"
    });

    if (errors.data) {
      detailBody.appendChild(createErrorState({ code: "ERR_SYSTEM_FETCH", message: errors.data }));
    }

    const tableState = { search: "", domain: "" };

    const tableContainer = document.createElement("div");
    const domains = Array.from(new Set(data.rows.map((r) => r.domain))).sort();

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher clé ou valeur...",
      onSearch: (value) => {
        tableState.search = value.toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Domaine",
          options: [{ label: "Tous", value: "" }].concat(domains.map((domain) => ({
            label: domain,
            value: domain
          }))),
          onChange: (value) => {
            tableState.domain = value;
            renderTable();
          }
        }
      ],
      actions: [
        {
          label: "Rafraîchir",
          primary: true,
          onClick: () => refreshSystem()
        },
        {
          label: "Exporter JSON",
          onClick: () => exportJson(getFilteredRows(data.rows, tableState))
        }
      ]
    });

    detailBody.appendChild(toolbar);
    detailBody.appendChild(tableContainer);

    const columns: TableColumn<SystemRow>[] = [
      {
        key: "domain",
        label: "Domaine",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "key",
        label: "Clé",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-weight: 600;";
          return div;
        }
      },
      {
        key: "value",
        label: "Valeur",
        sortable: false,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = "font-size: 12px; color: var(--ic-text, #e7ecef); white-space: pre-wrap;";
          return div;
        }
      },
      {
        key: "severity",
        label: "Sévérité",
        sortable: true,
        render: (value) => {
          const severity = String(value || "INFO");
          const tone = severity === "ERR" ? "err" : severity === "WARN" ? "warn" : "info";
          return createBadge(severity, tone);
        }
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        render: (value) => createBadge(String(value || "DEMO"), "neutral")
      },
      {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = value ? formatDateTime(String(value)) : "—";
          div.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
          return div;
        }
      }
    ];

    const renderTable = () => {
      tableContainer.innerHTML = "";
      const filtered = getFilteredRows(data.rows, tableState);
      const table = createDataTable({
        columns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 12,
        actions: (row) => [
          {
            label: "Copier clé",
            onClick: () => copyToClipboard(row.key)
          },
          {
            label: "Copier valeur",
            onClick: () => copyToClipboard(row.value)
          },
          {
            label: "Voir logs",
            onClick: () => { window.location.hash = "#/logs"; }
          }
        ]
      });
      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("data", {
          searchQuery: tableState.search || undefined,
          onClearFilter: () => {
            tableState.search = "";
            tableState.domain = "";
            if (searchInput) searchInput.value = "";
            renderTable();
          }
        }));
      }
    };

    renderTable();

    content.appendChild(detailCard);
    root.appendChild(shell);
  });
}

function mapSafeMode(value: string): "OFF" | "COMPAT" | "STRICT" {
  if (value === "STRICT") return "STRICT";
  if (value === "COMPAT") return "COMPAT";
  return "OFF";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-CA").format(value);
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
  right.style.cssText = `font-size: 13px; font-weight: 600; color: ${tone === "err" ? "var(--ic-error, #f48771)" : tone === "warn" ? "var(--ic-warn, #f59e0b)" : tone === "ok" ? "var(--ic-success, #4ec9b0)" : "var(--ic-text, #e7ecef)"};`;
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

async function fetchJsonSafe<T = any>(url: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: String(error) };
  }
}

async function getSystemData(defaultSafeMode: "OFF" | "COMPAT" | "STRICT"): Promise<{ data: SystemData; errors: { data?: string }; mode: SystemMode }> {
  const demo = buildDemoSystemData(defaultSafeMode);
  const errors: { data?: string } = {};
  let rows: SystemRow[] = [];
  let mode: SystemMode = "demo";
  let safeModeValue = defaultSafeMode;

  const systemRes = await fetchJsonSafe<any>("/api/cp/system");
  if (systemRes.ok && systemRes.data) {
    mode = "live";
    const raw = systemRes.data;
    if (raw.safeMode) {
      safeModeValue = mapSafeMode(String(raw.safeMode));
    }
    rows = rows.concat(normalizeRows(raw, "runtime", "SYSTEM"));
  }

  const runtimeRes = await fetchJsonSafe<any>("/api/cp/runtime-config");
  if (runtimeRes.ok && runtimeRes.data) {
    mode = "live";
    rows = rows.concat(normalizeRows(runtimeRes.data, "runtime", "SYSTEM"));
  }

  const flagsRes = await fetchJsonSafe<any>("/api/cp/feature-flags");
  if (flagsRes.ok && flagsRes.data) {
    mode = "live";
    rows = rows.concat(normalizeRows(flagsRes.data, "featureFlags", "CP"));
  }

  if (rows.length === 0) {
    errors.data = systemRes.error || runtimeRes.error || flagsRes.error || "Aucune donnée runtime disponible";
    rows = demo.rows;
    safeModeValue = demo.safeMode;
    mode = "demo";
  }

  return {
    data: {
      safeMode: safeModeValue,
      rows,
      lastUpdated: new Date().toISOString()
    },
    errors,
    mode: mode === "live" ? "live" : "demo"
  };
}

function normalizeRows(raw: any, domain: SystemDomain, source: SystemSource): SystemRow[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => ({
      key: String(entry.key || entry.name || entry.id || "unknown"),
      value: String(entry.value ?? entry.status ?? entry.enabled ?? entry.flag ?? ""),
      domain,
      severity: mapSeverity(entry.severity || entry.level),
      source,
      updatedAt: entry.updatedAt || entry.updated_at
    }));
  }
  if (Array.isArray(raw?.rows)) {
    return normalizeRows(raw.rows, domain, source);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) => ({
      key,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
      domain,
      severity: mapSeverity((value as any)?.severity),
      source
    }));
  }
  return [];
}

function mapSeverity(value: any): SystemSeverity {
  const v = String(value || "").toUpperCase();
  if (v === "ERR" || v === "ERROR") return "ERR";
  if (v === "WARN" || v === "WARNING") return "WARN";
  return "INFO";
}

function buildDemoSystemData(defaultSafeMode: "OFF" | "COMPAT" | "STRICT"): SystemData {
  const rows: SystemRow[] = [
    { key: "safe_mode", value: defaultSafeMode, domain: "safeMode", severity: "INFO", source: "DEMO", updatedAt: new Date().toISOString() },
    { key: "rbac.policy", value: "enforced", domain: "rbac", severity: "INFO", source: "DEMO" },
    { key: "runtime.cache.audit", value: "enabled", domain: "runtime", severity: "INFO", source: "DEMO" },
    { key: "featureFlags.logs", value: "on", domain: "featureFlags", severity: "INFO", source: "DEMO" },
    { key: "security.headers", value: "strict", domain: "security", severity: "WARN", source: "DEMO" },
    { key: "runtime.lastReload", value: new Date().toISOString(), domain: "runtime", severity: "INFO", source: "DEMO" }
  ];
  return { safeMode: defaultSafeMode, rows, lastUpdated: new Date().toISOString() };
}

function getFilteredRows(rows: SystemRow[], state: { search: string; domain: string }): SystemRow[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchDomain = !state.domain || row.domain === state.domain;
    const matchSearch = !q ||
      row.key.toLowerCase().includes(q) ||
      row.value.toLowerCase().includes(q);
    return matchDomain && matchSearch;
  });
}

function exportJson(rows: SystemRow[]): void {
  const payload = JSON.stringify({ rows }, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_system_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
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

function refreshSystem(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderSystemPageAsync(target);
}
