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
import { getMountEl } from "/src/router";
import { navigate } from "/src/runtime/navigate";

type LogLevel = "ERR" | "WARN" | "INFO" | "DEBUG";
type LogSource = "CP" | "API" | "SYSTEM" | "AUDIT" | "DEMO";

type LogRow = {
  ts: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  correlationId?: string;
  code?: string;
  module?: string;
};

type LogsData = {
  rows: LogRow[];
  lastUpdated: string;
};

type LogsMode = "live" | "demo" | "error";

let currentRoot: HTMLElement | null = null;

export function renderLogsPage(root: HTMLElement): void {
  void renderLogsPageAsync(root);
}

async function renderLogsPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "logs", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(safeMode);
      const { shell, content } = createPageShell({
        title: "Logs",
        subtitle: "Observabilité CP — recherche, filtres, corrélation",
        safeMode: safeModeValue,
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const { card: pilotCard, body: pilotBody } = createSectionCard({
        title: "Pilotage",
        description: "Synthèse rapide des erreurs"
      });
      pilotBody.appendChild(createSkeletonRow());
      pilotBody.appendChild(createSkeletonRow());
      pilotBody.appendChild(createSkeletonRow());
      content.appendChild(pilotCard);

      const { card: flowCard, body: flowBody } = createSectionCard({
        title: "Flux",
        description: "Logs système et corrélation"
      });
      flowBody.appendChild(createSkeletonBlock());
      content.appendChild(flowCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, errors, mode } = await getLogsData();
  renderData(root, data, errors, mode, safeMode);
}

function renderData(
  root: HTMLElement,
  data: LogsData,
  errors: { data?: string },
  mode: LogsMode,
  safeModeRaw: string
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
      title: "Logs",
      subtitle: "Observabilité CP — recherche, filtres, corrélation",
      safeMode: safeModeValue,
      statusBadge
    });

    const { card: pilotCard, body: pilotBody } = createSectionCard({
      title: "Pilotage",
      description: "Synthèse rapide des erreurs"
    });

    if (errors.data) {
      pilotBody.appendChild(createErrorState({ code: "ERR_LOGS_FETCH", message: errors.data }));
    }

    const errCount = data.rows.filter((row) => row.level === "ERR").length;
    const warnCount = data.rows.filter((row) => row.level === "WARN").length;

    pilotBody.appendChild(createKpiRow("ERR (approx 24h)", formatNumber(errCount), errCount > 0 ? "err" : "ok"));
    pilotBody.appendChild(createKpiRow("WARN (approx 24h)", formatNumber(warnCount), warnCount > 0 ? "warn" : "ok"));
    pilotBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));

    content.appendChild(pilotCard);

    const { card: flowCard, body: flowBody } = createSectionCard({
      title: "Flux",
      description: "Logs système et corrélation"
    });

    const tableState = { search: "", level: "", source: "" };

    const tableContainer = document.createElement("div");

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher message, module, code, correlationId...",
      onSearch: (value) => {
        tableState.search = value.toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Niveau",
          options: [
            { label: "Tous", value: "" },
            { label: "ERR", value: "ERR" },
            { label: "WARN", value: "WARN" },
            { label: "INFO", value: "INFO" },
            { label: "DEBUG", value: "DEBUG" }
          ],
          onChange: (value) => {
            tableState.level = value;
            renderTable();
          }
        },
        {
          label: "Source",
          options: [
            { label: "Toutes", value: "" },
            { label: "CP", value: "CP" },
            { label: "API", value: "API" },
            { label: "SYSTEM", value: "SYSTEM" },
            { label: "AUDIT", value: "AUDIT" },
            { label: "DEMO", value: "DEMO" }
          ],
          onChange: (value) => {
            tableState.source = value;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraîchir", primary: true, onClick: () => refreshLogs() },
        { label: "Exporter CSV", onClick: () => exportCsv(getFilteredRows(data.rows, tableState)) }
      ]
    });

    flowBody.appendChild(toolbar);
    flowBody.appendChild(tableContainer);

    const columns: TableColumn<LogRow>[] = [
      {
        key: "ts",
        label: "Horodatage",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
          const date = new Date(String(value));
          div.textContent = `${date.toLocaleDateString("fr-CA")} ${date.toLocaleTimeString("fr-CA")}`;
          return div;
        }
      },
      {
        key: "level",
        label: "Niveau",
        sortable: true,
        render: (value) => {
          const level = String(value);
          const tone = level === "ERR" ? "err" : level === "WARN" ? "warn" : level === "INFO" ? "info" : "neutral";
          return createBadge(level, tone);
        }
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "message",
        label: "Message",
        sortable: false,
        render: (value, row) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = `font-size: 12px; color: ${row.level === "ERR" ? "var(--ic-error, #f48771)" : "var(--ic-text, #e7ecef)"};`;
          return div;
        }
      },
      {
        key: "correlationId",
        label: "CorrelationId",
        sortable: false,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = value ? String(value) : "—";
          div.style.cssText = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
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
            label: row.correlationId ? "Copier CID" : "Copier CID (—)",
            onClick: () => copyToClipboard(row.correlationId || "")
          },
          {
            label: "Voir Dashboard",
            onClick: () => { navigate("#/dashboard"); }
          },
          {
            label: "Détails",
            onClick: () => showToast({ status: "info", message: `Détails: ${row.message}` })
          }
        ]
      });

      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("logs", {
          onAdd: () => refreshLogs(),
          onClearFilter: () => {
            tableState.search = "";
            tableState.level = "";
            tableState.source = "";
            if (searchInput) searchInput.value = "";
            renderTable();
          }
        }));
      }
    };

    renderTable();

    content.appendChild(flowCard);
    root.appendChild(shell);
  });
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

