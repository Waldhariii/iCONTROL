/**
 * ICONTROL_CP_NETWORK_V2
 * SSOT Network page (CP)
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

type NetworkMode = "live" | "demo" | "error";

type NetworkHealth = {
  connectivity: string;
  dns: string;
  latencyMs: number;
  lossPct: number;
  stream: string;
};

type NetworkSession = {
  clientId: string;
  ip: string;
  region: string;
  transport: string;
  rttMs: number;
  bytesIn: number;
  bytesOut: number;
  state: string;
  lastSeen: string;
  correlationId?: string;
};

type NetworkEvent = {
  ts: string;
  type: string;
  severity: "INFO" | "WARN" | "ERR";
  message: string;
  correlationId?: string;
};

type NetworkData = {
  health: NetworkHealth;
  sessions: NetworkSession[];
  events: NetworkEvent[];
  lastUpdated: string;
};

let currentRoot: HTMLElement | null = null;

export function renderNetworkPage(root: HTMLElement): void {
  void renderNetworkPageAsync(root);
}

async function renderNetworkPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();
  const canAccess = canAccessPageRoute("network");

  if (!canAccess) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "network", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(safeMode);
      const { shell, content } = createPageShell({
        title: "Network",
        subtitle: "Sante reseau, connexions et evenements",
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

      const { card: sessionsCard, body: sessionsBody } = createSectionCard({
        title: "Connexions",
        description: "Flux reseau et sessions actives"
      });
      sessionsBody.appendChild(createCardSkeleton());
      content.appendChild(sessionsCard);

      const { card: eventsCard, body: eventsBody } = createSectionCard({
        title: "Evenements",
        description: "Alertes et changements reseau"
      });
      eventsBody.appendChild(createCardSkeleton());
      content.appendChild(eventsCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, errors, mode } = await getNetworkData();
  renderData(root, data, errors, mode, safeMode, role);
}

function renderData(
  root: HTMLElement,
  data: NetworkData,
  errors: { health?: string; sessions?: string; events?: string },
  mode: NetworkMode,
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
      title: "Network",
      subtitle: "Sante reseau, connexions et evenements",
      safeMode: safeModeValue,
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";

    const { card: healthCard, body: healthBody } = createSectionCard({
      title: "Sante reseau",
      description: "Disponibilite et latence"
    });

    if (errors.health) {
      healthBody.appendChild(createErrorState({ code: "ERR_NETWORK_HEALTH", message: errors.health }));
    }

    healthBody.appendChild(createKpiRow("Connectivite", data.health.connectivity, data.health.connectivity === "OK" ? "ok" : "warn"));
    healthBody.appendChild(createKpiRow("DNS", data.health.dns, data.health.dns === "OK" ? "ok" : "warn"));
    healthBody.appendChild(createKpiRow("Latence", `${Math.round(data.health.latencyMs)} ms`, data.health.latencyMs > 350 ? "warn" : "ok"));
    healthBody.appendChild(createKpiRow("Perte", `${data.health.lossPct.toFixed(1)}%`, data.health.lossPct > 1 ? "warn" : "ok"));
    healthBody.appendChild(createKpiRow("Stream", data.health.stream, data.health.stream === "UP" ? "ok" : "warn"));

    grid.appendChild(healthCard);

    const { card: summaryCard, body: summaryBody } = createSectionCard({
      title: "Synthese",
      description: "Sessions et evenements"
    });
    summaryBody.appendChild(createKpiRow("Sessions actives", String(data.sessions.length), "neutral"));
    summaryBody.appendChild(createKpiRow("Evenements", String(data.events.length), data.events.length > 0 ? "warn" : "ok"));
    summaryBody.appendChild(createKpiRow("Derniere mise a jour", formatDateTime(data.lastUpdated), "neutral"));
    grid.appendChild(summaryCard);

    content.appendChild(grid);

    const { card: sessionsCard, body: sessionsBody } = createSectionCard({
      title: "Connexions",
      description: "Sessions reseau actives"
    });

    const sessionState = { search: "", state: "", transport: "" };
    const sessionsContainer = document.createElement("div");

    const { element: sessionsToolbar, searchInput: sessionSearch } = createToolbar({
      searchPlaceholder: "Rechercher client, IP, region...",
      onSearch: (value) => {
        sessionState.search = value.toLowerCase().trim();
        renderSessions();
      },
      filters: [
        {
          label: "Etat",
          options: [
            { label: "Tous", value: "" },
            { label: "OPEN", value: "OPEN" },
            { label: "IDLE", value: "IDLE" },
            { label: "CLOSED", value: "CLOSED" }
          ],
          onChange: (value) => {
            sessionState.state = value;
            renderSessions();
          }
        },
        {
          label: "Transport",
          options: [
            { label: "Tous", value: "" },
            { label: "WS", value: "WS" },
            { label: "HTTP2", value: "HTTP2" },
            { label: "TCP", value: "TCP" }
          ],
          onChange: (value) => {
            sessionState.transport = value;
            renderSessions();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refreshNetwork() },
        { label: "Exporter CSV", onClick: () => exportSessionsCsv(getFilteredSessions(data.sessions, sessionState)) },
        { label: "Exporter JSON", onClick: () => exportJson(getFilteredSessions(data.sessions, sessionState)) }
      ]
    });

    sessionsBody.appendChild(sessionsToolbar);
    sessionsBody.appendChild(sessionsContainer);

    const sessionColumns: TableColumn<NetworkSession>[] = [
      { key: "clientId", label: "Client", sortable: true },
      { key: "ip", label: "IP", sortable: true },
      { key: "region", label: "Region", sortable: true },
      {
        key: "transport",
        label: "Transport",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "rttMs",
        label: "RTT",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = `${Math.round(Number(value))} ms`;
          div.style.cssText = "font-size:12px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      },
      {
        key: "state",
        label: "Etat",
        sortable: true,
        render: (value) => createBadge(String(value), String(value) === "OPEN" ? "ok" : String(value) === "IDLE" ? "warn" : "neutral")
      },
      {
        key: "lastSeen",
        label: "Derniere vue",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = formatDateTime(String(value));
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      }
    ];

    const renderSessions = () => {
      sessionsContainer.innerHTML = "";
      const filtered = getFilteredSessions(data.sessions, sessionState);
      const table = createDataTable({
        columns: sessionColumns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 10,
        actions: (row) => [
          {
            label: row.correlationId ? "Copier CID" : "Copier CID (—)",
            onClick: () => copyToClipboard(row.correlationId || "")
          },
          {
            label: "Voir logs",
            onClick: () => { navigate("#/logs"); }
          }
        ]
      });
      sessionsContainer.appendChild(table);

      if (filtered.length === 0) {
        sessionsContainer.appendChild(createContextualEmptyState("network", {
          onAdd: () => refreshNetwork(),
          onClearFilter: () => {
            sessionState.search = "";
            sessionState.state = "";
            sessionState.transport = "";
            if (sessionSearch) sessionSearch.value = "";
            renderSessions();
          }
        }));
      }
    };

    renderSessions();
    content.appendChild(sessionsCard);

    const { card: eventsCard, body: eventsBody } = createSectionCard({
      title: "Evenements",
      description: "Alertes reseau et changements"
    });

    if (errors.events) {
      eventsBody.appendChild(createErrorState({ code: "ERR_NETWORK_EVENTS", message: errors.events }));
    }

    const eventState = { search: "", severity: "" };
    const eventsContainer = document.createElement("div");

    const { element: eventsToolbar, searchInput: eventSearch } = createToolbar({
      searchPlaceholder: "Rechercher message, type, correlationId...",
      onSearch: (value) => {
        eventState.search = value.toLowerCase().trim();
        renderEvents();
      },
      filters: [
        {
          label: "Severite",
          options: [
            { label: "Toutes", value: "" },
            { label: "INFO", value: "INFO" },
            { label: "WARN", value: "WARN" },
            { label: "ERR", value: "ERR" }
          ],
          onChange: (value) => {
            eventState.severity = value;
            renderEvents();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", onClick: () => refreshNetwork() },
        { label: "Exporter CSV", onClick: () => exportEventsCsv(getFilteredEvents(data.events, eventState)) }
      ]
    });

    eventsBody.appendChild(eventsToolbar);
    eventsBody.appendChild(eventsContainer);

    const eventColumns: TableColumn<NetworkEvent>[] = [
      {
        key: "ts",
        label: "Horodatage",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = formatDateTime(String(value));
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      },
      {
        key: "type",
        label: "Type",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "severity",
        label: "Severite",
        sortable: true,
        render: (value) => createBadge(String(value), String(value) === "ERR" ? "err" : String(value) === "WARN" ? "warn" : "info")
      },
      {
        key: "message",
        label: "Message",
        sortable: false,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = "font-size:12px;color:var(--ic-text,#e7ecef);";
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
          div.style.cssText = "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      }
    ];

    const renderEvents = () => {
      eventsContainer.innerHTML = "";
      const filtered = getFilteredEvents(data.events, eventState);
      const table = createDataTable({
        columns: eventColumns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 10,
        actions: (row) => [
          {
            label: row.correlationId ? "Copier CID" : "Copier CID (—)",
            onClick: () => copyToClipboard(row.correlationId || "")
          },
          {
            label: "Details",
            onClick: () => showToast({ status: "info", message: row.message })
          }
        ]
      });
      eventsContainer.appendChild(table);

      if (filtered.length === 0) {
        eventsContainer.appendChild(createContextualEmptyState("network", {
          onAdd: () => refreshNetwork(),
          onClearFilter: () => {
            eventState.search = "";
            eventState.severity = "";
            if (eventSearch) eventSearch.value = "";
            renderEvents();
          }
        }));
      }
    };

    renderEvents();
    content.appendChild(eventsCard);

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

async function getNetworkData(): Promise<{ data: NetworkData; errors: { health?: string; sessions?: string; events?: string }; mode: NetworkMode }> {
  const demo = buildDemoNetworkData();
  const errors: { health?: string; sessions?: string; events?: string } = {};
  let mode: NetworkMode = "demo";
  let health = demo.health;
  let sessions = demo.sessions;
  let events = demo.events;

  const healthRes = await fetchJsonSafe<any>("/api/cp/network");
  if (healthRes.ok && healthRes.data) {
    mode = "live";
    health = normalizeHealth(healthRes.data, demo.health);
  } else if (healthRes.error) {
    errors.health = healthRes.error;
  }

  const sessionsRes = await fetchJsonSafe<any>("/api/cp/network-sessions?limit=200");
  if (sessionsRes.ok && sessionsRes.data) {
    const normalized = normalizeSessions(sessionsRes.data);
    if (normalized.length > 0) sessions = normalized;
    mode = "live";
  } else if (sessionsRes.error) {
    errors.sessions = sessionsRes.error;
  }

  const eventsRes = await fetchJsonSafe<any>("/api/cp/network-events?limit=200");
  if (eventsRes.ok && eventsRes.data) {
    const normalized = normalizeEvents(eventsRes.data);
    if (normalized.length > 0) events = normalized;
    mode = "live";
  } else if (eventsRes.error) {
    errors.events = eventsRes.error;
  }

  if (sessions.length === 0) sessions = demo.sessions;
  if (events.length === 0) events = demo.events;

  if (!healthRes.ok && !sessionsRes.ok && !eventsRes.ok) {
    mode = "error";
  }

  return {
    data: {
      health,
      sessions,
      events,
      lastUpdated: new Date().toISOString()
    },
    errors,
    mode
  };
}

function normalizeHealth(raw: any, fallback: NetworkHealth): NetworkHealth {
  return {
    connectivity: String(raw.connectivity || raw.status || fallback.connectivity).toUpperCase(),
    dns: String(raw.dns || raw.dnsStatus || fallback.dns).toUpperCase(),
    latencyMs: Number(raw.latencyMs || raw.p95 || fallback.latencyMs),
    lossPct: Number(raw.lossPct || raw.loss || fallback.lossPct),
    stream: String(raw.stream || raw.websocket || fallback.stream).toUpperCase()
  };
}

function normalizeSessions(raw: any): NetworkSession[] {
  const rowsArray = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : [];
  return rowsArray.map((item: any, idx: number) => ({
    clientId: String(item.clientId || item.client || `client-${idx + 1}`),
    ip: String(item.ip || item.address || "0.0.0.0"),
    region: String(item.region || item.zone || "global"),
    transport: String(item.transport || item.protocol || "WS").toUpperCase(),
    rttMs: Number(item.rttMs || item.rtt || item.latency || 0),
    bytesIn: Number(item.bytesIn || item.rx || 0),
    bytesOut: Number(item.bytesOut || item.tx || 0),
    state: String(item.state || item.status || "OPEN").toUpperCase(),
    lastSeen: String(item.lastSeen || item.ts || item.time || new Date().toISOString()),
    correlationId: item.correlationId || item.correlation_id
  }));
}

function normalizeEvents(raw: any): NetworkEvent[] {
  const rowsArray = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : [];
  return rowsArray.map((item: any) => ({
    ts: String(item.ts || item.time || item.timestamp || new Date().toISOString()),
    type: String(item.type || item.event || "CONNECT").toUpperCase(),
    severity: mapSeverity(item.severity || item.level),
    message: String(item.message || item.label || "Network event"),
    correlationId: item.correlationId || item.correlation_id
  }));
}

function mapSeverity(value: any): "INFO" | "WARN" | "ERR" {
  const v = String(value || "INFO").toUpperCase();
  if (v === "ERR" || v === "ERROR") return "ERR";
  if (v === "WARN" || v === "WARNING") return "WARN";
  return "INFO";
}

function buildDemoNetworkData(): NetworkData {
  const baseTime = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const health: NetworkHealth = {
    connectivity: "OK",
    dns: "OK",
    latencyMs: 120,
    lossPct: 0.2,
    stream: "UP"
  };
  const sessions: NetworkSession[] = [
    { clientId: "client-01", ip: "10.4.2.10", region: "ca-east", transport: "WS", rttMs: 40, bytesIn: 4200, bytesOut: 3800, state: "OPEN", lastSeen: new Date(baseTime - 1000 * 60 * 2).toISOString(), correlationId: "net-001" },
    { clientId: "client-02", ip: "10.4.2.11", region: "us-east", transport: "HTTP2", rttMs: 80, bytesIn: 2100, bytesOut: 1650, state: "IDLE", lastSeen: new Date(baseTime - 1000 * 60 * 4).toISOString(), correlationId: "net-002" },
    { clientId: "client-03", ip: "10.4.2.12", region: "eu-west", transport: "WS", rttMs: 120, bytesIn: 9800, bytesOut: 11200, state: "OPEN", lastSeen: new Date(baseTime - 1000 * 60 * 6).toISOString(), correlationId: "net-003" },
    { clientId: "client-04", ip: "10.4.2.13", region: "ap-south", transport: "TCP", rttMs: 160, bytesIn: 3100, bytesOut: 2800, state: "CLOSED", lastSeen: new Date(baseTime - 1000 * 60 * 9).toISOString(), correlationId: "net-004" }
  ];
  const events: NetworkEvent[] = [
    { ts: new Date(baseTime - 1000 * 60 * 2).toISOString(), type: "CONNECT", severity: "INFO", message: "Client connected", correlationId: "net-evt-01" },
    { ts: new Date(baseTime - 1000 * 60 * 5).toISOString(), type: "RETRY", severity: "WARN", message: "Retry storm detected", correlationId: "net-evt-02" },
    { ts: new Date(baseTime - 1000 * 60 * 8).toISOString(), type: "THROTTLE", severity: "WARN", message: "Bandwidth throttled", correlationId: "net-evt-03" },
    { ts: new Date(baseTime - 1000 * 60 * 12).toISOString(), type: "DISCONNECT", severity: "ERR", message: "Unexpected disconnect", correlationId: "net-evt-04" }
  ];

  return { health, sessions, events, lastUpdated: new Date(baseTime).toISOString() };
}

function getFilteredSessions(rows: NetworkSession[], state: { search: string; state: string; transport: string }): NetworkSession[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchState = !state.state || row.state === state.state;
    const matchTransport = !state.transport || row.transport === state.transport;
    const matchSearch = !q ||
      row.clientId.toLowerCase().includes(q) ||
      row.ip.toLowerCase().includes(q) ||
      row.region.toLowerCase().includes(q) ||
      (row.correlationId || "").toLowerCase().includes(q);
    return matchState && matchTransport && matchSearch;
  });
}

function getFilteredEvents(rows: NetworkEvent[], state: { search: string; severity: string }): NetworkEvent[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchSeverity = !state.severity || row.severity === state.severity;
    const matchSearch = !q ||
      row.message.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q) ||
      (row.correlationId || "").toLowerCase().includes(q);
    return matchSeverity && matchSearch;
  });
}

function exportSessionsCsv(rows: NetworkSession[]): void {
  const header = ["clientId", "ip", "region", "transport", "rttMs", "bytesIn", "bytesOut", "state", "lastSeen", "correlationId"];
  const esc = (s: any) => `"${String(s ?? "").replaceAll("\"", "\"\"")}"`;
  const body = rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")).join("\n");
  const csv = `${header.join(",")}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_network_sessions_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportEventsCsv(rows: NetworkEvent[]): void {
  const header = ["ts", "type", "severity", "message", "correlationId"];
  const esc = (s: any) => `"${String(s ?? "").replaceAll("\"", "\"\"")}"`;
  const body = rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")).join("\n");
  const csv = `${header.join(",")}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_network_events_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJson(rows: NetworkSession[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_network_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
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

function refreshNetwork(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderNetworkPageAsync(target);
}
