/**
 * ICONTROL_CP_API_V2
 * SSOT API page (CP)
 */
import { getRole, canAccessPageRoute } from "/src/runtime/rbac";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { OBS } from "/src/core/runtime/obs";
import { recordObs } from "/src/core/runtime/audit";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
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
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

type ApiMode = "live" | "demo" | "error";

type ApiRow = {
  ts: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  source: string;
  correlationId?: string;
  message?: string;
};

type ApiKpi = {
  errorRatePct: number;
  p95Ms: number;
  rpm: number;
  gatewayStatus: "OK" | "DEGRADE" | "DOWN";
};

type ApiData = {
  rows: ApiRow[];
  kpi: ApiKpi;
  lastUpdated: string;
};

let currentRoot: HTMLElement | null = null;

export function renderApiPage(root: HTMLElement): void {
  void renderApiPageAsync(root);
}

async function renderApiPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();
  const canAccess = canAccessPageRoute("api");

  if (!canAccess) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "api", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(safeMode);
      const { shell, content } = createPageShell({
        title: "API",
        subtitle: "Console API et observabilite runtime",
        safeMode: safeModeValue,
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const grid = document.createElement("div");
  grid.style.minWidth = "0";
  grid.style.boxSizing = "border-box";
      grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";
      grid.appendChild(createCardSkeleton());
      grid.appendChild(createCardSkeleton());
      content.appendChild(grid);

      const { card: flowCard, body: flowBody } = createSectionCard({
        title: "Trafic API",
        description: "Flux, erreurs et correlations"
      });
      flowBody.appendChild(createCardSkeleton());
      content.appendChild(flowCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, errors, mode } = await getApiData();
  renderData(root, data, errors, mode, safeMode, role);
}

function renderData(
  root: HTMLElement,
  data: ApiData,
  errors: { metrics?: string; rows?: string },
  mode: ApiMode,
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
      title: "API",
      subtitle: "Console API et observabilite runtime",
      safeMode: safeModeValue,
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";

    const { card: healthCard, body: healthBody } = createSectionCard({
      title: "Pilotage",
      description: "Sante et disponibilite des endpoints"
    });

    if (errors.metrics || errors.rows) {
      healthBody.appendChild(createErrorState({
        code: "ERR_API_FETCH",
        message: errors.metrics || errors.rows || "Impossible de charger les donnees API"
      }));
    }

    healthBody.appendChild(createKpiRow("Taux d'erreur", `${data.kpi.errorRatePct.toFixed(1)}%`, data.kpi.errorRatePct > 5 ? "warn" : "ok"));
    healthBody.appendChild(createKpiRow("Latence p95", `${Math.round(data.kpi.p95Ms)} ms`, data.kpi.p95Ms > 800 ? "err" : data.kpi.p95Ms > 350 ? "warn" : "ok"));
    healthBody.appendChild(createKpiRow("Requetes/min", String(Math.round(data.kpi.rpm)), "neutral"));
    healthBody.appendChild(createKpiRow("Statut gateway", data.kpi.gatewayStatus, data.kpi.gatewayStatus === "DOWN" ? "err" : data.kpi.gatewayStatus === "DEGRADE" ? "warn" : "ok"));

    grid.appendChild(healthCard);

    const { card: usageCard, body: usageBody } = createSectionCard({
      title: "Qualite",
      description: "Synthese sur 30 minutes"
    });

    const okCount = data.rows.filter((row) => row.status < 400).length;
    const errCount = data.rows.filter((row) => row.status >= 500).length;
    usageBody.appendChild(createKpiRow("Succes", `${okCount}/${data.rows.length}`, okCount === data.rows.length ? "ok" : "warn"));
    usageBody.appendChild(createKpiRow("Erreurs 5xx", String(errCount), errCount > 0 ? "warn" : "ok"));
    usageBody.appendChild(createKpiRow("Derniere mise a jour", formatDateTime(data.lastUpdated), "neutral"));
    grid.appendChild(usageCard);

    content.appendChild(grid);

    const { card: flowCard, body: flowBody } = createSectionCard({
      title: "Trafic API",
      description: "Requetes, erreurs, correlation"
    });

    const tableState = { search: "", method: "", statusClass: "", source: "" };

    const tableContainer = document.createElement("div");

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher route, methode, status, correlationId...",
      onSearch: (value) => {
        tableState.search = value.toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Methode",
          options: [
            { label: "Toutes", value: "" },
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "PATCH", value: "PATCH" },
            { label: "DELETE", value: "DELETE" }
          ],
          onChange: (value) => {
            tableState.method = value;
            renderTable();
          }
        },
        {
          label: "Status",
          options: [
            { label: "Tous", value: "" },
            { label: "2xx", value: "2xx" },
            { label: "3xx", value: "3xx" },
            { label: "4xx", value: "4xx" },
            { label: "5xx", value: "5xx" }
          ],
          onChange: (value) => {
            tableState.statusClass = value;
            renderTable();
          }
        },
        {
          label: "Source",
          options: [
            { label: "Toutes", value: "" },
            { label: "CP", value: "CP" },
            { label: "API", value: "API" },
            { label: "LOG", value: "LOG" },
            { label: "DEMO", value: "DEMO" }
          ],
          onChange: (value) => {
            tableState.source = value;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refreshApi() },
        { label: "Exporter CSV", onClick: () => exportCsv(getFilteredRows(data.rows, tableState)) },
        { label: "Exporter JSON", onClick: () => exportJson(getFilteredRows(data.rows, tableState)) }
      ]
    });

    flowBody.appendChild(toolbar);
    flowBody.appendChild(tableContainer);

    const columns: TableColumn<ApiRow>[] = [
      {
        key: "ts",
        label: "Horodatage",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          const date = new Date(String(value));
          div.textContent = `${date.toLocaleDateString("fr-CA")} ${date.toLocaleTimeString("fr-CA")}`;
          return div;
        }
      },
      {
        key: "method",
        label: "Methode",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "path",
        label: "Route",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = "font-size:12px;font-weight:600;color:var(--ic-text,#e7ecef);";
          return div;
        }
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (value) => {
          const status = Number(value);
          const tone = status >= 500 ? "err" : status >= 400 ? "warn" : status >= 300 ? "info" : "ok";
          return createBadge(String(status), tone);
        }
      },
      {
        key: "latencyMs",
        label: "Latence",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = `${Math.round(Number(value))} ms`;
          div.style.cssText = "font-size:12px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "correlationId",
        label: "CorrelationId",
        sortable: false,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = value ? String(value) : "—";
          div.style.cssText = "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
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
            label: "Copier route",
            onClick: () => copyToClipboard(row.path)
          },
          {
            label: "Voir logs",
            onClick: () => { navigate("#/logs"); }
          },
          {
            label: "Details",
            onClick: () => showToast({ status: "info", message: row.message || `API ${row.method} ${row.path}` })
          }
        ]
      });

      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("api", {
          onAdd: () => refreshApi(),
          onClearFilter: () => {
            tableState.search = "";
            tableState.method = "";
            tableState.statusClass = "";
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

async function getApiData(): Promise<{ data: ApiData; errors: { metrics?: string; rows?: string }; mode: ApiMode }> {
  const demo = buildDemoApiData();
  const errors: { metrics?: string; rows?: string } = {};
  let rows = demo.rows;
  let kpi = demo.kpi;
  let mode: ApiMode = "demo";

  const metricsRes = await fetchJsonSafe<any>("/api/cp/api-metrics?limit=200");
  if (metricsRes.ok && metricsRes.data) {
    mode = "live";
    kpi = normalizeKpi(metricsRes.data, demo.kpi, demo.rows);
  } else if (metricsRes.error) {
    errors.metrics = metricsRes.error;
  }

  const errorsRes = await fetchJsonSafe<any>("/api/cp/api-errors?limit=200");
  if (errorsRes.ok && errorsRes.data) {
    const normalized = normalizeApiRows(errorsRes.data, "API");
    if (normalized.length > 0) rows = normalized;
    mode = "live";
  } else {
    const logsRes = await fetchJsonSafe<any>("/api/cp/logs?limit=200");
    if (logsRes.ok && logsRes.data) {
      const normalized = normalizeApiRows(logsRes.data, "LOG");
      if (normalized.length > 0) rows = normalized;
      if (mode !== "live") mode = "demo";
    } else {
      errors.rows = errorsRes.error || logsRes.error || "Impossible de charger /api/cp/api-errors";
      if (!metricsRes.ok) mode = "error";
    }
  }

  if (rows.length === 0) {
    rows = demo.rows;
    if (mode === "live") mode = "demo";
  }

  if (mode !== "live") {
    kpi = computeKpiFromRows(rows);
  }

  return {
    data: {
      rows,
      kpi,
      lastUpdated: new Date().toISOString()
    },
    errors,
    mode
  };
}

function normalizeKpi(raw: any, fallback: ApiKpi, rows: ApiRow[]): ApiKpi {
  const errorRate = Number(raw.errorRatePct ?? raw.error_rate ?? fallback.errorRatePct);
  const p95 = Number(raw.p95Ms ?? raw.latencyP95 ?? fallback.p95Ms);
  const rpmValue = raw.rpm ?? raw.requestsPerMin ?? rows.length * 2;
  const rpm = Number.isFinite(Number(rpmValue)) ? Number(rpmValue) : fallback.rpm;
  const status = String(raw.gatewayStatus || raw.status || "OK").toUpperCase();
  const gatewayStatus = status.includes("DOWN") ? "DOWN" : status.includes("DEG") ? "DEGRADE" : "OK";
  return { errorRatePct: errorRate, p95Ms: p95, rpm, gatewayStatus };
}

function normalizeApiRows(raw: any, fallbackSource: string): ApiRow[] {
  const rowsArray = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : [];
  return rowsArray.map((item: any) => ({
    ts: String(item.ts || item.time || item.timestamp || new Date().toISOString()),
    method: String(item.method || item.verb || "GET").toUpperCase(),
    path: String(item.path || item.route || item.url || "/api/unknown"),
    status: Number(item.status || item.statusCode || item.httpStatus || 200),
    latencyMs: Number(item.latencyMs || item.latency || item.duration || 0),
    source: String(item.source || item.origin || fallbackSource).toUpperCase(),
    correlationId: item.correlationId || item.correlation_id,
    message: item.message || item.label || item.code
  }));
}

function buildDemoApiData(): ApiData {
  const baseTime = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const rows: ApiRow[] = [
    { ts: new Date(baseTime - 1000 * 60 * 2).toISOString(), method: "GET", path: "/api/cp/metrics", status: 200, latencyMs: 120, source: "CP", correlationId: "api-001", message: "Telemetry fetch" },
    { ts: new Date(baseTime - 1000 * 60 * 4).toISOString(), method: "POST", path: "/api/cp/jobs", status: 201, latencyMs: 240, source: "API", correlationId: "api-002", message: "Job created" },
    { ts: new Date(baseTime - 1000 * 60 * 5).toISOString(), method: "GET", path: "/api/cp/users", status: 200, latencyMs: 160, source: "CP", correlationId: "api-003", message: "Users list" },
    { ts: new Date(baseTime - 1000 * 60 * 6).toISOString(), method: "GET", path: "/api/cp/logs", status: 200, latencyMs: 220, source: "LOG", correlationId: "api-004", message: "Logs stream" },
    { ts: new Date(baseTime - 1000 * 60 * 7).toISOString(), method: "PUT", path: "/api/cp/system", status: 403, latencyMs: 180, source: "CP", correlationId: "api-005", message: "Denied" },
    { ts: new Date(baseTime - 1000 * 60 * 8).toISOString(), method: "GET", path: "/api/cp/network", status: 200, latencyMs: 310, source: "API", correlationId: "api-006", message: "Network stats" },
    { ts: new Date(baseTime - 1000 * 60 * 9).toISOString(), method: "POST", path: "/api/cp/subscriptions", status: 500, latencyMs: 920, source: "API", correlationId: "api-007", message: "Upstream timeout" },
    { ts: new Date(baseTime - 1000 * 60 * 10).toISOString(), method: "GET", path: "/api/cp/audit", status: 200, latencyMs: 140, source: "LOG", correlationId: "api-008", message: "Audit events" },
    { ts: new Date(baseTime - 1000 * 60 * 12).toISOString(), method: "DELETE", path: "/api/cp/users/123", status: 409, latencyMs: 190, source: "CP", correlationId: "api-009", message: "Conflict" },
    { ts: new Date(baseTime - 1000 * 60 * 13).toISOString(), method: "PATCH", path: "/api/cp/settings", status: 200, latencyMs: 150, source: "API", correlationId: "api-010", message: "Settings update" },
    { ts: new Date(baseTime - 1000 * 60 * 14).toISOString(), method: "GET", path: "/api/cp/feature-flags", status: 200, latencyMs: 110, source: "CP", correlationId: "api-011", message: "Flags" },
    { ts: new Date(baseTime - 1000 * 60 * 15).toISOString(), method: "GET", path: "/api/cp/registry", status: 404, latencyMs: 130, source: "API", correlationId: "api-012", message: "Not found" }
  ];

  return {
    rows,
    kpi: computeKpiFromRows(rows),
    lastUpdated: new Date(baseTime).toISOString()
  };
}

function computeKpiFromRows(rows: ApiRow[]): ApiKpi {
  const total = rows.length || 1;
  const errorCount = rows.filter((row) => row.status >= 400).length;
  const latencies = rows.map((row) => row.latencyMs).sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.floor(latencies.length * 0.95) - 1);
  const p95Ms = latencies[p95Index] || 0;
  const errorRatePct = (errorCount / total) * 100;
  const rpm = total * 2;
  const gatewayStatus = errorRatePct > 50 ? "DOWN" : errorRatePct > 15 || p95Ms > 800 ? "DEGRADE" : "OK";
  return { errorRatePct, p95Ms, rpm, gatewayStatus };
}

function getFilteredRows(rows: ApiRow[], state: { search: string; method: string; statusClass: string; source: string }): ApiRow[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchMethod = !state.method || row.method === state.method;
    const matchSource = !state.source || row.source === state.source;
    const statusClass = String(row.status)[0] + "xx";
    const matchStatus = !state.statusClass || statusClass === state.statusClass;
    const matchSearch = !q ||
      row.path.toLowerCase().includes(q) ||
      row.method.toLowerCase().includes(q) ||
      String(row.status).includes(q) ||
      (row.correlationId || "").toLowerCase().includes(q) ||
      (row.message || "").toLowerCase().includes(q);
    return matchMethod && matchSource && matchStatus && matchSearch;
  });
}

function exportCsv(rows: ApiRow[]): void {
  const header = ["ts", "method", "path", "status", "latencyMs", "source", "correlationId", "message"];
  const esc = (s: any) => `"${String(s ?? "").replaceAll("\"", "\"\"")}"`;
  const body = rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")).join("\n");
  const csv = `${header.join(",")}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_api_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson(rows: ApiRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_api_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    showToast({ status: "warning", message: "Aucun correlationId a copier." });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: "success", message: "Copie reussie." });
  } catch {
    showToast({ status: "warning", message: "Copie impossible (permissions navigateur)." });
  }
}

function refreshApi(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderApiPageAsync(target);
}