function createSkeletonRow(): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "height: 16px; background: rgba(255,255,255,0.06); border-radius: 6px;";
  return row;
}

function createSkeletonBlock(): HTMLElement {
  const block = document.createElement("div");
  block.style.cssText = "height: 140px; background: rgba(255,255,255,0.04); border-radius: 10px;";
  return block;
}

async function getLogsData(): Promise<{ data: LogsData; errors: { data?: string }; mode: LogsMode }> {
  const demo = buildDemoLogsData();
  const errors: { data?: string } = {};

  const logsRes = await fetchJsonSafe<any>("/api/cp/logs?limit=200");
  if (logsRes.ok && logsRes.data) {
    const rows = normalizeRows(logsRes.data, "CP");
    return { data: { rows: rows.length ? rows : demo.rows, lastUpdated: new Date().toISOString() }, errors, mode: "live" };
  }

  const auditRes = await fetchJsonSafe<any>("/api/cp/audit?limit=200");
  if (auditRes.ok && auditRes.data) {
    const rows = normalizeRows(auditRes.data, "AUDIT");
    errors.data = logsRes.error || "Logs indisponibles — fallback audit";
    return { data: { rows: rows.length ? rows : demo.rows, lastUpdated: new Date().toISOString() }, errors, mode: "demo" };
  }

  errors.data = logsRes.error || auditRes.error || "Impossible de charger les logs";
  return { data: demo, errors, mode: "error" };
}

function normalizeRows(raw: any, fallbackSource: LogSource): LogRow[] {
  const rowsArray = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : [];
  return rowsArray.map((item: any) => ({
    ts: String(item.ts || item.time || item.timestamp || new Date().toISOString()),
    level: mapLevel(item.level || item.severity || item.type),
    source: mapSource(item.source || item.origin, fallbackSource),
    message: String(item.message || item.label || item.code || "Log"),
    correlationId: item.correlationId || item.correlation_id,
    code: item.code,
    module: item.module
  }));
}

function mapLevel(value: any): LogLevel {
  const v = String(value || "").toUpperCase();
  if (v === "ERR" || v === "ERROR") return "ERR";
  if (v === "WARN" || v === "WARNING") return "WARN";
  if (v === "DEBUG") return "DEBUG";
  return "INFO";
}

