/**
 * ICONTROL_CP_DASHBOARD_V3
 * Console ops — KPI + Evenements + API Testing + Network Activity
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createCardSkeleton } from "/src/core/ui/skeletonLoader";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createToolbar } from "/src/core/ui/toolbar";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createContextualEmptyState } from "/src/core/ui/emptyState";
import { createDonutGauge } from "/src/core/ui/charts/donutGauge";
import { createMiniBars } from "/src/core/ui/charts/miniBars";
import { createLineChart } from "/src/core/ui/charts/lineChart";
import { navigate } from "/src/runtime/navigate";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

const API_TABS = [
  { id: "headers", label: "Headers", content: "x-correlation-id: auto\nx-safe-mode: inherit" },
  { id: "body", label: "Body", content: "{\n  \"limit\": 50,\n  \"sample\": true\n}" },
  { id: "auth", label: "Auth", content: "Bearer <token>\nScope: cp:read" },
  { id: "run", label: "Run", content: "Historique: 3 requêtes (DEMO)" }
];

type DashboardKpi = {
  availabilityPct: number;
  latencyP95: number;
  errors24h: number;
  requests24h: number;
};

type DashboardEvent = {
  time: string;
  source: "DEMO" | "SYSTEM" | "CP";
  severity: "INFO" | "WARN" | "ERR";
  message: string;
  code: string;
};

type NetworkData = {
  availabilityPct: number;
  latencySeries: number[];
  trafficSeries: number[];
  statusBuckets: { ok: number; warn: number; err: number };
  lastUpdated: string;
};

type DashboardPayload = {
  kpi: DashboardKpi;
  events: DashboardEvent[];
  network: NetworkData;
  mode: "live" | "demo" | "error";
  errors: { events?: string; network?: string };
};

export function renderDashboardPage(root: HTMLElement): void {
  renderDashboardInternal(root);
}

function refreshDashboard(root: HTMLElement): void {
  renderDashboardInternal(root);
}

function renderDashboardInternal(root: HTMLElement): void {
  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(getSafeMode());
      const { shell, content } = createPageShell({
        title: "Console",
        subtitle: "API testing + network activity (console ops)",
        safeMode: safeModeValue,
        statusBadge: { label: "CHARGEMENT", tone: "info" },
        actions: [
          { label: "Actualiser", icon: "⟳", onClick: () => refreshDashboard(root) }
        ]
      });

      const kpiGrid = createKpiGrid();
      for (let i = 0; i < 4; i += 1) {
        kpiGrid.appendChild(createCardSkeleton());
      }
      content.appendChild(kpiGrid);

      const { card: eventsCard, body: eventsBody } = createSectionCard({
        title: "Événements récents",
        description: "Derniers événements système (audit / logs) — lecture seule",
        variant: "glass"
      });
      eventsBody.appendChild(createCardSkeleton());
      content.appendChild(eventsCard);

      const toolsGrid = createToolsGrid();
      toolsGrid.appendChild(createCardSkeleton());
      toolsGrid.appendChild(createCardSkeleton());
      content.appendChild(toolsGrid);

      root.appendChild(shell);
    });
  };

  const renderData = (payload: DashboardPayload) => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(getSafeMode());
      const statusBadge = payload.mode === "live"
        ? { label: "LIVE", tone: "ok" as const }
        : payload.mode === "demo"
          ? { label: "DEMO", tone: "warn" as const }
          : { label: "ERREUR", tone: "err" as const };

      const { shell, content } = createPageShell({
        title: "Console",
        subtitle: "API testing + network activity (console ops)",
        safeMode: safeModeValue,
        statusBadge,
        actions: [
          { label: "Actualiser", icon: "⟳", onClick: () => refreshDashboard(root) },
          { label: "Logs", icon: "📋", onClick: () => { navigate("#/logs"); } }
        ]
      });

      const kpiGrid = createKpiGrid();
      kpiGrid.appendChild(createKpiCard("Disponibilité", `${payload.kpi.availabilityPct}%`, "Global OK", "ok"));
      kpiGrid.appendChild(createKpiCard("Latence p95", `${payload.kpi.latencyP95}ms`, "↗ stable", "info"));
      kpiGrid.appendChild(createKpiCard("Erreurs (24h)", formatNumber(payload.kpi.errors24h), "Seuil normal", payload.kpi.errors24h > 20 ? "err" : payload.kpi.errors24h > 6 ? "warn" : "ok"));
      kpiGrid.appendChild(createKpiCard("Requêtes (24h)", formatNumber(payload.kpi.requests24h), "API + Jobs", "info"));
      content.appendChild(kpiGrid);

      const eventsCard = createEventsSection(payload.events, payload.errors.events, () => refreshDashboard(root));
      content.appendChild(eventsCard);

      const toolsGrid = createToolsGrid();
      toolsGrid.appendChild(createApiTestingPanel());
      toolsGrid.appendChild(createNetworkActivityPanel(payload.network, payload.errors.network));
      content.appendChild(toolsGrid);

      root.appendChild(shell);
    });
  };

  renderLoading();
  getDashboardData()
    .then((payload) => {
      renderData(payload);
    })
    .catch((error) => {
      const demo = buildDemoPayload();
      demo.mode = "error";
      demo.errors.network = String(error);
      renderData(demo);
    });
}

function createApiTestingPanel(): HTMLElement {
  const { card, body } = createSectionCard({
    title: "API Testing",
    description: "Composer et simuler des appels en environnement CP",
    variant: "glass"
  });

  const formRow = document.createElement("div");
  formRow.style.minWidth = "0";
  formRow.style.boxSizing = "border-box";
  formRow.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap;";

  const method = document.createElement("select");
  ["GET", "POST", "PUT", "DELETE"].forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    method.appendChild(option);
  });
  method.style.cssText = "background: rgba(0,0,0,0.35); color: var(--ic-text,#e7ecef); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:8px 10px; font-size:12px;";

  const input = document.createElement("input");
  input.placeholder = "/api/cp/metrics";
  input.value = "/api/cp/network";
  input.style.cssText = "flex:1; min-width:220px; background: rgba(0,0,0,0.35); color: var(--ic-text,#e7ecef); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:8px 12px; font-size:12px;";

  const send = document.createElement("button");
  send.textContent = "Send";
  send.style.cssText = "padding:8px 16px; border-radius:10px; border:1px solid var(--ic-accent,#7b2cff); background: var(--ic-accent,#7b2cff); color: white; font-weight:600; font-size:12px; cursor:pointer;";

  formRow.appendChild(method);
  formRow.appendChild(input);
  formRow.appendChild(send);
  body.appendChild(formRow);

  const statusLine = document.createElement("div");
  statusLine.textContent = "Prêt — aucune requête envoyée";
  statusLine.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  body.appendChild(statusLine);

  const tabRow = document.createElement("div");
  tabRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";
  const tabContent = document.createElement("div");
  tabContent.style.cssText = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-size: 11px; color: var(--ic-text,#e7ecef); background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px; white-space: pre-wrap;";

  const setActive = (id: string) => {
    tabRow.querySelectorAll("button").forEach((btn) => {
      const active = btn.getAttribute("data-id") === id;
      btn.setAttribute("data-active", active ? "1" : "0");
      (btn as HTMLButtonElement).style.background = active ? "rgba(255,255,255,0.12)" : "transparent";
      (btn as HTMLButtonElement).style.color = active ? "var(--ic-text,#e7ecef)" : "var(--ic-mutedText,#a7b0b7)";
      (btn as HTMLButtonElement).style.borderColor = active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)";
    });
    const tab = API_TABS.find((t) => t.id === id) || API_TABS[0];
    tabContent.textContent = tab.content;
  };

  API_TABS.forEach((tab, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = tab.label;
    btn.setAttribute("data-id", tab.id);
    btn.style.cssText = "padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background: transparent; font-size:11px; cursor:pointer;";
    btn.onclick = () => setActive(tab.id);
    tabRow.appendChild(btn);
    if (idx === 0) setActive(tab.id);
  });

  body.appendChild(tabRow);
  body.appendChild(tabContent);

  send.onclick = () => {
    const url = input.value.trim() || "/api/cp/metrics";
    statusLine.textContent = `Dernier envoi: ${method.value} ${url} — 200 OK (DEMO)`;
  };

  return card;
}

function createNetworkActivityPanel(network: NetworkData, error?: string): HTMLElement {
  const { card, body } = createSectionCard({
    title: "Network Activity",
    description: "Latence, disponibilité et flux temps réel",
    variant: "glass"
  });

  if (error) {
    body.appendChild(createCompactErrorBanner("ERR_NETWORK_FETCH", error));
  }

  const layout = document.createElement("div");
  layout.style.cssText = "display:grid; grid-template-columns: 200px 1fr; gap:16px; align-items:start;";

  const left = document.createElement("div");
  left.style.cssText = "display:flex; flex-direction:column; gap:12px; align-items:flex-start;";
  left.appendChild(createDonutGauge({
    valuePct: network.availabilityPct,
    label: "Availability",
    sublabel: `${network.availabilityPct}%`
  }));

  const legend = document.createElement("div");
  legend.style.cssText = "display:flex; flex-direction:column; gap:6px; font-size:12px;";
  legend.appendChild(createLegendItem("OK", network.statusBuckets.ok, "ok"));
  legend.appendChild(createLegendItem("WARN", network.statusBuckets.warn, "warn"));
  legend.appendChild(createLegendItem("ERR", network.statusBuckets.err, "err"));
  left.appendChild(legend);

  const right = document.createElement("div");
  right.style.cssText = "display:flex; flex-direction:column; gap:12px;";

  const trafficWrap = document.createElement("div");
  trafficWrap.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const trafficMeta = document.createElement("div");
  trafficMeta.innerHTML = `<div style="font-size:12px; color: var(--ic-mutedText,#a7b0b7);">Throughput (req/min)</div><div style="font-size:14px; font-weight:700; color: var(--ic-text,#e7ecef);">${formatNumber(average(network.trafficSeries))}</div>`;
  trafficWrap.appendChild(trafficMeta);
  trafficWrap.appendChild(createMiniBars({ values: network.trafficSeries, height: 80 }));

  const latencyWrap = document.createElement("div");
  latencyWrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
  const latencyLabel = document.createElement("div");
  latencyLabel.textContent = "Latency timeline (ms)";
  latencyLabel.style.cssText = "font-size:12px; color: var(--ic-mutedText,#a7b0b7);";
  latencyWrap.appendChild(latencyLabel);
  latencyWrap.appendChild(createLineChart({ values: network.latencySeries, height: 120 }));

  const legendTable = document.createElement("div");
  legendTable.style.cssText = "display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:8px; font-size:12px;";
  legendTable.appendChild(createLegendStat("Raw", `${network.statusBuckets.ok + network.statusBuckets.warn + network.statusBuckets.err}s`));
  legendTable.appendChild(createLegendStat("Avg", `${Math.round(average(network.latencySeries))}ms`));
  legendTable.appendChild(createLegendStat("Min", `${Math.min(...network.latencySeries)}ms`));
  legendTable.appendChild(createLegendStat("Max", `${Math.max(...network.latencySeries)}ms`));

  right.appendChild(trafficWrap);
  right.appendChild(latencyWrap);
  right.appendChild(legendTable);

  layout.appendChild(left);
  layout.appendChild(right);
  body.appendChild(layout);

  const updated = document.createElement("div");
  updated.style.cssText = "margin-top: 6px; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  updated.textContent = `Dernière mise à jour: ${new Date(network.lastUpdated).toLocaleString("fr-CA")}`;
  body.appendChild(updated);

  return card;
}

function createEventsSection(events: DashboardEvent[], error: string | undefined, onRefresh: () => void): HTMLElement {
  const { card, body } = createSectionCard({
    title: "Événements récents",
    description: "Derniers événements système (audit / logs) — lecture seule",
    variant: "glass"
  });

  if (error) {
    body.appendChild(createCompactErrorBanner("ERR_EVENTS_FETCH", error));
  }

  const tableState = { search: "", severity: "" };
  const tableContainer = document.createElement("div");

  const { element: toolbar, searchInput } = createToolbar({
    searchPlaceholder: "Rechercher...",
    onSearch: (value) => {
      tableState.search = value.toLowerCase().trim();
      renderTable();
    },
    filters: [
      {
        label: "Sévérité",
        options: [
          { label: "Toutes", value: "" },
          { label: "INFO", value: "INFO" },
          { label: "WARN", value: "WARN" },
          { label: "ERR", value: "ERR" }
        ],
        onChange: (value) => {
          tableState.severity = value;
          renderTable();
        }
      }
    ],
    actions: [
      { label: "Rafraîchir", primary: true, onClick: onRefresh },
      { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
    ]
  });

  body.appendChild(toolbar);
  body.appendChild(tableContainer);

  const columns: TableColumn<DashboardEvent>[] = [
    {
      key: "time",
      label: "Heure",
      sortable: true,
      render: (value) => {
        const div = document.createElement("div");
        div.textContent = formatTime(String(value));
        div.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
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
      key: "message",
      label: "Message",
      sortable: false,
      render: (value) => {
        const div = document.createElement("div");
        div.textContent = String(value);
        div.style.cssText = "font-size: 12px; color: var(--ic-text, #e7ecef);";
        return div;
      }
    },
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value, row) => {
        const div = document.createElement("div");
        div.textContent = String(value);
        div.style.cssText = `font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; color: ${row.severity === "ERR" ? "var(--ic-error,#f48771)" : "var(--ic-mutedText,#a7b0b7)"}; font-size: 11px;`;
        return div;
      }
    }
  ];

  function renderTable(): void {
    tableContainer.innerHTML = "";
    const filtered = events.filter((row) => {
      const matchSeverity = !tableState.severity || row.severity === tableState.severity;
      const q = tableState.search;
      const matchSearch = !q || row.message.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
      return matchSeverity && matchSearch;
    });

    const table = createDataTable({
      columns,
      data: filtered,
      searchable: false,
      sortable: true,
      pagination: true,
      pageSize: 8
    });
    tableContainer.appendChild(table);

    if (filtered.length === 0) {
      tableContainer.appendChild(createContextualEmptyState("logs", {
        searchQuery: tableState.search || undefined,
        filter: tableState.severity || undefined,
        onClearFilter: () => {
          tableState.search = "";
          tableState.severity = "";
          if (searchInput) searchInput.value = "";
          renderTable();
        }
      }));
    }
  }

  renderTable();
  return card;
}

function createCompactErrorBanner(code: string, message: string): HTMLElement {
  const banner = document.createElement("div");
  banner.style.cssText = "padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(244,135,113,0.35); background: rgba(244,135,113,0.08); display:flex; flex-direction:column; gap:4px;";
  const title = document.createElement("div");
  title.textContent = code;
  title.style.cssText = "font-size: 12px; font-weight: 700; color: rgba(244,135,113,0.95);";
  const desc = document.createElement("div");
  desc.textContent = message;
  desc.style.cssText = "font-size: 11px; color: rgba(231,236,239,0.78);";
  banner.appendChild(title);
  banner.appendChild(desc);
  return banner;
}

function createKpiGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; width:100%;";
  return grid;
}

function createToolsGrid(): HTMLElement {
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid; grid-template-columns: repeat(auto-fit, minmax(560px, 1fr)); gap: 16px; width:100%;";
  return grid;
}

function createKpiCard(title: string, value: string, subtext: string, tone: "ok" | "warn" | "err" | "info"): HTMLElement {
  const { card, body } = createSectionCard({
    title,
    description: subtext,
    variant: "glass",
    dense: true
  });

  const valueEl = document.createElement("div");
  valueEl.textContent = value;
  valueEl.style.cssText = "font-size: 22px; font-weight: 800; color: var(--ic-text, #e7ecef);";

  const badge = createBadge(tone.toUpperCase(), tone === "info" ? "info" : tone);

  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  row.appendChild(valueEl);
  row.appendChild(badge);

  body.appendChild(row);
  return card;
}

function createLegendItem(label: string, value: number, tone: "ok" | "warn" | "err"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  const right = document.createElement("div");
  right.textContent = String(value);
  right.style.cssText = `font-size: 12px; font-weight: 700; color: ${tone === "err" ? "var(--ic-error,#f48771)" : tone === "warn" ? "var(--ic-warn,#f59e0b)" : "var(--ic-success,#4ec9b0)"};`;
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function createLegendStat(label: string, value: string): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size:11px; color: var(--ic-mutedText,#a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = "font-size:12px; font-weight:700; color: var(--ic-text,#e7ecef);";
  row.appendChild(left);
  row.appendChild(right);
  return row;
}



function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-CA").format(value);
}

function formatTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString("fr-CA");
}

function average(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((sum, v) => sum + v, 0);
  return Math.round(total / values.length);
}

function buildDemoPayload(): DashboardPayload {
  const kpi = buildDemoKpis();
  const events = buildDemoEvents();
  const network = buildDemoNetwork();
  return { kpi, events, network, mode: "demo", errors: {} };
}

function buildDemoKpis(): DashboardKpi {
  return {
    availabilityPct: 99.9,
    latencyP95: 22,
    errors24h: 12,
    requests24h: 12840
  };
}

function buildDemoEvents(): DashboardEvent[] {
  return [
    { time: "2026-01-19T12:18:04.000Z", source: "SYSTEM", severity: "INFO", message: "Sync modules termine", code: "SYNC_OK" },
    { time: "2026-01-19T12:16:42.000Z", source: "CP", severity: "WARN", message: "Quota d'appel eleve", code: "WARN_RATE" },
    { time: "2026-01-19T12:15:21.000Z", source: "SYSTEM", severity: "INFO", message: "Rotation cle API", code: "KEY_ROTATE" },
    { time: "2026-01-19T12:12:17.000Z", source: "DEMO", severity: "INFO", message: "Provisioning metrics", code: "DEMO_INIT" },
    { time: "2026-01-19T12:10:48.000Z", source: "CP", severity: "WARN", message: "Latence p95 elevee", code: "WARN_LAT" },
    { time: "2026-01-19T12:09:11.000Z", source: "SYSTEM", severity: "ERR", message: "Erreur d'ecriture audit", code: "ERR_AUDIT" }
  ];
}

function buildDemoNetwork(): NetworkData {
  return {
    availabilityPct: 79,
    latencySeries: [18, 21, 28, 26, 24, 22, 27, 30, 28, 32, 26, 24, 29, 33, 31, 27, 25, 22, 24, 28, 30, 33, 27, 25, 29, 34, 36, 31, 28, 26, 24, 22, 25, 27, 31, 35, 33, 29, 26, 24, 22, 23, 25, 28, 31, 34, 32, 29, 27, 25],
    trafficSeries: [14, 18, 22, 20, 26, 30, 28, 34, 32, 38, 36, 30, 24, 28, 32, 26, 22, 24, 28, 30, 34, 36, 32, 28],
    statusBuckets: { ok: 824, warn: 36, err: 12 },
    lastUpdated: "2026-01-19T12:20:00.000Z"
  };
}

async function getDashboardData(): Promise<DashboardPayload> {
  const demo = buildDemoPayload();

  const networkRes = await fetchJsonSafe<any>("/api/cp/network");
  if (networkRes.ok && networkRes.data) {
    const raw = networkRes.data;
    const latencySeries = Array.isArray(raw.latencySeries) ? raw.latencySeries : demo.network.latencySeries;
    const trafficSeries = Array.isArray(raw.trafficSeries) ? raw.trafficSeries : demo.network.trafficSeries;
    const statusBuckets = raw.statusBuckets || raw.status || demo.network.statusBuckets;
    const network: NetworkData = {
      availabilityPct: Number(raw.availabilityPct ?? raw.availability ?? demo.network.availabilityPct),
      latencySeries,
      trafficSeries,
      statusBuckets: {
        ok: Number(statusBuckets?.ok ?? demo.network.statusBuckets.ok),
        warn: Number(statusBuckets?.warn ?? demo.network.statusBuckets.warn),
        err: Number(statusBuckets?.err ?? demo.network.statusBuckets.err)
      },
      lastUpdated: "2026-01-19T12:20:00.000Z"
    };
    return { ...demo, network, mode: "live", errors: {} };
  }

  demo.errors.network = networkRes.error || "Impossible de charger /api/cp/network";
  return demo;
}