function mapSource(value: any, fallback: LogSource): LogSource {
  const v = String(value || "").toUpperCase();
  if (v === "API") return "API";
  if (v === "SYSTEM") return "SYSTEM";
  if (v === "AUDIT") return "AUDIT";
  if (v === "CP") return "CP";
  if (v === "DEMO") return "DEMO";
  return fallback;
}

function buildDemoLogsData(): LogsData {
  const baseTime = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const rows: LogRow[] = [
    { ts: new Date(baseTime - 1000 * 60 * 5).toISOString(), level: "INFO", source: "DEMO", message: "DEMO: Initialisation des logs", correlationId: "demo-001", code: "INIT_LOGS", module: "core" },
    { ts: new Date(baseTime - 1000 * 60 * 10).toISOString(), level: "WARN", source: "SYSTEM", message: "Capacité mémoire élevée", correlationId: "sys-221", code: "WARN_MEM", module: "system" },
    { ts: new Date(baseTime - 1000 * 60 * 13).toISOString(), level: "ERR", source: "API", message: "Erreur API: timeout upstream", correlationId: "api-778", code: "ERR_TIMEOUT", module: "gateway" },
    { ts: new Date(baseTime - 1000 * 60 * 16).toISOString(), level: "INFO", source: "AUDIT", message: "Connexion administrateur", correlationId: "audit-448", code: "AUDIT_LOGIN", module: "auth" },
    { ts: new Date(baseTime - 1000 * 60 * 22).toISOString(), level: "WARN", source: "CP", message: "SAFE_MODE en compatibilité", correlationId: "cp-442", code: "WARN_SAFE_MODE", module: "runtime" },
    { ts: new Date(baseTime - 1000 * 60 * 28).toISOString(), level: "INFO", source: "SYSTEM", message: "Synchronisation modules terminée", correlationId: "sys-901", code: "SYNC_OK", module: "modules" },
    { ts: new Date(baseTime - 1000 * 60 * 35).toISOString(), level: "DEBUG", source: "DEMO", message: "DEMO: Diagnostics réseau", correlationId: "demo-502", code: "DBG_NET", module: "network" },
    { ts: new Date(baseTime - 1000 * 60 * 40).toISOString(), level: "WARN", source: "API", message: "Quota d'appel élevé", correlationId: "api-119", code: "WARN_RATE", module: "rate-limiter" },
    { ts: new Date(baseTime - 1000 * 60 * 45).toISOString(), level: "ERR", source: "SYSTEM", message: "Erreur d'écriture audit", correlationId: "sys-534", code: "ERR_AUDIT_WRITE", module: "audit" },
    { ts: new Date(baseTime - 1000 * 60 * 55).toISOString(), level: "INFO", source: "CP", message: "Mise à jour configuration appliquée", correlationId: "cp-888", code: "CFG_APPLY", module: "config" }
  ];
  return { rows, lastUpdated: new Date(baseTime).toISOString() };
}

function getFilteredRows(rows: LogRow[], state: { search: string; level: string; source: string }): LogRow[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchLevel = !state.level || row.level === state.level;
    const matchSource = !state.source || row.source === state.source;
    const matchSearch = !q ||
      row.message.toLowerCase().includes(q) ||
      (row.module || "").toLowerCase().includes(q) ||
      (row.code || "").toLowerCase().includes(q) ||
      (row.correlationId || "").toLowerCase().includes(q);
    return matchLevel && matchSource && matchSearch;
  });
}

function exportCsv(rows: LogRow[]): void {
  const header = ["ts", "level", "source", "message", "correlationId", "code", "module"];
  const esc = (s: any) => `"${String(s ?? "").replaceAll("\"", "\"\"")}"`;
  const body = rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")).join("\n");
  const csv = `${header.join(",")}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_logs_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    showToast({ status: "warning", message: "Aucun correlationId à copier." });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: "success", message: "CorrelationId copié." });
  } catch {
    showToast({ status: "warning", message: "Copie impossible (permissions navigateur)." });
  }
}

function refreshLogs(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderLogsPageAsync(target);
}
