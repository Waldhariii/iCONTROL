/**
 * ICONTROL_CP_DASHBOARD_V4
 * Dashboard style Developer Toolbox avec 4 panneaux en grille 2x2
 * - API Testing (top left)
 * - Logs (top right)
 * - Network Activity (bottom left)
 * - Registry viewer (bottom right)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { navigate } from "/src/router";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { readAuditLog } from "/src/core/audit/auditLog";
import { MAIN_SYSTEM_MODULES } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.data";
import { createCardSkeleton } from "/src/core/ui/skeletonLoader";
import { addTooltipToElement } from "/src/core/ui/tooltip";
import { createLineChart, createSparkline } from "/src/core/ui/charts";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";

type DashboardStatus = "OPERATIONNEL" | "DEGRADE" | "INCIDENT";

type DashboardEvent = {
  time: string;
  type: "AUDIT" | "LOG" | "SYSTEM" | "API" | "DEMO";
  label: string;
  tone: "neutral" | "info" | "ok" | "warn" | "err" | "accent";
  correlationId?: string;
};

type DashboardData = {
  kpi: {
    cpuPct: number;
    memPct: number;
    latencyMs: number;
    api24h: number;
    jobs24h: number;
    activeUsers: number;
    warn24h: number;
    err24h: number;
    modulesActive: number;
    modulesInactive: number;
    topModule?: string;
    peak24h?: number;
  };
  status: DashboardStatus;
  lastUpdated: string;
  recentEvents: DashboardEvent[];
};

const PANEL_STYLE = `
  background: var(--ic-card, #1a1d1f);
  border: 1px solid var(--ic-border, #2b3136);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const PANEL_HEADER_STYLE = `
  padding: 12px 16px;
  background: var(--ic-panel, #1a1d1f);
  border-bottom: 1px solid var(--ic-border, #2b3136);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const PANEL_CONTENT_STYLE = `
  flex: 1;
  overflow: auto;
  padding: 16px;
`;

export function renderDashboard(root: HTMLElement): void {
  const renderLoading = () => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(getSafeMode());
    const { shell, content } = createPageShell({
      title: "Dashboard",
      subtitle: "Vue exécutive de la santé du Control Plane",
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
    for (let i = 0; i < 4; i += 1) {
      grid.appendChild(createCardSkeleton());
    }
    content.appendChild(grid);

    const { card: eventsCard, body: eventsBody } = createSectionCard({
      title: "Événements récents",
      description: "Derniers événements système (audit / logs) — lecture seule"
    });
    eventsBody.appendChild(createCardSkeleton());
    content.appendChild(eventsCard);

    root.appendChild(shell);
  };

  const renderData = (data: DashboardData, errors: { metrics?: string; events?: string }) => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(getSafeMode());
    const { shell, content } = createPageShell({
      title: "Dashboard",
      subtitle: "Vue exécutive de la santé du Control Plane",
      safeMode: safeModeValue,
      statusBadge: {
        label: data.status,
        tone: data.status === "OPERATIONNEL" ? "ok" : data.status === "DEGRADE" ? "warn" : "err"
      }
    });

    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      width: 100%;
    `;

    const latencyTone = toneFromThresholds(data.kpi.latencyMs, { warn: 250, err: 800 });
    const cpuTone = toneFromThresholds(data.kpi.cpuPct, { warn: 85, err: 95 });
    const memTone = toneFromThresholds(data.kpi.memPct, { warn: 85, err: 95 });

    const { card: healthCard, body: healthBody } = createSectionCard({
      title: "Santé système",
      description: "CPU, mémoire, latence p95 et état local"
    });
    if (errors.metrics) {
      healthBody.appendChild(createErrorState({
        code: "ERR_METRICS_FETCH",
        message: errors.metrics
      }));
    }
    healthBody.appendChild(createKpiRow("CPU", `${data.kpi.cpuPct}%`, cpuTone));
    healthBody.appendChild(createKpiRow("Mémoire", `${data.kpi.memPct}%`, memTone));
    healthBody.appendChild(createKpiRow("Latence p95", `${data.kpi.latencyMs} ms`, latencyTone));
    healthBody.appendChild(createKpiRow("État local", latencyTone === "err" ? "ERR" : latencyTone === "warn" ? "WARN" : "OK", latencyTone));
    healthBody.appendChild(createLastUpdatedRow(data.lastUpdated));
    grid.appendChild(healthCard);

    const { card: activityCard, body: activityBody } = createSectionCard({
      title: "Activité",
      description: "Requêtes API, jobs et utilisateurs actifs"
    });
    if (errors.metrics) {
      activityBody.appendChild(createErrorState({
        code: "ERR_ACTIVITY_FETCH",
        message: errors.metrics
      }));
    }
    activityBody.appendChild(createKpiRow("Requêtes API (24h)", formatNumber(data.kpi.api24h)));
    activityBody.appendChild(createKpiRow("Jobs (24h)", formatNumber(data.kpi.jobs24h)));
    activityBody.appendChild(createKpiRow("Utilisateurs actifs (24h)", formatNumber(data.kpi.activeUsers)));
    if (data.kpi.peak24h !== undefined) {
      activityBody.appendChild(createKpiRow("Pic (24h)", formatNumber(data.kpi.peak24h)));
    }
    activityBody.appendChild(createLastUpdatedRow(data.lastUpdated));
    grid.appendChild(activityCard);

    const { card: errorsCard, body: errorsBody } = createSectionCard({
      title: "Erreurs",
      description: "Alertes et erreurs des dernières 24 heures",
      actions: [
        {
          label: "Voir logs",
          onClick: () => { window.location.hash = "#/logs"; }
        }
      ]
    });
    if (errors.metrics) {
      errorsBody.appendChild(createErrorState({
        code: "ERR_LOGS_AGG",
        message: errors.metrics
      }));
    }
    errorsBody.appendChild(createKpiRow("WARN (24h)", formatNumber(data.kpi.warn24h), data.kpi.warn24h > 0 ? "warn" : "ok"));
    errorsBody.appendChild(createKpiRow("ERR (24h)", formatNumber(data.kpi.err24h), data.kpi.err24h > 0 ? "err" : "ok"));
    errorsBody.appendChild(createKpiRow("Top module", data.kpi.topModule || "N/A"));
    errorsBody.appendChild(createLastUpdatedRow(data.lastUpdated));
    grid.appendChild(errorsCard);

    const { card: modulesCard, body: modulesBody } = createSectionCard({
      title: "Modules",
      description: "État des modules et impact SAFE_MODE",
      actions: [
        {
          label: "Gérer modules",
          onClick: () => { window.location.hash = "#/subscription"; }
        }
      ]
    });
    if (errors.metrics) {
      modulesBody.appendChild(createErrorState({
        code: "ERR_MODULES_FETCH",
        message: errors.metrics
      }));
    }
    modulesBody.appendChild(createKpiRow("Actifs", formatNumber(data.kpi.modulesActive), data.kpi.modulesActive > 0 ? "ok" : "warn"));
    modulesBody.appendChild(createKpiRow("Inactifs", formatNumber(data.kpi.modulesInactive), data.kpi.modulesInactive > 0 ? "warn" : "ok"));
    modulesBody.appendChild(createKpiRow("SAFE_MODE impact", safeModeValue === "STRICT" ? "Routage auto limité" : safeModeValue === "COMPAT" ? "Compatibilité priorisée" : "Mode normal"));
    modulesBody.appendChild(createLastUpdatedRow(data.lastUpdated));
    grid.appendChild(modulesCard);

    content.appendChild(grid);

    const { card: eventsCard, body: eventsBody } = createSectionCard({
      title: "Événements récents",
      description: "Derniers événements système (audit / logs) — lecture seule",
      actions: [
        {
          label: "Rafraîchir",
          onClick: () => { renderDashboard(root); }
        }
      ]
    });
    if (errors.events) {
      eventsBody.appendChild(createErrorState({
        code: "ERR_EVENTS_FETCH",
        message: errors.events
      }));
    }
    eventsBody.appendChild(createEventsTable(data.recentEvents));
    content.appendChild(eventsCard);

    root.appendChild(shell);
  };

  renderLoading();
  getDashboardData()
    .then(({ data, errors }) => {
      renderData(data, errors);
    })
    .catch((error) => {
      const fallback = buildDemoDashboardData();
      renderData(fallback, { metrics: String(error) });
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

function createLastUpdatedRow(value: string): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "margin-top: 6px; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  row.textContent = `Dernière mise à jour: ${new Date(value).toLocaleString("fr-CA")}`;
  return row;
}

function toneFromThresholds(value: number, thresholds: { warn: number; err: number }): "ok" | "warn" | "err" {
  if (value >= thresholds.err) return "err";
  if (value >= thresholds.warn) return "warn";
  return "ok";
}

function buildDemoDashboardData(): DashboardData {
  return {
    kpi: {
      cpuPct: 32,
      memPct: 58,
      latencyMs: 180,
      api24h: 12840,
      jobs24h: 412,
      activeUsers: 68,
      warn24h: 4,
      err24h: 1,
      modulesActive: 14,
      modulesInactive: 2,
      topModule: "registry",
      peak24h: 320
    },
    status: "OPERATIONNEL",
    lastUpdated: new Date().toISOString(),
    recentEvents: [
      { time: new Date(Date.now() - 1000 * 60 * 6).toISOString(), type: "DEMO", label: "DEMO: Provisioning des métriques initiales", tone: "neutral" },
      { time: new Date(Date.now() - 1000 * 60 * 24).toISOString(), type: "DEMO", label: "DEMO: Synchronisation des modules terminée", tone: "neutral" },
      { time: new Date(Date.now() - 1000 * 60 * 47).toISOString(), type: "DEMO", label: "DEMO: Audit startup validé", tone: "neutral" }
    ]
  };
}

async function fetchJsonSafe<T = any>(url: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: String(error) };
  }
}

async function getDashboardData(): Promise<{ data: DashboardData; errors: { metrics?: string; events?: string } }> {
  const demo = buildDemoDashboardData();
  const errors: { metrics?: string; events?: string } = {};

  const metricsRes = await fetchJsonSafe<any>("/api/cp/metrics");
  let kpi = demo.kpi;
  if (metricsRes.ok && metricsRes.data) {
    const raw = metricsRes.data;
    kpi = {
      cpuPct: Number(raw.cpuPct ?? raw.cpu ?? demo.kpi.cpuPct),
      memPct: Number(raw.memPct ?? raw.memoryPct ?? demo.kpi.memPct),
      latencyMs: Number(raw.latencyMs ?? raw.latency ?? demo.kpi.latencyMs),
      api24h: Number(raw.api24h ?? raw.apiRequests24h ?? demo.kpi.api24h),
      jobs24h: Number(raw.jobs24h ?? demo.kpi.jobs24h),
      activeUsers: Number(raw.activeUsers ?? demo.kpi.activeUsers),
      warn24h: Number(raw.warn24h ?? demo.kpi.warn24h),
      err24h: Number(raw.err24h ?? demo.kpi.err24h),
      modulesActive: Number(raw.modulesActive ?? demo.kpi.modulesActive),
      modulesInactive: Number(raw.modulesInactive ?? demo.kpi.modulesInactive),
      topModule: raw.topModule ?? demo.kpi.topModule,
      peak24h: Number(raw.peak24h ?? demo.kpi.peak24h)
    };
  } else {
    errors.metrics = metricsRes.error || "Impossible de charger /api/cp/metrics";
  }

  const auditRes = await fetchJsonSafe<any>("/api/cp/audit?limit=10");
  const logsRes = await fetchJsonSafe<any>("/api/cp/logs?limit=10");
  let recentEvents: DashboardEvent[] = [];

  if (auditRes.ok && Array.isArray(auditRes.data)) {
    recentEvents = recentEvents.concat(auditRes.data.map((item: any) => ({
      time: String(item.ts || item.time || item.timestamp || new Date().toISOString()),
      type: "AUDIT",
      label: String(item.label || item.message || item.code || "Audit"),
      tone: "info",
      correlationId: item.correlationId || item.correlation_id
    })));
  }

  if (logsRes.ok && Array.isArray(logsRes.data)) {
    recentEvents = recentEvents.concat(logsRes.data.map((item: any) => ({
      time: String(item.ts || item.time || item.timestamp || new Date().toISOString()),
      type: "LOG",
      label: String(item.label || item.message || item.code || "Log"),
      tone: item.level === "ERR" ? "err" : item.level === "WARN" ? "warn" : "neutral",
      correlationId: item.correlationId || item.correlation_id
    })));
  }

  if (!auditRes.ok && !logsRes.ok) {
    errors.events = "Aucun flux audit/log disponible — fallback démo activé";
  }

  if (recentEvents.length === 0) {
    recentEvents = demo.recentEvents;
  }

  const status = computeStatus(kpi);
  return {
    data: {
      kpi,
      status,
      lastUpdated: new Date().toISOString(),
      recentEvents: recentEvents.slice(0, 10)
    },
    errors
  };
}

function computeStatus(kpi: DashboardData["kpi"]): DashboardStatus {
  if (kpi.err24h > 0 || kpi.latencyMs > 800 || kpi.cpuPct > 95 || kpi.memPct > 95) {
    return "INCIDENT";
  }
  if (kpi.warn24h > 0 || kpi.latencyMs > 250 || kpi.cpuPct > 85 || kpi.memPct > 85) {
    return "DEGRADE";
  }
  return "OPERATIONNEL";
}

function createEventsTable(events: DashboardEvent[]): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; flex-direction:column; gap:10px;";

  if (!events || events.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "padding: 16px; color: var(--ic-mutedText, #a7b0b7); font-size: 13px;";
    empty.textContent = "Aucun événement pour cette période. Rafraîchissez dans quelques minutes.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  events.forEach((event) => {
    const row = document.createElement("div");
    row.style.cssText = `
      display: grid;
      grid-template-columns: 140px 90px 1fr 160px;
      gap: 12px;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 8px;
      background: rgba(255,255,255,0.02);
      font-size: 12px;
    `;
    const time = document.createElement("div");
    time.textContent = new Date(event.time).toLocaleTimeString("fr-CA");
    time.style.cssText = "color: var(--ic-mutedText, #a7b0b7);";

    const typeBadge = createBadge(event.type, event.tone);

    const label = document.createElement("div");
    label.textContent = event.label;
    label.style.cssText = "color: var(--ic-text, #e7ecef);";

    const correlation = document.createElement("div");
    correlation.style.cssText = "font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; color: var(--ic-mutedText, #a7b0b7);";
    correlation.textContent = event.correlationId ? event.correlationId : "—";

    row.appendChild(time);
    row.appendChild(typeBadge);
    row.appendChild(label);
    row.appendChild(correlation);
    wrapper.appendChild(row);
  });

  return wrapper;
}

function createApiTestingPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.style.cssText = PANEL_STYLE;

  // Header
  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = "display: flex; flex-direction: column; gap: 2px; flex: 1;";
  const title = document.createElement("div");
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  title.textContent = "API Testing";
  titleDiv.appendChild(title);
  header.appendChild(titleDiv);
  
  // Boutons d'action dans le header
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 8px; align-items: center;";
  
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "🔄";
  refreshBtn.title = "Actualiser";
  refreshBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  refreshBtn.onmouseenter = () => { refreshBtn.style.background = "rgba(255,255,255,0.05)"; refreshBtn.style.transform = "rotate(180deg)"; };
  refreshBtn.onmouseleave = () => { refreshBtn.style.background = "transparent"; refreshBtn.style.transform = "rotate(0deg)"; };
  refreshBtn.onclick = () => {
    const event = new CustomEvent("refresh-panel", { detail: { panel: "api-testing" } });
    window.dispatchEvent(event);
  };
  actionsDiv.appendChild(refreshBtn);
  
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = "📥";
  exportBtn.title = "Exporter";
  exportBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  exportBtn.onmouseenter = () => { exportBtn.style.background = "rgba(255,255,255,0.05)"; };
  exportBtn.onmouseleave = () => { exportBtn.style.background = "transparent"; };
  exportBtn.onclick = () => {
    const data = { panel: "api-testing", timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-testing-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  actionsDiv.appendChild(exportBtn);
  
  header.appendChild(actionsDiv);
  panel.appendChild(header);

  // Content
  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  // Request input
  const requestRow = document.createElement("div");
  requestRow.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px; align-items: center;";
  
  const methodSelect = document.createElement("select");
  methodSelect.style.cssText = "padding: 8px 12px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; cursor: pointer;";
  ["GET", "POST", "PUT", "DELETE", "PATCH"].forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if (m === "GET") opt.selected = true;
    methodSelect.appendChild(opt);
  });
  requestRow.appendChild(methodSelect);

  const endpointInput = document.createElement("input");
  endpointInput.type = "text";
  endpointInput.value = "/api/resources";
  endpointInput.style.cssText = "flex: 1; padding: 8px 12px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px;";
  requestRow.appendChild(endpointInput);

  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.style.cssText = "padding: 8px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.2s;";
  sendBtn.onmouseenter = () => sendBtn.style.cssText = "padding: 8px 20px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); transition: all 0.2s;";
  sendBtn.onmouseleave = () => sendBtn.style.cssText = "padding: 8px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.2s;";
  sendBtn.onclick = () => {
    const mockMode = (document.getElementById("mock-mode-toggle") as HTMLInputElement)?.checked || false;
    handleApiRequest(methodSelect.value, endpointInput.value, responseDiv, statusDiv, mockMode);
  };
  requestRow.appendChild(sendBtn);

  content.appendChild(requestRow);

  // Tabs
  const tabs = document.createElement("div");
  tabs.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--ic-border, #2b3136);";
  ["Headers", "Body", "Run"].forEach(tabName => {
    const tab = document.createElement("button");
    tab.textContent = tabName;
    tab.style.cssText = `padding: 8px 16px; background: transparent; border: none; color: var(--ic-mutedText, #a7b0b7); cursor: pointer; border-bottom: 2px solid ${tabName === "Headers" ? "#3b82f6" : "transparent"}; transition: all 0.2s;`;
    tabs.appendChild(tab);
  });
  content.appendChild(tabs);

  // Status avec Correlation ID
  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 4px;";
  statusDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: #34d399;">✓</span>
      <span style="color: var(--ic-text, #e7ecef); font-size: 12px;">Status 200 OK 66µs</span>
    </div>
    <div id="correlation-id-display" style="display: none; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">
      Correlation ID: <span id="correlation-id-value" style="font-family: monospace; color: #3b82f6; cursor: pointer; text-decoration: underline;" title="Cliquer pour filtrer les logs">-</span>
    </div>
  `;
  content.appendChild(statusDiv);

  // Response
  const responseDiv = document.createElement("div");
  responseDiv.style.cssText = "background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); border-radius: 4px; padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; color: var(--ic-text, #e7ecef); white-space: pre-wrap; max-height: 200px; overflow: auto;";
  responseDiv.textContent = JSON.stringify({ status: 200, data: "Response data here..." }, null, 2);
  content.appendChild(responseDiv);

  // Mock mode toggle
  const mockToggleContainer = document.createElement("div");
  mockToggleContainer.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px;";
  const mockToggleLabel = document.createElement("label");
  mockToggleLabel.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--ic-text, #e7ecef);";
  const mockToggleInput = document.createElement("input");
  mockToggleInput.type = "checkbox";
  mockToggleInput.id = "mock-mode-toggle";
  mockToggleInput.style.cssText = "cursor: pointer;";
  const mockToggleSpan = document.createElement("span");
  mockToggleSpan.textContent = "Mock mode (réponse simulée)";
  mockToggleLabel.appendChild(mockToggleInput);
  mockToggleLabel.appendChild(mockToggleSpan);
  mockToggleContainer.appendChild(mockToggleLabel);
  content.appendChild(mockToggleContainer);

  // Response actions
  const responseActions = document.createElement("div");
  responseActions.style.cssText = "display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;";
  ["Format JSON", "Highlight", "Copy"].forEach(action => {
    const btn = document.createElement("button");
    btn.textContent = action;
    btn.style.cssText = "padding: 4px 12px; background: transparent; border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; cursor: pointer; font-size: 11px;";
    if (action === "Copy") {
      btn.onclick = () => {
        navigator.clipboard.writeText(responseDiv.textContent || "");
        btn.textContent = "✓ Copié";
        setTimeout(() => { btn.textContent = "Copy"; }, 2000);
      };
    }
    if (action === "Format JSON") {
      btn.onclick = () => {
        try {
          const parsed = JSON.parse(responseDiv.textContent || "{}");
          responseDiv.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // Ignore si pas JSON valide
        }
      };
    }
    responseActions.appendChild(btn);
  });
  content.appendChild(responseActions);
  
  // Section Diff schéma (masquée par défaut)
  const diffSchemaContainer = document.createElement("div");
  diffSchemaContainer.id = "diff-schema-container";
  diffSchemaContainer.style.cssText = "display: none; margin-top: 12px; padding: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 4px;";
  diffSchemaContainer.innerHTML = `
    <div style="font-size: 12px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;">
      ⚠ Différences avec le schéma attendu
    </div>
    <div id="diff-schema-details" style="font-size: 11px; color: var(--ic-text, #e7ecef); font-family: monospace;">
      À venir
    </div>
  `;
  content.appendChild(diffSchemaContainer);

  // Graphique de temps de réponse (mini sparkline) - Version professionnelle améliorée
  const responseTimeChart = document.createElement("div");
  responseTimeChart.style.cssText = `
    margin-top: 12px; 
    padding: 12px; 
    background: linear-gradient(135deg, var(--ic-panel, #1a1d1f) 0%, #1e2225 100%); 
    border: 1px solid var(--ic-border, #2b3136); 
    border-radius: 6px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  `;
  
  const chartTitle = document.createElement("div");
  chartTitle.textContent = "Response Time Trend";
  chartTitle.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;";
  responseTimeChart.appendChild(chartTitle);
  
  const sparklineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  sparklineSvg.setAttribute("width", "100%");
  sparklineSvg.setAttribute("height", "50");
  sparklineSvg.setAttribute("viewBox", "0 0 220 50");
  sparklineSvg.style.cssText = "display: block;";
  
  // Zone remplie sous la sparkline
  const sparkDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const sparkGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  sparkGradient.setAttribute("id", "sparkGradient");
  sparkGradient.setAttribute("x1", "0%");
  sparkGradient.setAttribute("y1", "0%");
  sparkGradient.setAttribute("x2", "0%");
  sparkGradient.setAttribute("y2", "100%");
  
  const sparkStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  sparkStop1.setAttribute("offset", "0%");
  sparkStop1.setAttribute("stop-color", "#3b82f6");
  sparkStop1.setAttribute("stop-opacity", "0.3");
  sparkGradient.appendChild(sparkStop1);
  
  const sparkStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  sparkStop2.setAttribute("offset", "100%");
  sparkStop2.setAttribute("stop-color", "#3b82f6");
  sparkStop2.setAttribute("stop-opacity", "0.05");
  sparkGradient.appendChild(sparkStop2);
  
  sparkDefs.appendChild(sparkGradient);
  sparklineSvg.appendChild(sparkDefs);
  
  const responseTimes = [66, 72, 68, 85, 78, 92, 80, 75, 70, 88, 82, 76, 74, 79, 84, 77];
  const sparkPoints: string[] = [];
  const sparkStepX = 200 / (responseTimes.length - 1);
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const range = maxTime - minTime || 1;
  
  responseTimes.forEach((time, index) => {
    const x = 10 + (index * sparkStepX);
    const normalizedY = 35 - ((time - minTime) / range) * 25;
    sparkPoints.push(`${x},${normalizedY}`);
  });
  
  // Zone remplie
  const sparkAreaPath = `M 10,35 L ${sparkPoints.join(" L ")} L ${10 + (responseTimes.length - 1) * sparkStepX},35 Z`;
  const sparkArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  sparkArea.setAttribute("d", sparkAreaPath);
  sparkArea.setAttribute("fill", "url(#sparkGradient)");
  sparklineSvg.appendChild(sparkArea);
  
  const sparkLinePath = `M ${sparkPoints.join(" L ")}`;
  const sparkLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
  sparkLine.setAttribute("d", sparkLinePath);
  sparkLine.setAttribute("fill", "none");
  sparkLine.setAttribute("stroke", "#3b82f6");
  sparkLine.setAttribute("stroke-width", "2");
  sparkLine.setAttribute("stroke-linecap", "round");
  sparkLine.setAttribute("stroke-linejoin", "round");
  sparklineSvg.appendChild(sparkLine);
  
  // Points sur la sparkline avec effet hover
  responseTimes.forEach((time, index) => {
    const x = 10 + (index * sparkStepX);
    const normalizedY = 35 - ((time - minTime) / range) * 25;
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(normalizedY));
    circle.setAttribute("r", "2");
    circle.setAttribute("fill", "#3b82f6");
    circle.setAttribute("stroke", "#1a1d1f");
    circle.setAttribute("stroke-width", "1.5");
    circle.style.cssText = "transition: r 0.2s; cursor: pointer;";
    
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${time}µs`;
    circle.appendChild(title);
    
    sparklineSvg.appendChild(circle);
  });
  
  responseTimeChart.appendChild(sparklineSvg);
  
  const stats = document.createElement("div");
  stats.style.cssText = "display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ic-border, #2b3136); font-size: 10px;";
  const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  stats.innerHTML = `
    <span style="color: #3b82f6; font-weight: 600;">Avg: ${avgTime}µs</span>
    <span style="color: #34d399; font-weight: 600;">Min: ${minTime}µs</span>
    <span style="color: #f87171; font-weight: 600;">Max: ${maxTime}µs</span>
  `;
  responseTimeChart.appendChild(stats);
  
  content.appendChild(responseTimeChart);

  // Historique des requêtes (Replay/Clone)
  const historyCard = document.createElement("div");
  historyCard.style.cssText = `
    margin-top: 16px;
    padding: 12px;
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
  `;
  
  const historyTitle = document.createElement("div");
  historyTitle.textContent = "Historique des requêtes";
  historyTitle.style.cssText = "font-size: 12px; font-weight: 600; color: var(--ic-text, #e7ecef); margin-bottom: 12px;";
  historyCard.appendChild(historyTitle);
  
  const historyList = document.createElement("div");
  historyList.id = "api-history-list";
  historyList.style.cssText = "display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;";
  
  function renderHistory(): void {
    const history = getApiHistory();
    historyList.innerHTML = "";
    
    if (history.length === 0) {
      historyList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--ic-mutedText,#a7b0b7);font-size:11px;">Aucune requête dans l\'historique</div>';
      return;
    }
    
    history.slice().reverse().slice(0, 5).forEach(req => {
      const item = document.createElement("div");
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: rgba(255,255,255,0.02);
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      `;
      
      const left = document.createElement("div");
      left.style.cssText = "display: flex; flex-direction: column; gap: 2px; flex: 1;";
      left.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; font-weight: 600; color: #3b82f6;">${req.method}</span>
          <span style="font-size: 11px; color: var(--ic-text, #e7ecef); font-family: monospace;">${req.endpoint}</span>
        </div>
        <div style="font-size: 10px; color: var(--ic-mutedText, #a7b0b7);">
          ${new Date(req.timestamp).toLocaleString('fr-FR')} • ${req.responseTime}µs • Status ${req.status}
        </div>
      `;
      
      const actions = document.createElement("div");
      actions.style.cssText = "display: flex; gap: 6px;";
      
      const replayBtn = document.createElement("button");
      replayBtn.textContent = "Replay";
      replayBtn.style.cssText = "padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600;";
      replayBtn.onclick = (e) => {
        e.stopPropagation();
        methodSelect.value = req.method;
        endpointInput.value = req.endpoint;
        const mockMode = (document.getElementById("mock-mode-toggle") as HTMLInputElement)?.checked || false;
        handleApiRequest(req.method, req.endpoint, responseDiv, statusDiv, mockMode);
      };
      
      const cloneBtn = document.createElement("button");
      cloneBtn.textContent = "Clone";
      cloneBtn.style.cssText = "padding: 4px 10px; background: rgba(255,255,255,0.05); color: var(--ic-text, #e7ecef); border: 1px solid var(--ic-border, #2b3136); border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600;";
      cloneBtn.onclick = (e) => {
        e.stopPropagation();
        methodSelect.value = req.method;
        endpointInput.value = req.endpoint;
        showToast(`Requête ${req.method} ${req.endpoint} clonée. Cliquez sur "Send" pour l'envoyer.`, "info");
      };
      
      actions.appendChild(replayBtn);
      actions.appendChild(cloneBtn);
      
      item.appendChild(left);
      item.appendChild(actions);
      historyList.appendChild(item);
    });
  }
  
  renderHistory();
  historyCard.appendChild(historyList);
  content.appendChild(historyCard);

  panel.appendChild(content);
  return panel;
}

// Type pour une requête historique
type ApiRequestHistory = {
  id: string;
  method: string;
  endpoint: string;
  timestamp: number;
  responseTime: number;
  status: number;
  correlationId: string;
  response?: any;
};

const API_HISTORY_KEY = "icontrol_api_history_v1";
const MAX_HISTORY = 20;

function getApiHistory(): ApiRequestHistory[] {
  try {
    const stored = localStorage.getItem(API_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.slice(-MAX_HISTORY);
    }
  } catch {}
  return [];
}

function saveApiRequestToHistory(request: ApiRequestHistory): void {
  try {
    const history = getApiHistory();
    history.push(request);
    const trimmed = history.slice(-MAX_HISTORY);
    localStorage.setItem(API_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde de l'historique API:", e);
  }
}

// Générer Correlation ID
function generateCorrelationId(): string {
  const t = Date.now().toString(16);
  const r = Math.random().toString(16).slice(2);
  return `req_${t}_${r}`;
}

function showToast(message: string, type: "success" | "error" | "warning" | "info" = "info"): void {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === "success" ? "rgba(78,201,176,0.15)" : type === "error" ? "rgba(244,135,113,0.15)" : type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)"};
    border: 1px solid ${type === "success" ? "#4ec9b0" : type === "error" ? "#f48771" : type === "warning" ? "#f59e0b" : "#3b82f6"};
    border-radius: 6px;
    color: ${type === "success" ? "#4ec9b0" : type === "error" ? "#f48771" : type === "warning" ? "#f59e0b" : "#3b82f6"};
    font-size: 12px;
    font-weight: 600;
    z-index: 10001;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function handleApiRequest(method: string, endpoint: string, responseDiv: HTMLElement, statusDiv: HTMLElement, mockMode: boolean = false): void {
  const startTime = performance.now();
  const correlationId = generateCorrelationId();
  
  statusDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: #3b82f6;">⏳</span>
      <span style="color: var(--ic-text, #e7ecef); font-size: 12px;">Loading...</span>
    </div>
    <div id="correlation-id-display" style="font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">
      Correlation ID: <span id="correlation-id-value" style="font-family: monospace; color: #3b82f6; cursor: pointer; text-decoration: underline;" title="Cliquer pour filtrer les logs">${correlationId}</span>
    </div>
  `;
  
  // Ajouter événement click sur correlation ID
  const correlationIdSpan = statusDiv.querySelector("#correlation-id-value") as HTMLElement;
  if (correlationIdSpan) {
    correlationIdSpan.onclick = () => {
      window.location.hash = `#/logs?filter=${encodeURIComponent(correlationId)}`;
    };
  }
  
  // Simuler une requête API (mock ou réel)
  setTimeout(() => {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const mockResponse = {
      status: 200,
      correlationId,
      data: {
        resources: ["resource1", "resource2", "resource3"],
        timestamp: new Date().toISOString()
      }
    };
    
    responseDiv.textContent = JSON.stringify(mockResponse, null, 2);
    
    const statusColor = mockResponse.status >= 200 && mockResponse.status < 300 ? "#34d399" : "#f48771";
    const statusIcon = mockResponse.status >= 200 && mockResponse.status < 300 ? "✓" : "✗";
    
    statusDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: ${statusColor};">${statusIcon}</span>
        <span style="color: var(--ic-text, #e7ecef); font-size: 12px;">Status ${mockResponse.status} OK ${responseTime}µs</span>
      </div>
      <div id="correlation-id-display" style="font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">
        Correlation ID: <span id="correlation-id-value" style="font-family: monospace; color: #3b82f6; cursor: pointer; text-decoration: underline;" title="Cliquer pour filtrer les logs">${correlationId}</span>
      </div>
    `;
    
    // Réattacher événement click sur correlation ID
    const newCorrelationIdSpan = statusDiv.querySelector("#correlation-id-value") as HTMLElement;
    if (newCorrelationIdSpan) {
      newCorrelationIdSpan.onclick = () => {
        window.location.hash = `#/logs?filter=${encodeURIComponent(correlationId)}`;
      };
    }
    
    // Sauvegarder dans l'historique
    saveApiRequestToHistory({
      id: `req-${Date.now()}`,
      method,
      endpoint,
      timestamp: Date.now(),
      responseTime,
      status: mockResponse.status,
      correlationId,
      response: mockResponse
    });
    
    // Rafraîchir l'historique affiché si la fonction existe
    const historyList = document.getElementById("api-history-list");
    if (historyList && typeof renderHistory === "function") {
      renderHistory();
    }
  }, mockMode ? 0 : 300);
}

function createLogsPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.style.cssText = PANEL_STYLE;

  // Header
  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = "display: flex; align-items: center; gap: 8px; flex: 1;";
  const title = document.createElement("div");
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  title.textContent = "Logs";
  titleDiv.appendChild(title);
  
  const safeModeTag = document.createElement("div");
  safeModeTag.style.cssText = "padding: 4px 8px; background: rgba(220, 220, 170, 0.2); color: #dcdcaa; border-radius: 4px; font-size: 11px; font-weight: 600;";
  safeModeTag.textContent = "SAFE_MODE";
  titleDiv.appendChild(safeModeTag);
  header.appendChild(titleDiv);
  
  // Boutons d'action
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 8px; align-items: center;";
  
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "🔄";
  refreshBtn.title = "Actualiser";
  refreshBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  refreshBtn.onmouseenter = () => { refreshBtn.style.background = "rgba(255,255,255,0.05)"; refreshBtn.style.transform = "rotate(180deg)"; };
  refreshBtn.onmouseleave = () => { refreshBtn.style.background = "transparent"; refreshBtn.style.transform = "rotate(0deg)"; };
  actionsDiv.appendChild(refreshBtn);
  
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = "📥";
  exportBtn.title = "Exporter";
  exportBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  exportBtn.onmouseenter = () => { exportBtn.style.background = "rgba(255,255,255,0.05)"; };
  exportBtn.onmouseleave = () => { exportBtn.style.background = "transparent"; };
  actionsDiv.appendChild(exportBtn);
  
  header.appendChild(actionsDiv);
  panel.appendChild(header);

  // Content
  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  // Filters
  const filters = document.createElement("div");
  filters.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;";
  
  const moduleSelect = document.createElement("select");
  moduleSelect.style.cssText = "padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px;";
  ["Module", "CORE_SYSTEM", "SCAN_MANAGER"].forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if (m === "Module") opt.selected = true;
    moduleSelect.appendChild(opt);
  });
  filters.appendChild(moduleSelect);

  const severitySelect = document.createElement("select");
  severitySelect.style.cssText = "padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px;";
  ["Severity", "INFO", "WARN", "ERR"].forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === "Severity") opt.selected = true;
    severitySelect.appendChild(opt);
  });
  filters.appendChild(severitySelect);

  const timeDiv = document.createElement("div");
  timeDiv.style.cssText = "padding: 6px 10px; color: var(--ic-mutedText, #a7b0b7); font-size: 11px; display: flex; align-items: center;";
  timeDiv.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  filters.appendChild(timeDiv);

  content.appendChild(filters);

  // Graphique de distribution des logs (bar chart) - Version professionnelle améliorée
  const logChartContainer = document.createElement("div");
  logChartContainer.style.cssText = `
    height: 100px; 
    background: linear-gradient(135deg, var(--ic-panel, #1a1d1f) 0%, #1e2225 100%); 
    border: 1px solid var(--ic-border, #2b3136); 
    border-radius: 6px; 
    margin-bottom: 12px; 
    padding: 12px; 
    display: flex; 
    align-items: flex-end; 
    justify-content: space-around; 
    gap: 12px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  `;
  
  const logDistribution = [
    { label: "INFO", value: 75, color: "#34d399", gradient: "linear-gradient(180deg, #34d399 0%, #10b981 100%)" },
    { label: "WARN", value: 45, color: "#fbbf24", gradient: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)" },
    { label: "ERR", value: 15, color: "#f87171", gradient: "linear-gradient(180deg, #f87171 0%, #ef4444 100%)" }
  ];
  
  logDistribution.forEach(item => {
    const barWrapper = document.createElement("div");
    barWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative;";
    
    // Barre avec gradient et ombre
    const barContainer = document.createElement("div");
    barContainer.style.cssText = "width: 100%; position: relative; display: flex; flex-direction: column; align-items: center;";
    
    const bar = document.createElement("div");
    bar.style.cssText = `
      width: 100%; 
      height: ${item.value}px; 
      background: ${item.gradient}; 
      border-radius: 4px 4px 0 0; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    `;
    
    // Effet de brillance sur la barre
    const shine = document.createElement("div");
    shine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
      border-radius: 4px 4px 0 0;
    `;
    bar.appendChild(shine);
    
    bar.onmouseenter = () => {
      bar.style.transform = "scaleY(1.05)";
      bar.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.1)";
    };
    bar.onmouseleave = () => {
      bar.style.transform = "scaleY(1)";
      bar.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.1)";
    };
    
    barContainer.appendChild(bar);
    
    // Valeur au-dessus de la barre
    const valueLabel = document.createElement("div");
    valueLabel.textContent = String(item.value);
    valueLabel.style.cssText = `
      font-size: 11px; 
      color: ${item.color}; 
      font-weight: 700; 
      margin-top: 4px;
      opacity: 0;
      transition: opacity 0.3s;
      position: absolute;
      top: -20px;
    `;
    bar.onmouseenter = () => {
      bar.style.transform = "scaleY(1.05)";
      bar.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.1)";
      valueLabel.style.opacity = "1";
    };
    bar.onmouseleave = () => {
      bar.style.transform = "scaleY(1)";
      bar.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.1)";
      valueLabel.style.opacity = "0";
    };
    
    barContainer.appendChild(valueLabel);
    barWrapper.appendChild(barContainer);
    
    // Label en bas
    const label = document.createElement("div");
    label.textContent = item.label;
    label.style.cssText = `
      font-size: 10px; 
      color: var(--ic-mutedText, #a7b0b7); 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    barWrapper.appendChild(label);
    
    logChartContainer.appendChild(barWrapper);
  });
  
  content.appendChild(logChartContainer);

  // Section Erreurs fréquentes avec explications
  const frequentErrorsCard = document.createElement("div");
  frequentErrorsCard.style.cssText = "margin-bottom: 12px; padding: 12px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 6px;";
  
  const frequentErrorsTitle = document.createElement("div");
  frequentErrorsTitle.textContent = "⚠️ Erreurs fréquentes";
  frequentErrorsTitle.style.cssText = "font-size: 12px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;";
  frequentErrorsCard.appendChild(frequentErrorsTitle);
  
  // Analyser les logs pour trouver les erreurs fréquentes
  const auditLogs = readAuditLog().slice(-100);
  const errorCounts: Record<string, number> = {};
  auditLogs.forEach(log => {
    if (log.level === "WARN" || log.level === "ERR") {
      const code = log.code || "UNKNOWN";
      errorCounts[code] = (errorCounts[code] || 0) + 1;
    }
  });
  
  // Définitions des erreurs fréquentes avec explications et liens
  const errorDefinitions: Record<string, { description: string; link?: string; solution?: string }> = {
    "WARN_SAFE_MODE_WRITE_BLOCKED": { 
      description: "Tentative d'écriture bloquée en mode SAFE_MODE strict", 
      link: "#/system",
      solution: "Désactiver SAFE_MODE ou utiliser le mode COMPAT"
    },
    "ERR_RENDER_BLOCKED": { 
      description: "Rendu bloqué par une politique de sécurité", 
      link: "#/system",
      solution: "Vérifier les permissions RBAC et les flags système"
    },
    "WARN_REGISTRY_MISS": { 
      description: "Module manquant dans le registry", 
      link: "#/dashboard",
      solution: "Vérifier le registry viewer et réinitialiser le module"
    },
    "ERR_UNAUTHORIZED": { 
      description: "Accès non autorisé", 
      link: "#/users",
      solution: "Vérifier les rôles et permissions de l'utilisateur"
    },
    "ERR_FORBIDDEN": { 
      description: "Action interdite", 
      link: "#/system",
      solution: "Vérifier SAFE_MODE et les politiques de sécurité"
    }
  };
  
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topErrors.length > 0) {
    const errorsList = document.createElement("div");
    errorsList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
    
    topErrors.forEach(([code, count]) => {
      const errorDef = errorDefinitions[code];
      const errorItem = document.createElement("div");
      errorItem.style.cssText = "padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px; border-left: 3px solid #f59e0b;";
      
      const header = document.createElement("div");
      header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;";
      
      const codeLink = document.createElement("a");
      codeLink.href = errorDef?.link || "#";
      codeLink.textContent = code;
      codeLink.style.cssText = "color: #f59e0b; font-size: 11px; font-weight: 600; text-decoration: none; cursor: pointer;";
      codeLink.onclick = (e) => {
        e.preventDefault();
        if (errorDef?.link) {
          window.location.hash = errorDef.link;
        }
      };
      header.appendChild(codeLink);
      
      const countBadge = document.createElement("span");
      countBadge.textContent = `${count}x`;
      countBadge.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 10px; background: rgba(245,158,11,0.1); padding: 2px 6px; border-radius: 10px;";
      header.appendChild(countBadge);
      
      errorItem.appendChild(header);
      
      if (errorDef) {
        const desc = document.createElement("div");
        desc.textContent = errorDef.description;
        desc.style.cssText = "font-size: 11px; color: var(--ic-text, #e7ecef); margin-bottom: 4px;";
        errorItem.appendChild(desc);
        
        if (errorDef.solution) {
          const solution = document.createElement("div");
          solution.textContent = `💡 Solution: ${errorDef.solution}`;
          solution.style.cssText = "font-size: 10px; color: #34d399; font-style: italic;";
          errorItem.appendChild(solution);
        }
      }
      
      errorsList.appendChild(errorItem);
    });
    
    frequentErrorsCard.appendChild(errorsList);
  } else {
    const noErrors = document.createElement("div");
    noErrors.textContent = "Aucune erreur fréquente détectée";
    noErrors.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); font-style: italic;";
    frequentErrorsCard.appendChild(noErrors);
  }
  
  content.appendChild(frequentErrorsCard);

  // Log entries avec regroupement intelligent
  const logList = document.createElement("div");
  logList.style.cssText = "display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;";
  
  // Regrouper les logs par type/code
  const groupedLogs: Record<string, { logs: any[]; count: number }> = {};
  const recentLogs = auditLogs.slice(-10).reverse();
  
  recentLogs.forEach(log => {
    const groupKey = log.code || log.level || "OTHER";
    if (!groupedLogs[groupKey]) {
      groupedLogs[groupKey] = { logs: [], count: 0 };
    }
    groupedLogs[groupKey].logs.push(log);
    groupedLogs[groupKey].count++;
  });
  
  // Trier par fréquence et afficher
  Object.entries(groupedLogs).sort((a, b) => b[1].count - a[1].count).forEach(([groupKey, group]) => {
    const isGrouped = group.count > 1;
    
    if (isGrouped) {
      // Afficher un header de groupe
      const groupHeader = document.createElement("div");
      groupHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px; margin-bottom: 4px;";
      
      const groupLabel = document.createElement("span");
      groupLabel.textContent = groupKey;
      groupLabel.style.cssText = "color: #3b82f6; font-size: 11px; font-weight: 600;";
      groupHeader.appendChild(groupLabel);
      
      const groupCount = document.createElement("span");
      groupCount.textContent = `${group.count} occurrence(s)`;
      groupCount.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 10px;";
      groupHeader.appendChild(groupCount);
      
      logList.appendChild(groupHeader);
    }
    
    // Afficher les logs du groupe (limiter à 2 si groupé)
    const logsToShow = isGrouped ? group.logs.slice(0, 2) : group.logs;
    
    logsToShow.forEach(log => {
      const entry = document.createElement("div");
      entry.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px; ${isGrouped ? "margin-left: 12px;" : ""}`;
      
      const left = document.createElement("div");
      left.style.cssText = "display: flex; align-items: center; gap: 8px; flex: 1;";
      
      const icon = document.createElement("span");
      const levelColor = log.level === "ERR" ? "#f48771" : log.level === "WARN" ? "#fbbf24" : "#34d399";
      const levelIcon = log.level === "ERR" ? "✗" : log.level === "WARN" ? "⚠" : "✓";
      icon.textContent = levelIcon;
      icon.style.cssText = `color: ${levelColor}; font-size: 12px;`;
      left.appendChild(icon);
      
      const text = document.createElement("span");
      text.textContent = log.message || log.code || "Log entry";
      text.style.cssText = "color: var(--ic-text, #e7ecef); font-size: 12px;";
      left.appendChild(text);
      
      // Lien vers page/contrat si applicable
      if (log.code) {
        const errorDef = errorDefinitions[log.code];
        if (errorDef?.link) {
          const link = document.createElement("a");
          link.href = errorDef.link;
          link.textContent = "→";
          link.title = "Voir détails";
          link.style.cssText = "color: #3b82f6; font-size: 11px; text-decoration: none; margin-left: 8px; cursor: pointer;";
          link.onclick = (e) => {
            e.preventDefault();
            window.location.hash = errorDef.link!;
          };
          left.appendChild(link);
        }
      }
      
      entry.appendChild(left);

      const timestamp = document.createElement("div");
      if (log.ts) {
        const date = new Date(log.ts);
        timestamp.textContent = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      timestamp.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 10px;";
      entry.appendChild(timestamp);

      logList.appendChild(entry);
    });
    
    if (isGrouped && group.count > 2) {
      const moreLabel = document.createElement("div");
      moreLabel.textContent = `... ${group.count - 2} autre(s) occurrence(s)`;
      moreLabel.style.cssText = "padding: 4px 8px 4px 20px; color: var(--ic-mutedText, #a7b0b7); font-size: 10px; font-style: italic;";
      logList.appendChild(moreLabel);
    }
  });

  content.appendChild(logList);
  panel.appendChild(content);
  return panel;
}

function createNetworkActivityPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.style.cssText = PANEL_STYLE;

  // Header
  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = "display: flex; flex-direction: column; gap: 2px; flex: 1;";
  const title = document.createElement("div");
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  title.textContent = "Network Activity";
  const subtitle = document.createElement("div");
  subtitle.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  subtitle.textContent = "Latency performance monitoring.";
  titleDiv.appendChild(title);
  titleDiv.appendChild(subtitle);
  header.appendChild(titleDiv);
  
  // Boutons d'action
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 8px; align-items: center;";
  
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "🔄";
  refreshBtn.title = "Actualiser";
  refreshBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  refreshBtn.onmouseenter = () => { refreshBtn.style.background = "rgba(255,255,255,0.05)"; refreshBtn.style.transform = "rotate(180deg)"; };
  refreshBtn.onmouseleave = () => { refreshBtn.style.background = "transparent"; refreshBtn.style.transform = "rotate(0deg)"; };
  actionsDiv.appendChild(refreshBtn);
  
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = "📥";
  exportBtn.title = "Exporter en CSV";
  exportBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  exportBtn.onmouseenter = () => { exportBtn.style.background = "rgba(255,255,255,0.05)"; };
  exportBtn.onmouseleave = () => { exportBtn.style.background = "transparent"; };
  exportBtn.onclick = () => {
    // Générer les données CSV
    const networkRequests = [
      { name: "/api/rentonte", status: "XHR", duration: "-", user: "admin", action: "GET", timestamp: new Date().toISOString() },
      { name: "system/info", status: "200", duration: "180 ms", user: "developer", action: "GET", timestamp: new Date().toISOString() },
      { name: "/modules/init", status: "200", duration: "266 ms", user: "user1", action: "POST", timestamp: new Date().toISOString() }
    ];
    
    // Filtrer selon les sélecteurs
    const userFilter = (document.getElementById("network-user-filter") as HTMLSelectElement)?.value || "all";
    const actionFilter = (document.getElementById("network-action-filter") as HTMLSelectElement)?.value || "all";
    
    let filtered = networkRequests;
    if (userFilter !== "all") {
      filtered = filtered.filter(req => req.user === userFilter);
    }
    if (actionFilter !== "all") {
      filtered = filtered.filter(req => req.action === actionFilter);
    }
    
    // Générer le CSV
    const headers = ["Name", "Status", "Duration", "User", "Action", "Timestamp"];
    const rows = filtered.map(req => [req.name, req.status, req.duration, req.user, req.action, req.timestamp]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Télécharger le CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `network-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`${filtered.length} requête(s) exportée(s) en CSV`, "success");
  };
  actionsDiv.appendChild(exportBtn);
  
  header.appendChild(actionsDiv);
  panel.appendChild(header);

  // Content
  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  // Filtres améliorés
  const filtersContainer = document.createElement("div");
  filtersContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;";
  
  // Filtre par action utilisateur
  const userActionFilter = document.createElement("div");
  userActionFilter.style.cssText = "display: flex; gap: 8px; align-items: center; flex-wrap: wrap;";
  
  const userFilterLabel = document.createElement("label");
  userFilterLabel.textContent = "Filtrer par:";
  userFilterLabel.style.cssText = "font-size: 11px; color: var(--ic-text, #e7ecef); font-weight: 600;";
  userActionFilter.appendChild(userFilterLabel);
  
  const userSelect = document.createElement("select");
  userSelect.id = "network-user-filter";
  userSelect.style.cssText = "padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px; cursor: pointer;";
  ["Tous les utilisateurs", "admin", "developer", "user1", "user2"].forEach(user => {
    const opt = document.createElement("option");
    opt.value = user === "Tous les utilisateurs" ? "all" : user;
    opt.textContent = user;
    userSelect.appendChild(opt);
  });
  userActionFilter.appendChild(userSelect);
  
  const actionSelect = document.createElement("select");
  actionSelect.id = "network-action-filter";
  actionSelect.style.cssText = "padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px; cursor: pointer;";
  ["Toutes les actions", "GET", "POST", "PUT", "DELETE", "PATCH"].forEach(action => {
    const opt = document.createElement("option");
    opt.value = action === "Toutes les actions" ? "all" : action;
    opt.textContent = action;
    actionSelect.appendChild(opt);
  });
  userActionFilter.appendChild(actionSelect);
  
  filtersContainer.appendChild(userActionFilter);
  
  // Comparaison avant/après release
  const releaseComparison = document.createElement("div");
  releaseComparison.style.cssText = "display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 10px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px;";
  
  const comparisonLabel = document.createElement("label");
  comparisonLabel.textContent = "Comparer avec:";
  comparisonLabel.style.cssText = "font-size: 11px; color: var(--ic-text, #e7ecef); font-weight: 600;";
  releaseComparison.appendChild(comparisonLabel);
  
  const releaseSelect = document.createElement("select");
  releaseSelect.id = "network-release-comparison";
  releaseSelect.style.cssText = "padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid #3b82f6; color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px; cursor: pointer; flex: 1; max-width: 200px;";
  ["Aucune comparaison", "v1.0.0 (2024-01-15)", "v1.1.0 (2024-02-20)", "v1.2.0 (2024-03-10)", "v2.0.0 (2024-04-05)"].forEach(release => {
    const opt = document.createElement("option");
    opt.value = release === "Aucune comparaison" ? "none" : release;
    opt.textContent = release;
    releaseSelect.appendChild(opt);
  });
  releaseSelect.onchange = (e) => {
    const selected = (e.target as HTMLSelectElement).value;
    if (selected !== "none") {
      // Afficher une notification ou mettre à jour le graphique
      showToast(`Comparaison activée avec ${selected}`, "info");
    }
  };
  releaseComparison.appendChild(releaseSelect);
  
  filtersContainer.appendChild(releaseComparison);
  
  content.appendChild(filtersContainer);

  // Graphique de latence professionnel (SVG) - Version améliorée
  const graphContainer = document.createElement("div");
  graphContainer.style.cssText = `
    height: 160px; 
    background: linear-gradient(135deg, var(--ic-panel, #1a1d1f) 0%, #1e2225 100%); 
    border: 1px solid var(--ic-border, #2b3136); 
    border-radius: 6px; 
    margin-bottom: 12px; 
    padding: 16px; 
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  `;
  
  const graphSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  graphSvg.setAttribute("width", "100%");
  graphSvg.setAttribute("height", "100%");
  graphSvg.setAttribute("viewBox", "0 0 420 140");
  graphSvg.style.cssText = "display: block; overflow: visible;";
  
  // Grille de fond améliorée avec lignes verticales et horizontales
  for (let i = 0; i <= 4; i++) {
    const y = 25 + (i * 22);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "45");
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", "395");
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "rgba(43, 49, 54, 0.6)");
    line.setAttribute("stroke-width", "0.5");
    line.setAttribute("stroke-dasharray", "3,3");
    graphSvg.appendChild(line);
  }
  
  // Lignes verticales pour le temps
  for (let i = 0; i <= 4; i++) {
    const x = 45 + (i * 87.5);
    const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vLine.setAttribute("x1", String(x));
    vLine.setAttribute("y1", "25");
    vLine.setAttribute("x2", String(x));
    vLine.setAttribute("y2", "113");
    vLine.setAttribute("stroke", "rgba(43, 49, 54, 0.4)");
    vLine.setAttribute("stroke-width", "0.5");
    vLine.setAttribute("stroke-dasharray", "2,4");
    graphSvg.appendChild(vLine);
  }
  
  // Ligne de courbe de latence avec données plus fluides
  const latencyData = [25, 30, 28, 35, 32, 38, 34, 31, 29, 33, 36, 30, 28, 32, 35, 33, 31, 34, 37];
  const points: string[] = [];
  const stepX = 350 / (latencyData.length - 1);
  
  latencyData.forEach((value, index) => {
    const x = 45 + (index * stepX);
    // Normaliser les valeurs entre 20-40 ms vers des coordonnées Y (25-105)
    const normalizedY = 105 - ((value - 20) / 20) * 80;
    points.push(`${x},${normalizedY}`);
  });
  
  // Définitions avec gradients multiples et filtres
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  
  // Gradient principal pour la zone remplie
  const areaGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  areaGradient.setAttribute("id", "latencyAreaGradient");
  areaGradient.setAttribute("x1", "0%");
  areaGradient.setAttribute("y1", "0%");
  areaGradient.setAttribute("x2", "0%");
  areaGradient.setAttribute("y2", "100%");
  
  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#60a5fa");
  stop1.setAttribute("stop-opacity", "0.4");
  areaGradient.appendChild(stop1);
  
  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "50%");
  stop2.setAttribute("stop-color", "#60a5fa");
  stop2.setAttribute("stop-opacity", "0.2");
  areaGradient.appendChild(stop2);
  
  const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", "#60a5fa");
  stop3.setAttribute("stop-opacity", "0.05");
  areaGradient.appendChild(stop3);
  
  // Gradient pour la ligne
  const lineGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  lineGradient.setAttribute("id", "latencyLineGradient");
  lineGradient.setAttribute("x1", "0%");
  lineGradient.setAttribute("y1", "0%");
  lineGradient.setAttribute("x2", "100%");
  lineGradient.setAttribute("y2", "0%");
  
  const lineStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  lineStop1.setAttribute("offset", "0%");
  lineStop1.setAttribute("stop-color", "#60a5fa");
  lineGradient.appendChild(lineStop1);
  
  const lineStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  lineStop2.setAttribute("offset", "50%");
  lineStop2.setAttribute("stop-color", "#3b82f6");
  lineGradient.appendChild(lineStop2);
  
  const lineStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  lineStop3.setAttribute("offset", "100%");
  lineStop3.setAttribute("stop-color", "#60a5fa");
  lineGradient.appendChild(lineStop3);
  
  // Filtre pour l'ombre portée
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  filter.setAttribute("id", "glow");
  
  const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  feGaussianBlur.setAttribute("stdDeviation", "2");
  feGaussianBlur.setAttribute("result", "coloredBlur");
  filter.appendChild(feGaussianBlur);
  
  const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
  const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  feMergeNode1.setAttribute("in", "coloredBlur");
  const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  feMergeNode2.setAttribute("in", "SourceGraphic");
  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);
  filter.appendChild(feMerge);
  
  defs.appendChild(areaGradient);
  defs.appendChild(lineGradient);
  defs.appendChild(filter);
  graphSvg.appendChild(defs);
  
  // Zone remplie sous la courbe avec gradient amélioré
  const areaPath = `M 45,105 L ${points.join(" L ")} L ${45 + (latencyData.length - 1) * stepX},105 Z`;
  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", areaPath);
  area.setAttribute("fill", "url(#latencyAreaGradient)");
  graphSvg.appendChild(area);
  
  // Ligne de courbe avec gradient et ombre
  const linePath = `M ${points.join(" L ")}`;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", linePath);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "url(#latencyLineGradient)");
  line.setAttribute("stroke-width", "2.5");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("filter", "url(#glow)");
  line.style.cssText = "transition: stroke-width 0.3s;";
  graphSvg.appendChild(line);
  
  // Points interactifs sur la courbe avec effets hover
  latencyData.forEach((value, index) => {
    const x = 45 + (index * stepX);
    const normalizedY = 105 - ((value - 20) / 20) * 80;
    
    // Cercle externe (halo)
    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", String(x));
    halo.setAttribute("cy", String(normalizedY));
    halo.setAttribute("r", "5");
    halo.setAttribute("fill", "#60a5fa");
    halo.setAttribute("opacity", "0.2");
    graphSvg.appendChild(halo);
    
    // Cercle principal
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(normalizedY));
    circle.setAttribute("r", "3.5");
    circle.setAttribute("fill", "#60a5fa");
    circle.setAttribute("stroke", "#1a1d1f");
    circle.setAttribute("stroke-width", "2");
    circle.style.cssText = "cursor: pointer; transition: all 0.2s;";
    
    // Tooltip au survol
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${value}ms - Point ${index + 1}`;
    circle.appendChild(title);
    
    graphSvg.appendChild(circle);
  });
  
  // Labels Y (latence) améliorés avec unités
  ["40", "35", "30", "25", "20"].forEach((label, i) => {
    const y = 25 + (i * 22);
    
    // Ligne de marqueur
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
    marker.setAttribute("x1", "42");
    marker.setAttribute("y1", String(y));
    marker.setAttribute("x2", "45");
    marker.setAttribute("y2", String(y));
    marker.setAttribute("stroke", "#60a5fa");
    marker.setAttribute("stroke-width", "1.5");
    graphSvg.appendChild(marker);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "38");
    text.setAttribute("y", String(y + 4));
    text.setAttribute("fill", "#a7b0b7");
    text.setAttribute("font-size", "11");
    text.setAttribute("font-weight", "500");
    text.setAttribute("text-anchor", "end");
    text.textContent = `${label}ms`;
    graphSvg.appendChild(text);
  });
  
  // Labels X (temps) améliorés
  const timeLabels = ["0s", "200s", "409s", "200µs", "20ms"];
  timeLabels.forEach((label, i) => {
    const x = 45 + (i * 87.5);
    
    // Marqueur vertical
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
    marker.setAttribute("x1", String(x));
    marker.setAttribute("y1", "113");
    marker.setAttribute("x2", String(x));
    marker.setAttribute("y2", "118");
    marker.setAttribute("stroke", "#60a5fa");
    marker.setAttribute("stroke-width", "1.5");
    graphSvg.appendChild(marker);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(x));
    text.setAttribute("y", "128");
    text.setAttribute("fill", "#a7b0b7");
    text.setAttribute("font-size", "10");
    text.setAttribute("font-weight", "500");
    text.setAttribute("text-anchor", "middle");
    text.textContent = label;
    graphSvg.appendChild(text);
  });
  
  graphContainer.appendChild(graphSvg);
  content.appendChild(graphContainer);

  // Network requests table
  const table = document.createElement("table");
  table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 11px;";
  table.innerHTML = `
    <thead>
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <th style="text-align: left; padding: 8px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">Name</th>
        <th style="text-align: left; padding: 8px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">Status</th>
        <th style="text-align: left; padding: 8px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">Duration</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <td style="padding: 8px; color: var(--ic-text, #e7ecef);">/api/rentonte</td>
        <td style="padding: 8px; color: var(--ic-mutedText, #a7b0b7);">XHR</td>
        <td style="padding: 8px; color: var(--ic-mutedText, #a7b0b7);">-</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <td style="padding: 8px; color: var(--ic-text, #e7ecef);">system/info</td>
        <td style="padding: 8px; color: #34d399;">200</td>
        <td style="padding: 8px; color: var(--ic-mutedText, #a7b0b7);">180 ms</td>
      </tr>
      <tr>
        <td style="padding: 8px; color: var(--ic-text, #e7ecef);">/modules/init</td>
        <td style="padding: 8px; color: #34d399;">200</td>
        <td style="padding: 8px; color: var(--ic-mutedText, #a7b0b7);">266 ms</td>
      </tr>
    </tbody>
  `;
  content.appendChild(table);

  // Actions (maintenues pour compatibilité mais l'export est dans le header)
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;";
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Effacer les filtres";
  clearBtn.style.cssText = "padding: 6px 12px; background: transparent; border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; cursor: pointer; font-size: 11px;";
  clearBtn.onclick = () => {
    (document.getElementById("network-user-filter") as HTMLSelectElement).value = "all";
    (document.getElementById("network-action-filter") as HTMLSelectElement).value = "all";
    (document.getElementById("network-release-comparison") as HTMLSelectElement).value = "none";
    showToast("Filtres réinitialisés", "info");
  };
  actions.appendChild(clearBtn);
  content.appendChild(actions);

  panel.appendChild(content);
  return panel;
}

function createRegistryViewerPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.style.cssText = PANEL_STYLE;

  // État du viewer
  let currentTab = "ROLE";
  let currentContractFilter = "all";
  let currentTypeFilter: string | null = null;
  let registryData: any[] = [];
  let contractTypes: Array<{ label: string; count: number; color: string; gradient: string }> = [];

  // Fonction pour charger les données du registry
  const loadRegistryData = () => {
    try {
      // Charger le module registry
      const moduleRegistryJson = localStorage.getItem("icontrol_module_registry") || '{"modules":{}}';
      const moduleRegistry = JSON.parse(moduleRegistryJson);
      
      // Charger les contrats depuis localStorage ou utiliser des données par défaut
      const contractsData = localStorage.getItem("icontrol_contracts") || "[]";
      let contracts = JSON.parse(contractsData);
      
      // Si pas de contrats, créer des données par défaut basées sur le système
      if (!contracts || contracts.length === 0) {
        contracts = [
          // ROLE contracts
          { id: "USER", key: "role", label: "Utilisateur", rules: "read,write", type: "ROLE" },
          { id: "ADMIN", key: "role", label: "Administrateur", rules: "read,write,govern", type: "ROLE" },
          { id: "SYSADMIN", key: "role", label: "Administrateur Système", rules: "read,write,govern,develop", type: "ROLE" },
          { id: "DEVELOPER", key: "role", label: "Développeur", rules: "read,write,develop", type: "ROLE" },
          { id: "MASTER", key: "role", label: "Maître", rules: "all", type: "ROLE" },
          // TableDef contracts
          { id: "users_table", key: "table", label: "Table Utilisateurs", rules: "width,align,computed", type: "TableDef" },
          { id: "modules_table", key: "table", label: "Table Modules", rules: "columns,actions,visibleForRole", type: "TableDef" },
          { id: "organizations_table", key: "table", label: "Table Organisations", rules: "sort,filter,pagination", type: "TableDef" },
          // CoreImpikDef contracts
          { id: "core_auth", key: "core", label: "Authentification", rules: "session,token,expiry", type: "CoreImpikDef" },
          { id: "core_storage", key: "core", label: "Stockage", rules: "localStorage,quota,cleanup", type: "CoreImpikDef" },
          { id: "core_rbac", key: "core", label: "RBAC", rules: "roles,permissions,access", type: "CoreImpikDef" }
        ];
        localStorage.setItem("icontrol_contracts", JSON.stringify(contracts));
      }
      
      registryData = contracts;
      
      // Calculer les statistiques par type
      const typeCounts: Record<string, number> = {};
      registryData.forEach(contract => {
        const type = contract.type || "other";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      contractTypes = [
        { label: "ROLE", count: typeCounts["ROLE"] || 0, color: "#818cf8", gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)" },
        { label: "TableDef", count: typeCounts["TableDef"] || 0, color: "#34d399", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)" },
        { label: "CoreImpik", count: typeCounts["CoreImpikDef"] || 0, color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }
      ];
      
      return contracts;
    } catch (error) {
      console.error("Erreur lors du chargement du registry:", error);
      return [];
    }
  };

  // Fonction pour filtrer et afficher les données
  const renderTable = () => {
    let filtered = registryData;
    
    // Filtrer par onglet actif
    if (currentTab !== "all") {
      filtered = filtered.filter(c => {
        if (currentTab === "ROLE") return c.type === "ROLE";
        if (currentTab === "TableDef") return c.type === "TableDef";
        if (currentTab === "CoreImpikDef") return c.type === "CoreImpikDef";
        if (currentTab === "dey") return c.type === "dey" || !c.type;
        if (currentTab === "tools") return c.type === "tools";
        return true;
      });
    }
    
    // Filtrer par type (cercle cliqué)
    if (currentTypeFilter) {
      filtered = filtered.filter(c => c.type === currentTypeFilter);
    }
    
    // Filtrer par contrat sélectionné
    if (currentContractFilter !== "all") {
      filtered = filtered.filter(c => c.id === currentContractFilter || c.key === currentContractFilter);
    }
    
    // Mettre à jour le tableau
    const tbody = contractTable.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = filtered.length > 0 ? filtered.map(contract => `
        <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.id || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.key || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.label || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.rules || ""}</td>
        </tr>
      `).join("") : `
        <tr>
          <td colspan="4" style="padding: 12px; text-align: center; color: var(--ic-mutedText, #a7b0b7);">Aucun contrat trouvé</td>
        </tr>
      `;
    }
    
    // Mettre à jour le sous-titre
    subtitle.textContent = `${filtered.length} contrat(s) affiché(s) sur ${registryData.length} total`;
  };

  // Fonction pour mettre à jour les cercles de distribution
  const updateChart = () => {
    contractChart.innerHTML = "";
    contractTypes.forEach(type => {
      const item = document.createElement("div");
      item.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; cursor: pointer;";
      
      const circleContainer = document.createElement("div");
      circleContainer.style.cssText = "position: relative;";
      
      const circle = document.createElement("div");
      const isActive = currentTypeFilter === type.label || (currentTypeFilter === null && currentTab === type.label);
      circle.style.cssText = `
        width: 40px; 
        height: 40px; 
        border-radius: 50%; 
        background: ${type.gradient}; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: #1a1d1f; 
        font-size: 13px; 
        font-weight: 700;
        box-shadow: ${isActive ? "0 4px 12px rgba(0, 0, 0, 0.5)" : "0 2px 8px rgba(0, 0, 0, 0.3)"}, inset 0 -2px 0 rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        border: ${isActive ? "2px solid rgba(255,255,255,0.3)" : "none"};
      `;
      circle.textContent = String(type.count);
      
      const shineCircle = document.createElement("div");
      shineCircle.style.cssText = `
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
        pointer-events: none;
      `;
      circle.appendChild(shineCircle);
      
      circle.onmouseenter = () => {
        circle.style.transform = "scale(1.15)";
        circle.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.2)";
      };
      circle.onmouseleave = () => {
        circle.style.transform = "scale(1)";
        const isActiveNow = currentTypeFilter === type.label || (currentTypeFilter === null && currentTab === type.label);
        circle.style.boxShadow = `${isActiveNow ? "0 4px 12px rgba(0, 0, 0, 0.5)" : "0 2px 8px rgba(0, 0, 0, 0.3)"}, inset 0 -2px 0 rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.2)`;
      };
      
      circle.onclick = () => {
        if (currentTypeFilter === type.label) {
          currentTypeFilter = null;
        } else {
          currentTypeFilter = type.label;
        }
        renderTable();
        updateChart();
      };
      
      circleContainer.appendChild(circle);
      item.appendChild(circleContainer);
      
      const label = document.createElement("div");
      label.textContent = type.label;
      label.style.cssText = `
        font-size: 10px; 
        color: var(--ic-mutedText, #a7b0b7); 
        text-align: center;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      item.appendChild(label);
      
      contractChart.appendChild(item);
    });
  };

  // Header
  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = "display: flex; flex-direction: column; gap: 2px; flex: 1;";
  const title = document.createElement("div");
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  title.textContent = "Registry viewer";
  const subtitle = document.createElement("div");
  subtitle.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  subtitle.textContent = "Chargement...";
  titleDiv.appendChild(title);
  titleDiv.appendChild(subtitle);
  header.appendChild(titleDiv);
  
  // Boutons d'action
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 8px; align-items: center;";
  
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "🔄";
  refreshBtn.title = "Actualiser";
  refreshBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  refreshBtn.onmouseenter = () => { refreshBtn.style.background = "rgba(255,255,255,0.05)"; refreshBtn.style.transform = "rotate(180deg)"; };
  refreshBtn.onmouseleave = () => { refreshBtn.style.background = "transparent"; refreshBtn.style.transform = "rotate(0deg)"; };
  refreshBtn.onclick = () => {
    loadRegistryData();
    renderTable();
    updateChart();
    // Animation de rotation
    refreshBtn.style.transform = "rotate(360deg)";
    setTimeout(() => { refreshBtn.style.transform = "rotate(0deg)"; }, 300);
  };
  actionsDiv.appendChild(refreshBtn);
  
  const exportBtn = document.createElement("button");
  exportBtn.innerHTML = "📥";
  exportBtn.title = "Exporter";
  exportBtn.style.cssText = "width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;";
  exportBtn.onmouseenter = () => { exportBtn.style.background = "rgba(255,255,255,0.05)"; };
  exportBtn.onmouseleave = () => { exportBtn.style.background = "transparent"; };
  exportBtn.onclick = () => {
    import("/src/core/ui/exportUtils").then(({ exportToCSV, exportToJSON }) => {
      let filtered = registryData;
      if (currentTab !== "all") {
        filtered = filtered.filter(c => {
          if (currentTab === "ROLE") return c.type === "ROLE";
          if (currentTab === "TableDef") return c.type === "TableDef";
          if (currentTab === "CoreImpikDef") return c.type === "CoreImpikDef";
          return true;
        });
      }
      if (currentTypeFilter) {
        filtered = filtered.filter(c => c.type === currentTypeFilter);
      }
      if (currentContractFilter !== "all") {
        filtered = filtered.filter(c => c.id === currentContractFilter || c.key === currentContractFilter);
      }
      
      // Menu déroulant pour choisir le format
      const format = prompt("Choisir le format:\n1. CSV\n2. JSON\n\nEntrez 1 ou 2:");
      if (format === "1") {
        exportToCSV(filtered, `registry-${currentTab}-${Date.now()}`);
      } else if (format === "2") {
        exportToJSON(filtered, `registry-${currentTab}-${Date.now()}`);
      }
    });
  };
  actionsDiv.appendChild(exportBtn);
  
  header.appendChild(actionsDiv);
  panel.appendChild(header);

  // Content
  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  // Tabs
  const tabs = document.createElement("div");
  tabs.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--ic-border, #2b3136);";
  const tabNames = ["ROLE", "TableDef", "CoreImpikDef", "dey", "tools"];
  tabNames.forEach((tabName, idx) => {
    const tab = document.createElement("button");
    tab.textContent = tabName;
    tab.dataset.tab = tabName;
    const isActive = idx === 0;
    tab.style.cssText = `padding: 8px 12px; background: transparent; border: none; color: ${isActive ? "#e7ecef" : "#a7b0b7"}; cursor: pointer; border-bottom: 2px solid ${isActive ? "#3b82f6" : "transparent"}; font-size: 11px; transition: all 0.2s;`;
    tab.onclick = () => {
      currentTab = tabName;
      currentTypeFilter = null;
      tabNames.forEach((name, i) => {
        const t = tabs.querySelector(`[data-tab="${name}"]`) as HTMLElement;
        if (t) {
          const isActiveNow = name === tabName;
          t.style.color = isActiveNow ? "#e7ecef" : "#a7b0b7";
          t.style.borderBottomColor = isActiveNow ? "#3b82f6" : "transparent";
        }
      });
      renderTable();
      updateChart();
    };
    tabs.appendChild(tab);
  });
  content.appendChild(tabs);

  // Contracts section
  const contacts = document.createElement("div");
  contacts.style.cssText = "margin-bottom: 12px;";
  const contactsLabel = document.createElement("div");
  contactsLabel.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 4px;";
  contactsLabel.textContent = "Contracts";
  contacts.appendChild(contactsLabel);
  const contactsSelect = document.createElement("select");
  contactsSelect.style.cssText = "width: 100%; padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px; cursor: pointer;";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "Tous les contrats";
  contactsSelect.appendChild(optAll);
  contactsSelect.onchange = () => {
    currentContractFilter = contactsSelect.value;
    renderTable();
  };
  contacts.appendChild(contactsSelect);
  content.appendChild(contacts);

  // Mini graphique de distribution des types de contrats
  const contractChart = document.createElement("div");
  contractChart.style.cssText = `
    margin-bottom: 12px; 
    padding: 14px; 
    background: linear-gradient(135deg, var(--ic-panel, #1a1d1f) 0%, #1e2225 100%); 
    border: 1px solid var(--ic-border, #2b3136); 
    border-radius: 6px; 
    display: flex; 
    align-items: center; 
    justify-content: space-around;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  `;
  content.appendChild(contractChart);

  // Contract table
  const contractTable = document.createElement("table");
  contractTable.style.cssText = "width: 100%; border-collapse: collapse; font-size: 10px;";
  contractTable.innerHTML = `
    <thead>
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <th style="text-align: left; padding: 6px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">id</th>
        <th style="text-align: left; padding: 6px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">key</th>
        <th style="text-align: left; padding: 6px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">label</th>
        <th style="text-align: left; padding: 6px; color: var(--ic-mutedText, #a7b0b7); font-weight: 600;">rules</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="4" style="padding: 12px; text-align: center; color: var(--ic-mutedText, #a7b0b7);">Chargement...</td>
      </tr>
    </tbody>
  `;
  content.appendChild(contractTable);

  panel.appendChild(content);
  
  // Charger les données initiales
  loadRegistryData();
  
  // Mettre à jour le select avec les contrats disponibles
  const updateSelect = () => {
    contactsSelect.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Tous les contrats";
    contactsSelect.appendChild(optAll);
    
    registryData.forEach(contract => {
      const opt = document.createElement("option");
      opt.value = contract.id || contract.key;
      opt.textContent = `${contract.id || contract.key} - ${contract.label || ""}`;
      contactsSelect.appendChild(opt);
    });
  };
  
  updateSelect();
  renderTable();
  updateChart();

  // Section Versioning & Rollback
  const versioningSection = document.createElement("div");
  versioningSection.style.cssText = "margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 6px;";
  
  const versioningTitle = document.createElement("div");
  versioningTitle.textContent = "📦 Versions & Rollback";
  versioningTitle.style.cssText = "font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 8px;";
  versioningSection.appendChild(versioningTitle);
  
  // Historique des versions (simulé)
  const versions = [
    { version: "v2.1.0", date: "2024-04-10", contracts: 12, status: "active" },
    { version: "v2.0.5", date: "2024-03-25", contracts: 11, status: "archived" },
    { version: "v2.0.0", date: "2024-02-15", contracts: 10, status: "archived" }
  ];
  
  const versionsList = document.createElement("div");
  versionsList.style.cssText = "display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;";
  
  versions.forEach((v, idx) => {
    const versionItem = document.createElement("div");
    versionItem.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: ${v.status === "active" ? "rgba(78, 201, 176, 0.1)" : "rgba(255,255,255,0.02)"}; border-radius: 4px; border-left: 3px solid ${v.status === "active" ? "#4ec9b0" : "#818cf8"};`;
    
    const left = document.createElement("div");
    left.style.cssText = "display: flex; flex-direction: column; gap: 2px;";
    left.innerHTML = `
      <span style="font-size: 11px; font-weight: 600; color: var(--ic-text, #e7ecef);">${v.version}</span>
      <span style="font-size: 10px; color: var(--ic-mutedText, #a7b0b7);">${v.date} • ${v.contracts} contrats</span>
    `;
    
    const right = document.createElement("div");
    right.style.cssText = "display: flex; gap: 4px;";
    
    if (v.status === "archived" && idx > 0) {
      const rollbackBtn = document.createElement("button");
      rollbackBtn.textContent = "↩️ Rollback";
      rollbackBtn.style.cssText = "padding: 4px 8px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600;";
      rollbackBtn.onclick = () => {
        if (confirm(`Voulez-vous restaurer la version ${v.version} ?`)) {
          showToast(`Rollback vers ${v.version} en cours...`, "info");
          // Simulation: recharger avec ancienne version
          setTimeout(() => {
            loadRegistryData();
            renderTable();
            updateChart();
            showToast(`Version ${v.version} restaurée`, "success");
          }, 500);
        }
      };
      right.appendChild(rollbackBtn);
    } else {
      const activeBadge = document.createElement("span");
      activeBadge.textContent = "✓ Actif";
      activeBadge.style.cssText = "padding: 4px 8px; background: rgba(78, 201, 176, 0.2); color: #4ec9b0; border-radius: 4px; font-size: 10px; font-weight: 600;";
      right.appendChild(activeBadge);
    }
    
    versionItem.appendChild(left);
    versionItem.appendChild(right);
    versionsList.appendChild(versionItem);
  });
  
  versioningSection.appendChild(versionsList);
  content.appendChild(versioningSection);

  // Section Preview par rôle
  const previewSection = document.createElement("div");
  previewSection.style.cssText = "margin-top: 12px; padding: 12px; background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 6px;";
  
  const previewTitle = document.createElement("div");
  previewTitle.textContent = "👁️ Preview par rôle";
  previewTitle.style.cssText = "font-size: 12px; font-weight: 600; color: #8b5cf6; margin-bottom: 8px;";
  previewSection.appendChild(previewTitle);
  
  const roleSelect = document.createElement("select");
  roleSelect.id = "registry-role-preview";
  roleSelect.style.cssText = "width: 100%; padding: 6px 10px; background: var(--ic-panel, #1a1d1f); border: 1px solid #8b5cf6; color: var(--ic-text, #e7ecef); border-radius: 4px; font-size: 11px; cursor: pointer; margin-bottom: 8px;";
  ["ADMIN", "DEVELOPER", "USER", "SYSADMIN"].forEach(role => {
    const opt = document.createElement("option");
    opt.value = role;
    opt.textContent = `Prévisualiser comme: ${role}`;
    roleSelect.appendChild(opt);
  });
  roleSelect.onchange = () => {
    const selectedRole = roleSelect.value;
    // Filtrer les contrats visibles selon le rôle
    const roleFiltered = registryData.filter(contract => {
      // Simulation: certains contrats ne sont visibles que pour certains rôles
      if (selectedRole === "USER" && contract.type === "ROLE" && contract.id !== "USER") return false;
      if (selectedRole === "DEVELOPER" && contract.type === "CoreImpikDef") return false;
      return true;
    });
    // Mettre à jour le tableau avec les contrats filtrés
    const tbody = contractTable.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = roleFiltered.length > 0 ? roleFiltered.map(contract => `
        <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.id || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.key || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.label || ""}</td>
          <td style="padding: 6px; color: var(--ic-text, #e7ecef);">${contract.rules || ""}</td>
        </tr>
      `).join("") : `
        <tr>
          <td colspan="4" style="padding: 12px; text-align: center; color: var(--ic-mutedText, #a7b0b7);">Aucun contrat visible pour ce rôle</td>
        </tr>
      `;
    }
    showToast(`Preview activé pour le rôle: ${selectedRole}`, "info");
  };
  previewSection.appendChild(roleSelect);
  content.appendChild(previewSection);

  // Section Dependency Graph & Impact Analysis
  const analysisSection = document.createElement("div");
  analysisSection.style.cssText = "margin-top: 12px; padding: 12px; background: rgba(236, 72, 153, 0.05); border: 1px solid rgba(236, 72, 153, 0.2); border-radius: 6px;";
  
  const analysisTitle = document.createElement("div");
  analysisTitle.textContent = "🔗 Analyse des dépendances";
  analysisTitle.style.cssText = "font-size: 12px; font-weight: 600; color: #ec4899; margin-bottom: 8px;";
  analysisSection.appendChild(analysisTitle);
  
  // Graphique de dépendances simple (texte)
  const depsInfo = document.createElement("div");
  depsInfo.style.cssText = "font-size: 11px; color: var(--ic-text, #e7ecef); line-height: 1.6; margin-bottom: 8px;";
  depsInfo.innerHTML = `
    <div style="margin-bottom: 6px;"><strong>Dépendances détectées:</strong></div>
    <div style="padding-left: 12px;">
      • <code style="color: #818cf8;">core_rbac</code> → <code style="color: #34d399;">users_table</code><br>
      • <code style="color: #818cf8;">ADMIN</code> → <code style="color: #fbbf24;">modules_table</code><br>
      • <code style="color: #34d399;">users_table</code> → <code style="color: #818cf8;">core_auth</code>
    </div>
  `;
  analysisSection.appendChild(depsInfo);
  
  // Impact analysis
  const impactBtn = document.createElement("button");
  impactBtn.textContent = "📊 Analyser l'impact d'un changement";
  impactBtn.style.cssText = "width: 100%; padding: 8px; background: #ec4899; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin-top: 8px;";
  impactBtn.onclick = () => {
    const contractId = prompt("Entrez l'ID du contrat à analyser:");
    if (contractId) {
      // Simulation de l'analyse d'impact
      const impacted = registryData.filter(c => 
        c.rules?.includes(contractId) || c.id === contractId
      ).map(c => c.id || c.label).join(", ");
      
      const impactModal = document.createElement("div");
      impactModal.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;";
      
      const modalContent = document.createElement("div");
      modalContent.style.cssText = "background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); border-radius: 12px; padding: 24px; max-width: 500px; width: 90%;";
      modalContent.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: var(--ic-text, #e7ecef); margin-bottom: 16px;">
          📊 Analyse d'impact: ${contractId}
        </div>
        <div style="font-size: 12px; color: var(--ic-text, #e7ecef); line-height: 1.6; margin-bottom: 20px;">
          <strong>Contrats affectés:</strong><br>
          ${impacted || "Aucun"}
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="close-impact-modal" style="padding: 8px 16px; background: rgba(255,255,255,0.05); color: var(--ic-text, #e7ecef); border: 1px solid var(--ic-border, #2b3136); border-radius: 6px; cursor: pointer; font-weight: 600;">Fermer</button>
        </div>
      `;
      
      impactModal.appendChild(modalContent);
      document.body.appendChild(impactModal);
      
      modalContent.querySelector("#close-impact-modal")?.addEventListener("click", () => {
        impactModal.remove();
      });
      
      impactModal.onclick = (e) => {
        if (e.target === impactModal) impactModal.remove();
      };
    }
  };
  analysisSection.appendChild(impactBtn);
  content.appendChild(analysisSection);
  
  return panel;
}

async function createVerificationPage(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  `;

  // En-tête
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  `;
  const titleDiv = document.createElement("div");
  titleDiv.innerHTML = `
    <div style="font-size: 24px; font-weight: 700; color: var(--ic-text, #e7ecef); margin-bottom: 4px;">
      🔍 Vérification Système
    </div>
    <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 14px;">
      État de tous les composants du système iCONTROL
    </div>
  `;
  header.appendChild(titleDiv);
  
  const refreshBtn = document.createElement("button");
  refreshBtn.innerHTML = "🔄 Actualiser";
  refreshBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  `;
  refreshBtn.onmouseenter = () => refreshBtn.style.background = "rgba(255,255,255,0.05)";
  refreshBtn.onmouseleave = () => refreshBtn.style.background = "var(--ic-panel, #1a1d1f)";
  refreshBtn.onclick = () => location.reload();
  header.appendChild(refreshBtn);
  
  container.appendChild(header);

  // Système d'onglets
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--ic-border, #2b3136);
    margin-bottom: 20px;
  `;
  
  let currentTab = "verification";
  
  const verificationTab = document.createElement("button");
  verificationTab.textContent = "Vérification";
  verificationTab.dataset.tab = "verification";
  verificationTab.style.cssText = `
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #e7ecef;
    cursor: pointer;
    border-bottom: 3px solid #3b82f6;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  `;
  
  const errorCodesTab = document.createElement("button");
  errorCodesTab.textContent = "Code d'erreurs";
  errorCodesTab.dataset.tab = "error-codes";
  errorCodesTab.style.cssText = `
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #a7b0b7;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  `;
  
  tabsContainer.appendChild(verificationTab);
  tabsContainer.appendChild(errorCodesTab);
  container.appendChild(tabsContainer);

  // Contenu des onglets
  const contentWrapper = document.createElement("div");
  contentWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 600px;
  `;

  // Fonction pour vérifier un composant système
  const checkComponent = async (name: string, checkFn: () => Promise<{ status: "ok" | "warn" | "err"; message: string; code?: string; details?: string; recommendation?: string; timestamp?: string; severity?: string }>): Promise<{ name: string; status: string; message: string; code?: string; details?: string; recommendation?: string; timestamp?: string; severity?: string }> => {
    try {
      const result = await checkFn();
      return { 
        name, 
        ...result,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name,
        status: "err",
        message: error.message || "Erreur inconnue",
        code: error.code || "ERR_CHECK_FAILED",
        details: error.stack || String(error),
        timestamp: new Date().toISOString(),
        severity: "critical",
        recommendation: "Vérifiez les logs système pour plus de détails"
      };
    }
  };

  // Vérifications système
  const checks = await Promise.all([
    // 1. Authentification & Sessions
    checkComponent("Authentification & Sessions", async () => {
      try {
        const session = localStorage.getItem("icontrol_session");
        if (!session) return { 
          status: "err", 
          message: "Aucune session active", 
          code: "ERR_NO_SESSION",
          recommendation: "Déconnectez-vous et reconnectez-vous pour créer une nouvelle session",
          details: "localStorage.getItem('icontrol_session') retourne null"
        };
        const sessionData = JSON.parse(session);
        if (!sessionData.token) return { 
          status: "err", 
          message: "Token de session invalide", 
          code: "ERR_INVALID_TOKEN",
          recommendation: "Déconnectez-vous et reconnectez-vous pour obtenir un nouveau token",
          details: `Session trouvée mais token manquant. Session ID: ${sessionData.id || "N/A"}`
        };
        const expiresAt = new Date(sessionData.expiresAt);
        if (expiresAt < new Date()) {
          const expiredMinutes = Math.floor((Date.now() - expiresAt.getTime()) / (1000 * 60));
          return { 
            status: "err", 
            message: "Session expirée", 
            code: "ERR_SESSION_EXPIRED",
            recommendation: "Déconnectez-vous et reconnectez-vous pour créer une nouvelle session",
            details: `Session expirée depuis ${expiredMinutes} minute(s). Expirée le: ${expiresAt.toLocaleString('fr-FR')}`
          };
        }
        const expiresInMinutes = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60));
        return { 
          status: "ok", 
          message: `Sessions actives et valides (expire dans ${expiresInMinutes} min)`,
          details: `Token: ${sessionData.token.substring(0, 10)}..., Expire: ${expiresAt.toLocaleString('fr-FR')}, User: ${sessionData.userId || "N/A"}`
        };
      } catch (error: any) {
        return { 
          status: "err", 
          message: "Erreur de lecture des sessions", 
          code: "ERR_SESSION_READ",
          details: error.message || String(error),
          recommendation: "Vérifiez les logs de l'application pour plus de détails"
        };
      }
    }),

    // 2. Storage (LocalStorage)
    checkComponent("Storage Local", async () => {
      try {
        const testKey = "__icontrol_storage_test__";
        const testValue = Date.now().toString();
        localStorage.setItem(testKey, testValue);
        const read = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        if (read !== testValue) return { 
          status: "err", 
          message: "Écriture/lecture localStorage échouée", 
          code: "ERR_STORAGE_RW",
          details: `Test écriture: "${testValue}", Lecture: "${read}"`,
          recommendation: "Videz le cache du navigateur ou utilisez un navigateur différent"
        };
        const storageKeys = Object.keys(localStorage);
        const used = new Blob(storageKeys.map(k => localStorage.getItem(k) || "")).size;
        const quota = 5 * 1024 * 1024; // ~5MB
        const percent = (used / quota) * 100;
        const usedMB = (used / (1024 * 1024)).toFixed(2);
        const quotaMB = (quota / (1024 * 1024)).toFixed(0);
        if (percent > 90) return { 
          status: "err", 
          message: `Stockage presque plein (${Math.round(percent)}%)`, 
          code: "ERR_STORAGE_FULL",
          details: `Utilisé: ${usedMB} MB / ${quotaMB} MB (${storageKeys.length} clés)`,
          recommendation: "Supprimez les données inutilisées ou videz le cache du navigateur"
        };
        if (percent > 75) return { 
          status: "warn", 
          message: `Stockage élevé (${Math.round(percent)}%)`, 
          code: "WARN_STORAGE_HIGH",
          details: `Utilisé: ${usedMB} MB / ${quotaMB} MB (${storageKeys.length} clés)`,
          recommendation: "Surveillez l'utilisation du stockage et nettoyez régulièrement"
        };
        return { 
          status: "ok", 
          message: `Stockage disponible (${Math.round(percent)}% utilisé)`,
          details: `Utilisé: ${usedMB} MB / ${quotaMB} MB (${storageKeys.length} clés)`
        };
      } catch (error: any) {
        return { 
          status: "err", 
          message: "localStorage non disponible", 
          code: "ERR_STORAGE_UNAVAILABLE",
          details: error.message || String(error),
          recommendation: "Assurez-vous que votre navigateur supporte localStorage et n'est pas en mode privé"
        };
      }
    }),

    // 3. Modules Système
    checkComponent("Modules Système", async () => {
      try {
        const modulesJson = localStorage.getItem("icontrol_module_registry") || '{"modules":{}}';
        const modules = JSON.parse(modulesJson);
        const enabledModules = Object.values(modules.modules || {}).filter((m: any) => m.enabled).length;
        const totalModules = Object.keys(modules.modules || {}).length;
        if (!modules.modules || totalModules === 0) return { 
          status: "warn", 
          message: "Aucun module enregistré", 
          code: "WARN_NO_MODULES",
          details: "localStorage.getItem('icontrol_module_registry') retourne une structure vide",
          recommendation: "Vérifiez la configuration des modules dans la page Management"
        };
        const coreSystemEnabled = modules.modules["core-system"]?.enabled;
        if (!coreSystemEnabled) return { 
          status: "err", 
          message: "Module core-system désactivé", 
          code: "ERR_CORE_DISABLED",
          details: "Le module core-system est désactivé, ce qui peut causer des dysfonctionnements critiques",
          recommendation: "Activez immédiatement le module core-system dans la page Management"
        };
        const disabledModules = Object.entries(modules.modules || {}).filter(([id, m]: [string, any]) => !m.enabled).map(([id]) => id);
        return { 
          status: "ok", 
          message: `${enabledModules}/${totalModules} modules actifs`,
          details: disabledModules.length > 0 ? `Modules désactivés: ${disabledModules.join(", ")}` : "Tous les modules sont actifs"
        };
      } catch (error: any) {
        return { 
          status: "err", 
          message: "Erreur de lecture des modules", 
          code: "ERR_MODULES_READ",
          details: error.message || String(error),
          recommendation: "Vérifiez l'intégrité des données des modules dans localStorage"
        };
      }
    }),

    // 4. RBAC (Permissions)
    checkComponent("RBAC & Permissions", async () => {
      try {
        const role = getRole();
        if (!role) return { 
          status: "err", 
          message: "Aucun rôle utilisateur", 
          code: "ERR_NO_ROLE",
          details: "getRole() retourne null ou undefined",
          recommendation: "Déconnectez-vous et reconnectez-vous pour obtenir un rôle valide"
        };
        const validRoles = ["USER", "ADMIN", "SYSADMIN", "DEVELOPER", "MASTER"];
        if (!validRoles.includes(role)) return { 
          status: "warn", 
          message: `Rôle invalide: ${role}`, 
          code: "WARN_INVALID_ROLE",
          details: `Rôle trouvé: "${role}", Rôles valides: ${validRoles.join(", ")}`,
          recommendation: "Contactez l'administrateur pour corriger votre rôle"
        };
        const roleHierarchy = { "USER": 1, "ADMIN": 2, "SYSADMIN": 3, "DEVELOPER": 4, "MASTER": 5 };
        const roleLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
        return { 
          status: "ok", 
          message: `Rôle valide: ${role}`,
          details: `Niveau de permissions: ${roleLevel}/5 (${roleLevel >= 3 ? "Élevé" : roleLevel >= 2 ? "Moyen" : "Basique"})`
        };
      } catch (error: any) {
        return { 
          status: "err", 
          message: "Erreur de vérification RBAC", 
          code: "ERR_RBAC_CHECK",
          details: error.message || String(error),
          recommendation: "Vérifiez les logs système pour plus de détails"
        };
      }
    }),

    // 5. Safe Mode
    checkComponent("Safe Mode", async () => {
      try {
        const safeMode = getSafeMode();
        if (safeMode?.enabled) return { 
          status: "warn", 
          message: "Safe Mode actif (mode lecture seule)", 
          code: "WARN_SAFE_MODE",
          details: `Safe Mode activé. Raison: ${safeMode.reason || "Non spécifiée"}`,
          recommendation: "Si nécessaire, désactivez Safe Mode dans la page Système pour permettre les modifications"
        };
        return { 
          status: "ok", 
          message: "Safe Mode désactivé (mode normal)",
          details: "Le système fonctionne en mode normal, toutes les opérations sont autorisées"
        };
      } catch (error: any) {
        return { 
          status: "err", 
          message: "Erreur de vérification Safe Mode", 
          code: "ERR_SAFE_MODE_CHECK",
          details: error.message || String(error),
          recommendation: "Vérifiez la configuration Safe Mode dans la page Système"
        };
      }
    }),

    // 6. Système de Santé
    checkComponent("Système de Santé", async () => {
      try {
        const { systemHealthMonitor } = await import("/src/core/monitoring/systemHealth");
        const health = systemHealthMonitor.getCurrentHealth();
        if (health.status === "error") return { 
          status: "err", 
          message: health.message, 
          code: "ERR_HEALTH_ERROR",
          details: JSON.stringify(health.details, null, 2),
          recommendation: "Vérifiez les métriques système et consultez les logs pour identifier la cause"
        };
        if (health.status === "warning") return { 
          status: "warn", 
          message: health.message, 
          code: "WARN_HEALTH_WARNING",
          details: JSON.stringify(health.details, null, 2),
          recommendation: "Surveillez les métriques système et prenez des mesures préventives si nécessaire"
        };
        return { 
          status: "ok", 
          message: health.message || "Système en bonne santé",
          details: JSON.stringify(health.details, null, 2)
        };
      } catch (error: any) {
        return { 
          status: "warn", 
          message: "Monitoring de santé non disponible", 
          code: "WARN_HEALTH_UNAVAILABLE",
          details: error.message || String(error),
          recommendation: "Vérifiez que le module de monitoring est correctement initialisé"
        };
      }
    }),

    // 7. Métriques Système
    checkComponent("Métriques Système", async () => {
      try {
        const { systemMetrics } = await import("/src/core/monitoring/systemMetrics");
        const metrics = systemMetrics.getLatestMetrics();
        if (!metrics) return { 
          status: "warn", 
          message: "Métriques non disponibles", 
          code: "WARN_METRICS_UNAVAILABLE",
          recommendation: "Attendez quelques secondes et actualisez la page"
        };
        const memPercent = metrics.performance.memory.percentage;
        const cpuPercent = metrics.performance.cpu.usage;
        const memUsedMB = ((metrics.performance.memory.used || 0) / (1024 * 1024)).toFixed(2);
        const memTotalMB = ((metrics.performance.memory.total || 0) / (1024 * 1024)).toFixed(0);
        if (memPercent > 90 || cpuPercent > 90) return { 
          status: "err", 
          message: `Ressources critiques (MEM: ${Math.round(memPercent)}%, CPU: ${Math.round(cpuPercent)}%)`, 
          code: "ERR_RESOURCES_CRITICAL",
          details: `Mémoire: ${memUsedMB} MB / ${memTotalMB} MB (${Math.round(memPercent)}%), CPU: ${Math.round(cpuPercent)}%`,
          recommendation: "Fermez les onglets inutiles, redémarrez l'application ou contactez l'administrateur système"
        };
        if (memPercent > 75 || cpuPercent > 80) return { 
          status: "warn", 
          message: `Ressources élevées (MEM: ${Math.round(memPercent)}%, CPU: ${Math.round(cpuPercent)}%)`, 
          code: "WARN_RESOURCES_HIGH",
          details: `Mémoire: ${memUsedMB} MB / ${memTotalMB} MB (${Math.round(memPercent)}%), CPU: ${Math.round(cpuPercent)}%`,
          recommendation: "Surveillez l'utilisation des ressources et libérez de la mémoire si possible"
        };
        return { 
          status: "ok", 
          message: `Ressources stables (MEM: ${Math.round(memPercent)}%, CPU: ${Math.round(cpuPercent)}%)`,
          details: `Mémoire: ${memUsedMB} MB / ${memTotalMB} MB (${Math.round(memPercent)}%), CPU: ${Math.round(cpuPercent)}%`
        };
      } catch (error: any) {
        return { 
          status: "warn", 
          message: "Système de métriques non disponible", 
          code: "WARN_METRICS_UNAVAILABLE",
          details: error.message || String(error),
          recommendation: "Vérifiez que le module de métriques est correctement initialisé"
        };
      }
    }),

    // 8. Abonnements
    checkComponent("Abonnements", async () => {
      try {
        const { getActiveSubscriptions } = await import("/src/core/subscriptions/subscriptionManager");
        const subs = getActiveSubscriptions();
        const activeCount = subs.filter(s => s.status === "active").length;
        if (activeCount === 0) return { status: "ok", message: "Mode Freemium actif (0 abonnement premium)" };
        return { status: "ok", message: `${activeCount} abonnement(s) actif(s)` };
      } catch {
        return { status: "warn", message: "Gestionnaire d'abonnements non disponible", code: "WARN_SUBSCRIPTIONS_UNAVAILABLE" };
      }
    }),

    // 9. Cache Système
    checkComponent("Cache Système", async () => {
      try {
        const cacheData = localStorage.getItem("icontrol_cache") || "{}";
        const cache = JSON.parse(cacheData);
        const keys = Object.keys(cache);
        if (keys.length === 0) return { status: "ok", message: "Cache vide (normal au démarrage)" };
        return { status: "ok", message: `${keys.length} entrée(s) en cache` };
      } catch {
        return { status: "warn", message: "Système de cache non disponible", code: "WARN_CACHE_UNAVAILABLE" };
      }
    }),

    // 10. Sécurité (Rate Limiting)
    checkComponent("Sécurité & Rate Limiting", async () => {
      try {
        const rateLimitData = localStorage.getItem("icontrol_rate_limit") || "{}";
        const rateLimit = JSON.parse(rateLimitData);
        const now = Date.now();
        const recentAttempts = Object.values(rateLimit).filter((t: any) => now - t < 60000).length as number;
        if (recentAttempts > 100) return { status: "warn", message: `${recentAttempts} tentatives récentes détectées`, code: "WARN_HIGH_ATTEMPTS" };
        return { status: "ok", message: "Système de sécurité opérationnel" };
      } catch {
        return { status: "warn", message: "Système de sécurité non disponible", code: "WARN_SECURITY_UNAVAILABLE" };
      }
    }),

    // 11. Audit & Logs
    checkComponent("Audit & Logs", async () => {
      try {
        const allAuditLogs = readAuditLog();
        const auditLogs = allAuditLogs.slice(-100); // Limiter à 100 derniers
        if (auditLogs.length === 0) return { 
          status: "warn", 
          message: "Aucun log d'audit disponible", 
          code: "WARN_NO_AUDIT_LOGS",
          details: "Aucune entrée d'audit trouvée dans le système",
          recommendation: "Cela peut être normal si l'application vient d'être démarrée"
        };
        const now = Date.now();
        const recentErrors = auditLogs.filter(log => log.level === "ERR" && now - new Date(log.ts).getTime() < 3600000);
        const recentErrorsCount = recentErrors.length;
        const lastError = recentErrors.length > 0 ? recentErrors[recentErrors.length - 1] : null;
        if (recentErrorsCount > 10) return { 
          status: "err", 
          message: `${recentErrorsCount} erreurs dans la dernière heure`, 
          code: "ERR_RECENT_ERRORS",
          details: lastError ? `Dernière erreur: ${lastError.message || lastError.code} (${new Date(lastError.ts).toLocaleString('fr-FR')})` : "Multiple erreurs détectées",
          recommendation: "Consultez la page Logs pour voir les détails des erreurs et prendre les mesures correctives"
        };
        if (recentErrorsCount > 5) return { 
          status: "warn", 
          message: `${recentErrorsCount} erreurs dans la dernière heure`, 
          code: "WARN_RECENT_ERRORS",
          details: lastError ? `Dernière erreur: ${lastError.message || lastError.code} (${new Date(lastError.ts).toLocaleString('fr-FR')})` : "Plusieurs erreurs détectées",
          recommendation: "Surveillez les logs et consultez la page Logs pour plus de détails"
        };
        return { 
          status: "ok", 
          message: `${auditLogs.length} entrée(s) d'audit (${recentErrorsCount} erreur(s) récente(s))`,
          details: `Total: ${auditLogs.length} entrées, Erreurs (1h): ${recentErrorsCount}, Warnings: ${auditLogs.filter(l => l.level === "warning").length}`
        };
      } catch (error: any) {
        return { 
          status: "warn", 
          message: "Système d'audit non disponible", 
          code: "WARN_AUDIT_UNAVAILABLE",
          details: error.message || String(error),
          recommendation: "Vérifiez que le système d'audit est correctement initialisé"
        };
      }
    }),

    // 12. Réseau & Connectivité
    checkComponent("Réseau & Connectivité", async () => {
      try {
        if (!navigator.onLine) return { 
          status: "err", 
          message: "Connexion réseau hors ligne", 
          code: "ERR_OFFLINE",
          details: "navigator.onLine retourne false",
          recommendation: "Vérifiez votre connexion internet et que le navigateur n'est pas en mode hors ligne"
        };
        const online = navigator.onLine;
        const userAgent = navigator.userAgent;
        const connectionType = (navigator as any).connection?.effectiveType || "Non détecté";
        return { 
          status: online ? "ok" : "err", 
          message: online ? "Connexion réseau active" : "Connexion réseau inactive", 
          code: online ? undefined : "ERR_OFFLINE",
          details: `Type de connexion: ${connectionType}, User-Agent: ${userAgent.substring(0, 50)}...`
        };
      } catch (error: any) {
        return { 
          status: "warn", 
          message: "Impossible de vérifier la connectivité", 
          code: "WARN_CONNECTIVITY_CHECK",
          details: error.message || String(error),
          recommendation: "Vérifiez manuellement votre connexion réseau"
        };
      }
    })
  ]);

  // Statistiques globales
  const stats = {
    ok: checks.filter(c => c.status === "ok").length,
    warn: checks.filter(c => c.status === "warn").length,
    err: checks.filter(c => c.status === "err").length
  };
  const overallStatus = stats.err > 0 ? "err" : stats.warn > 0 ? "warn" : "ok";

  // Résumé en haut
  const summary = document.createElement("div");
  summary.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  `;
  summary.innerHTML = `
    <div style="padding: 20px; background: rgba(78, 201, 176, 0.1); border: 1px solid rgba(78, 201, 176, 0.3); border-radius: 8px;">
      <div style="color: #858585; font-size: 12px; margin-bottom: 8px;">✓ Opérationnel</div>
      <div style="font-size: 32px; font-weight: 700; color: #4ec9b0;">${stats.ok}</div>
    </div>
    <div style="padding: 20px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">
      <div style="color: #858585; font-size: 12px; margin-bottom: 8px;">⚠ Avertissement</div>
      <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">${stats.warn}</div>
    </div>
    <div style="padding: 20px; background: rgba(244, 135, 113, 0.1); border: 1px solid rgba(244, 135, 113, 0.3); border-radius: 8px;">
      <div style="color: #858585; font-size: 12px; margin-bottom: 8px;">✗ Erreur</div>
      <div style="font-size: 32px; font-weight: 700; color: #f48771;">${stats.err}</div>
    </div>
  `;

  // Contenu de l'onglet Vérification
  const verificationContent = document.createElement("div");
  verificationContent.id = "verification-content";
  verificationContent.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 20px;
  `;

  // Statut global
  const globalStatus = document.createElement("div");
  globalStatus.style.cssText = `
    padding: 16px 20px;
    background: ${overallStatus === "ok" ? "rgba(78, 201, 176, 0.1)" : overallStatus === "warn" ? "rgba(245, 158, 11, 0.1)" : "rgba(244, 135, 113, 0.1)"};
    border-left: 4px solid ${overallStatus === "ok" ? "#4ec9b0" : overallStatus === "warn" ? "#f59e0b" : "#f48771"};
    border-radius: 8px;
    margin-bottom: 20px;
  `;
  globalStatus.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">${overallStatus === "ok" ? "✅" : overallStatus === "warn" ? "⚠️" : "❌"}</span>
      <div>
        <div style="font-weight: 600; color: var(--ic-text, #e7ecef); font-size: 16px; margin-bottom: 4px;">
          ${overallStatus === "ok" ? "Système Opérationnel" : overallStatus === "warn" ? "Système en Avertissement" : "Système en Erreur"}
        </div>
        <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 13px;">
          ${stats.ok} composant(s) OK, ${stats.warn} avertissement(s), ${stats.err} erreur(s)
        </div>
      </div>
    </div>
  `;

  // Liste des vérifications
  const checksList = document.createElement("div");
  checksList.style.cssText = `
    display: grid;
    gap: 12px;
  `;

  verificationContent.appendChild(summary);
  verificationContent.appendChild(globalStatus);

  checks.forEach(check => {
    const checkCard = document.createElement("div");
    checkCard.style.cssText = `
      padding: 16px;
      background: var(--ic-card, #1a1d1f);
      border: 1px solid var(--ic-border, #2b3136);
      border-left: 4px solid ${check.status === "ok" ? "#4ec9b0" : check.status === "warn" ? "#f59e0b" : "#f48771"};
      border-radius: 8px;
    `;
    
    const statusIcon = check.status === "ok" ? "✓" : check.status === "warn" ? "⚠" : "✗";
    const statusColor = check.status === "ok" ? "#4ec9b0" : check.status === "warn" ? "#f59e0b" : "#f48771";
    const hasDetails = check.code || check.details || check.recommendation;
    
    checkCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 18px; color: ${statusColor};">${statusIcon}</span>
            <span style="font-weight: 600; color: var(--ic-text, #e7ecef); font-size: 15px;">${check.name}</span>
          </div>
          <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 13px; margin-left: 26px; line-height: 1.5;">
            ${check.message}
          </div>
          ${check.timestamp ? `
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 11px; margin-left: 26px; margin-top: 4px; opacity: 0.7;">
              ⏱ ${new Date(check.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
            </div>
          ` : ""}
        </div>
        <span style="padding: 4px 10px; background: ${statusColor}20; color: ${statusColor}; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
          ${check.status === "ok" ? "OK" : check.status === "warn" ? "WARN" : "ERR"}
        </span>
      </div>
      ${hasDetails ? `
        <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid ${statusColor};">
          ${check.code ? `
            <div style="margin-bottom: ${check.details || check.recommendation ? "8px" : "0"};">
              <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Code d'erreur</div>
              <div style="font-family: 'Courier New', monospace; font-size: 12px; color: ${statusColor}; font-weight: 600; padding: 4px 8px; background: rgba(0,0,0,0.4); border-radius: 4px; display: inline-block;">
                ${check.code}
              </div>
            </div>
          ` : ""}
          ${check.details ? `
            <div style="margin-bottom: ${check.recommendation ? "8px" : "0"};">
              <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">Détails techniques</div>
              <div style="font-family: 'Courier New', monospace; font-size: 11px; color: var(--ic-text, #e7ecef); background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; line-height: 1.4;">
                ${check.details.length > 500 ? check.details.substring(0, 500) + "..." : check.details}
              </div>
            </div>
          ` : ""}
          ${check.recommendation ? `
            <div>
              <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">💡 Recommandation</div>
              <div style="font-size: 12px; color: var(--ic-text, #e7ecef); padding: 8px; background: rgba(123, 44, 255, 0.1); border-radius: 4px; border-left: 2px solid #7b2cff; line-height: 1.5;">
                ${check.recommendation}
              </div>
            </div>
          ` : ""}
        </div>
      ` : ""}
    `;
    
    checksList.appendChild(checkCard);
  });
  
  verificationContent.appendChild(checksList);

  // Contenu de l'onglet Code d'erreurs
  const errorCodesContent = document.createElement("div");
  errorCodesContent.id = "error-codes-content";
  errorCodesContent.style.cssText = `
    display: none;
    flex-direction: column;
    gap: 20px;
  `;

  // Définition complète de tous les codes d'erreurs
  const allErrorCodes = [
    // Erreurs de Session
    { code: "ERR_NO_SESSION", type: "ERR", category: "Authentification", description: "Aucune session active dans le système", severity: "critical", solution: "Déconnectez-vous et reconnectez-vous pour créer une nouvelle session" },
    { code: "ERR_INVALID_TOKEN", type: "ERR", category: "Authentification", description: "Token de session invalide ou manquant", severity: "critical", solution: "Déconnectez-vous et reconnectez-vous pour obtenir un nouveau token" },
    { code: "ERR_SESSION_EXPIRED", type: "ERR", category: "Authentification", description: "La session a expiré", severity: "high", solution: "Déconnectez-vous et reconnectez-vous pour créer une nouvelle session" },
    { code: "ERR_SESSION_READ", type: "ERR", category: "Authentification", description: "Erreur de lecture des données de session", severity: "high", solution: "Vérifiez les logs de l'application pour plus de détails" },
    
    // Erreurs de Storage
    { code: "ERR_STORAGE_RW", type: "ERR", category: "Storage", description: "Échec d'écriture/lecture dans localStorage", severity: "critical", solution: "Videz le cache du navigateur ou utilisez un navigateur différent" },
    { code: "ERR_STORAGE_FULL", type: "ERR", category: "Storage", description: "Le stockage localStorage est presque plein (>90%)", severity: "high", solution: "Supprimez les données inutilisées ou videz le cache du navigateur" },
    { code: "WARN_STORAGE_HIGH", type: "WARN", category: "Storage", description: "Utilisation élevée du stockage localStorage (>75%)", severity: "medium", solution: "Surveillez l'utilisation du stockage et nettoyez régulièrement" },
    { code: "ERR_STORAGE_UNAVAILABLE", type: "ERR", category: "Storage", description: "localStorage non disponible", severity: "critical", solution: "Assurez-vous que votre navigateur supporte localStorage et n'est pas en mode privé" },
    
    // Erreurs de Modules
    { code: "WARN_NO_MODULES", type: "WARN", category: "Modules", description: "Aucun module enregistré dans le système", severity: "medium", solution: "Vérifiez la configuration des modules dans la page Management" },
    { code: "ERR_CORE_DISABLED", type: "ERR", category: "Modules", description: "Le module core-system est désactivé", severity: "critical", solution: "Activez immédiatement le module core-system dans la page Management" },
    { code: "ERR_MODULES_READ", type: "ERR", category: "Modules", description: "Erreur de lecture des modules système", severity: "high", solution: "Vérifiez l'intégrité des données des modules dans localStorage" },
    
    // Erreurs RBAC
    { code: "ERR_NO_ROLE", type: "ERR", category: "RBAC", description: "Aucun rôle utilisateur défini", severity: "critical", solution: "Déconnectez-vous et reconnectez-vous pour obtenir un rôle valide" },
    { code: "WARN_INVALID_ROLE", type: "WARN", category: "RBAC", description: "Rôle utilisateur invalide ou non reconnu", severity: "medium", solution: "Contactez l'administrateur pour corriger votre rôle" },
    { code: "ERR_RBAC_CHECK", type: "ERR", category: "RBAC", description: "Erreur lors de la vérification RBAC", severity: "high", solution: "Vérifiez les logs système pour plus de détails" },
    
    // Erreurs Safe Mode
    { code: "WARN_SAFE_MODE", type: "WARN", category: "Safe Mode", description: "Safe Mode est actif (mode lecture seule)", severity: "low", solution: "Si nécessaire, désactivez Safe Mode dans la page Système pour permettre les modifications" },
    { code: "ERR_SAFE_MODE_CHECK", type: "ERR", category: "Safe Mode", description: "Erreur de vérification Safe Mode", severity: "medium", solution: "Vérifiez la configuration Safe Mode dans la page Système" },
    { code: "WARN_SAFE_MODE_WRITE_BLOCKED", type: "WARN", category: "Safe Mode", description: "Tentative d'écriture bloquée par Safe Mode", severity: "low", solution: "Désactivez Safe Mode pour permettre les modifications" },
    { code: "ERR_SAFE_MODE_WRITE_BLOCKED", type: "ERR", category: "Safe Mode", description: "Écriture bloquée par Safe Mode en mode strict", severity: "high", solution: "Désactivez Safe Mode ou passez en mode non-strict" },
    
    // Erreurs de Santé
    { code: "ERR_HEALTH_ERROR", type: "ERR", category: "Santé", description: "Le système de santé rapporte une erreur", severity: "high", solution: "Vérifiez les métriques système et consultez les logs pour identifier la cause" },
    { code: "WARN_HEALTH_WARNING", type: "WARN", category: "Santé", description: "Le système de santé rapporte un avertissement", severity: "medium", solution: "Surveillez les métriques système et prenez des mesures préventives si nécessaire" },
    { code: "WARN_HEALTH_UNAVAILABLE", type: "WARN", category: "Santé", description: "Le monitoring de santé n'est pas disponible", severity: "low", solution: "Vérifiez que le module de monitoring est correctement initialisé" },
    
    // Erreurs de Métriques
    { code: "WARN_METRICS_UNAVAILABLE", type: "WARN", category: "Métriques", description: "Le système de métriques n'est pas disponible", severity: "low", solution: "Attendez quelques secondes et actualisez la page" },
    { code: "ERR_RESOURCES_CRITICAL", type: "ERR", category: "Métriques", description: "Utilisation critique des ressources (>90% CPU ou mémoire)", severity: "critical", solution: "Fermez les onglets inutiles, redémarrez l'application ou contactez l'administrateur système" },
    { code: "WARN_RESOURCES_HIGH", type: "WARN", category: "Métriques", description: "Utilisation élevée des ressources (>75% CPU ou >80% mémoire)", severity: "medium", solution: "Surveillez l'utilisation des ressources et libérez de la mémoire si possible" },
    
    // Erreurs d'Abonnements
    { code: "WARN_SUBSCRIPTIONS_UNAVAILABLE", type: "WARN", category: "Abonnements", description: "Le gestionnaire d'abonnements n'est pas disponible", severity: "low", solution: "Vérifiez que le module d'abonnements est correctement initialisé" },
    
    // Erreurs de Cache
    { code: "WARN_CACHE_UNAVAILABLE", type: "WARN", category: "Cache", description: "Le système de cache n'est pas disponible", severity: "low", solution: "Cela peut être normal au démarrage" },
    
    // Erreurs de Sécurité
    { code: "WARN_HIGH_ATTEMPTS", type: "WARN", category: "Sécurité", description: "Trop de tentatives récentes détectées (>100/minute)", severity: "medium", solution: "Réduisez la fréquence des requêtes ou vérifiez s'il n'y a pas d'attaque" },
    { code: "WARN_SECURITY_UNAVAILABLE", type: "WARN", category: "Sécurité", description: "Le système de sécurité n'est pas disponible", severity: "low", solution: "Vérifiez que le module de sécurité est correctement initialisé" },
    
    // Erreurs d'Audit
    { code: "WARN_NO_AUDIT_LOGS", type: "WARN", category: "Audit", description: "Aucun log d'audit disponible", severity: "low", solution: "Cela peut être normal si l'application vient d'être démarrée" },
    { code: "ERR_RECENT_ERRORS", type: "ERR", category: "Audit", description: "Trop d'erreurs récentes dans les logs (>10/heure)", severity: "high", solution: "Consultez la page Logs pour voir les détails des erreurs et prendre les mesures correctives" },
    { code: "WARN_RECENT_ERRORS", type: "WARN", category: "Audit", description: "Plusieurs erreurs récentes dans les logs (>5/heure)", severity: "medium", solution: "Surveillez les logs et consultez la page Logs pour plus de détails" },
    { code: "WARN_AUDIT_UNAVAILABLE", type: "WARN", category: "Audit", description: "Le système d'audit n'est pas disponible", severity: "low", solution: "Vérifiez que le système d'audit est correctement initialisé" },
    
    // Erreurs Réseau
    { code: "ERR_OFFLINE", type: "ERR", category: "Réseau", description: "Connexion réseau hors ligne", severity: "critical", solution: "Vérifiez votre connexion internet et que le navigateur n'est pas en mode hors ligne" },
    { code: "WARN_CONNECTIVITY_CHECK", type: "WARN", category: "Réseau", description: "Impossible de vérifier la connectivité réseau", severity: "low", solution: "Vérifiez manuellement votre connexion réseau" },
    
    // Erreurs Kernel
    { code: "ERR_KERNEL_BOOT_FAILED", type: "ERR", category: "Kernel", description: "Échec du démarrage du kernel", severity: "critical", solution: "Vérifiez la configuration du kernel et consultez les logs de démarrage" },
    { code: "ERR_CONTRACT_MISSING", type: "ERR", category: "Kernel", description: "Contrat manquant ou invalide", severity: "high", solution: "Vérifiez que tous les contrats requis sont présents et valides" },
    { code: "ERR_INVALID_CONFIG", type: "ERR", category: "Kernel", description: "Configuration système invalide", severity: "high", solution: "Vérifiez la configuration système dans les fichiers de configuration" },
    { code: "ERR_UNAUTHORIZED", type: "ERR", category: "Kernel", description: "Accès non autorisé", severity: "high", solution: "Vérifiez vos credentials et permissions" },
    { code: "ERR_FORBIDDEN", type: "ERR", category: "Kernel", description: "Accès interdit", severity: "high", solution: "Contactez l'administrateur pour obtenir les permissions nécessaires" },
    { code: "ERR_NOT_FOUND", type: "ERR", category: "Kernel", description: "Ressource non trouvée", severity: "medium", solution: "Vérifiez que la ressource existe et que le chemin est correct" },
    { code: "ERR_STORAGE_FAILURE", type: "ERR", category: "Kernel", description: "Échec d'accès au stockage", severity: "critical", solution: "Vérifiez l'état du stockage et les permissions d'accès" },
    { code: "ERR_NETWORK_FAILURE", type: "ERR", category: "Kernel", description: "Échec réseau", severity: "critical", solution: "Vérifiez la connexion réseau et l'état des services" },
    { code: "ERR_EVENT_BUS_FAILURE", type: "ERR", category: "Kernel", description: "Échec du bus d'événements", severity: "high", solution: "Redémarrez le bus d'événements ou vérifiez sa configuration" },
    { code: "ERR_FEATURE_FLAG_INVALID", type: "ERR", category: "Kernel", description: "Feature flag invalide", severity: "medium", solution: "Vérifiez la configuration des feature flags" },
    { code: "ERR_SAFE_RENDER_FAILURE", type: "ERR", category: "Kernel", description: "Échec du rendu sécurisé", severity: "high", solution: "Vérifiez les logs de rendu et les composants concernés" },
    { code: "ERR_TELEMETRY_FAILURE", type: "ERR", category: "Kernel", description: "Échec de la télémétrie", severity: "low", solution: "Vérifiez la configuration de la télémétrie" },
    { code: "ERR_POLICY_ENGINE_FAILURE", type: "ERR", category: "Kernel", description: "Échec du moteur de politique", severity: "high", solution: "Vérifiez la configuration des politiques" },
    { code: "ERR_SAFE_MODE_FAILURE", type: "ERR", category: "Kernel", description: "Échec du Safe Mode", severity: "critical", solution: "Vérifiez la configuration du Safe Mode" },
    { code: "WARN_DEGRADED_MODE", type: "WARN", category: "Kernel", description: "Le système fonctionne en mode dégradé", severity: "medium", solution: "Vérifiez les logs pour identifier la cause de la dégradation" },
    { code: "WARN_FEATURE_FLAG_FALLBACK", type: "WARN", category: "Kernel", description: "Feature flag en mode fallback", severity: "low", solution: "Vérifiez la configuration des feature flags" },
    { code: "WARN_POLICY_DEFAULT", type: "WARN", category: "Kernel", description: "Politique par défaut utilisée", severity: "low", solution: "Configurez les politiques appropriées" },
    { code: "WARN_SAFE_RENDER_RECOVERED", type: "WARN", category: "Kernel", description: "Rendu sécurisé récupéré après erreur", severity: "low", solution: "Surveillez les logs pour identifier la cause initiale" },
    { code: "WARN_EVENT_DROPPED", type: "WARN", category: "Kernel", description: "Événement ignoré par le bus", severity: "low", solution: "Vérifiez la configuration du bus d'événements" },
    { code: "WARN_TELEMETRY_PARTIAL", type: "WARN", category: "Kernel", description: "Télémétrie partielle", severity: "low", solution: "Vérifiez la configuration de la télémétrie" },
    
    // Erreurs Version/Policy
    { code: "ERR_VERSION_HARD_BLOCK", type: "ERR", category: "Version", description: "Version bloquée par politique stricte", severity: "critical", solution: "Mettez à jour la version de l'application" },
    { code: "ERR_MAINTENANCE_MODE", type: "ERR", category: "Version", description: "Application en mode maintenance", severity: "high", solution: "Attendez la fin de la maintenance" },
    { code: "WARN_VERSION_SOFT_BLOCK", type: "WARN", category: "Version", description: "Mise à jour recommandée", severity: "low", solution: "Mettez à jour la version de l'application" },
    { code: "WARN_POLICY_INVALID", type: "WARN", category: "Version", description: "Politique invalide", severity: "medium", solution: "Vérifiez la configuration de la politique" },
    
    // Erreurs Feature Flags
    { code: "WARN_FLAG_META_INVALID", type: "WARN", category: "Feature Flags", description: "Métadonnées de feature flag invalides", severity: "low", solution: "Vérifiez la configuration des métadonnées" },
    { code: "WARN_FLAG_EXPIRED", type: "WARN", category: "Feature Flags", description: "Feature flag expiré", severity: "low", solution: "Renouvelez ou supprimez le feature flag expiré" },
    { code: "WARN_FLAG_OWNER_MISSING", type: "WARN", category: "Feature Flags", description: "Propriétaire du feature flag manquant", severity: "low", solution: "Ajoutez un propriétaire au feature flag" },
    { code: "WARN_FLAGS_FORCED_OFF", type: "WARN", category: "Feature Flags", description: "Feature flags forcés en mode OFF", severity: "low", solution: "Vérifiez la configuration globale des feature flags" },
    { code: "WARN_FLAG_INVALID", type: "WARN", category: "Feature Flags", description: "Feature flag invalide", severity: "low", solution: "Vérifiez la configuration du feature flag" },
    { code: "WARN_FLAG_UNKNOWN", type: "WARN", category: "Feature Flags", description: "Feature flag inconnu", severity: "low", solution: "Vérifiez que le feature flag existe et est correctement enregistré" },
    
    // Erreurs Rendering
    { code: "ERR_RENDER_BLOCKED", type: "ERR", category: "Rendering", description: "Rendu bloqué par politique", severity: "high", solution: "Vérifiez les permissions de rendu" },
    { code: "ERR_INVALID_INPUT", type: "ERR", category: "Rendering", description: "Entrée invalide pour le rendu", severity: "medium", solution: "Vérifiez les données d'entrée" },
    { code: "ERR_INTERNAL", type: "ERR", category: "Rendering", description: "Erreur interne du système de rendu", severity: "high", solution: "Contactez le support technique" },
    { code: "ERR_INVALID_BLOCK", type: "ERR", category: "Rendering", description: "Bloc de rendu invalide", severity: "medium", solution: "Vérifiez la structure du bloc" },
    { code: "WARN_REGISTRY_MISS", type: "WARN", category: "Rendering", description: "Composant manquant dans le registry", severity: "low", solution: "Enregistrez le composant dans le registry" },
    { code: "WARN_REGISTRY_THROW", type: "WARN", category: "Rendering", description: "Erreur lors de l'accès au registry", severity: "medium", solution: "Vérifiez l'état du registry" },
    
    // Erreurs Routes
    { code: "WARN_ROUTE_IMPORT_FAILED", type: "WARN", category: "Routes", description: "Échec d'importation d'une route", severity: "medium", solution: "Vérifiez que le module de route est correctement configuré" },
    { code: "WARN_RUNTIME_SMOKE_ROUTE", type: "WARN", category: "Routes", description: "Erreur dans le runtime smoke pour les routes", severity: "low", solution: "Vérifiez la configuration des routes" },
    { code: "WARN_MAIN_SYSTEM_ROUTE", type: "WARN", category: "Routes", description: "Erreur dans la route principale du système", severity: "medium", solution: "Vérifiez la configuration de la route principale" },
    
    // Erreurs Branding
    { code: "WARN_BRAND_FALLBACK", type: "WARN", category: "Branding", description: "Utilisation du branding par défaut", severity: "low", solution: "Configurez le branding personnalisé" },
    { code: "WARN_BRAND_TITLE_FAILED", type: "WARN", category: "Branding", description: "Échec de chargement du titre de marque", severity: "low", solution: "Vérifiez la configuration du titre" },
    { code: "WARN_LOGO_INIT_FAILED", type: "WARN", category: "Branding", description: "Échec d'initialisation du logo", severity: "low", solution: "Vérifiez les fichiers de logo" },
    
    // Erreurs Obs
    { code: "WARN_SECTION_BLOCKED", type: "WARN", category: "Obs", description: "Section bloquée par RBAC", severity: "low", solution: "Vérifiez vos permissions d'accès" },
    { code: "WARN_SECTION_CRASH", type: "WARN", category: "Obs", description: "Section en erreur", severity: "medium", solution: "Consultez les logs pour identifier la cause" },
    { code: "WARN_ACTION_BLOCKED", type: "WARN", category: "Obs", description: "Action bloquée", severity: "low", solution: "Vérifiez vos permissions pour cette action" },
    { code: "WARN_EXPORT_EMPTY", type: "WARN", category: "Obs", description: "Export vide", severity: "low", solution: "Vérifiez qu'il y a des données à exporter" },
    { code: "WARN_ACTION_EXECUTED", type: "WARN", category: "Obs", description: "Action exécutée (informational)", severity: "info", solution: "Aucune action requise" },
    { code: "ERR_ACTION_FAILED", type: "ERR", category: "Obs", description: "Action échouée", severity: "high", solution: "Consultez les logs pour identifier la cause" },
    { code: "INFO_WRITE_OK", type: "INFO", category: "Obs", description: "Écriture réussie (informational)", severity: "info", solution: "Aucune action requise" },
    
    // Erreurs Entitlements
    { code: "WARN_ENTITLEMENTS_MISSING_PRO", type: "WARN", category: "Entitlements", description: "Entitlements Pro manquants", severity: "low", solution: "Vérifiez votre abonnement Pro" },
    { code: "WARN_ACCESS_DENIED_ENTITLEMENT", type: "WARN", category: "Entitlements", description: "Accès refusé par entitlement", severity: "medium", solution: "Vérifiez vos entitlements" },
    
    // Erreurs divers
    { code: "ERR_CHECK_FAILED", type: "ERR", category: "Général", description: "Échec de vérification système", severity: "medium", solution: "Vérifiez les logs système pour plus de détails" },
    { code: "WARN_DEV_LOGIN_FAILED", type: "WARN", category: "Dev", description: "Échec de connexion en mode développement", severity: "low", solution: "Vérifiez les credentials de développement" },
    { code: "WARN_KEYBOARD_SHORTCUTS_INIT_FAILED", type: "WARN", category: "Dev", description: "Échec d'initialisation des raccourcis clavier", severity: "low", solution: "Vérifiez la configuration des raccourcis" },
    { code: "WARN_VERSION_GATE_CHECK_FAILED", type: "WARN", category: "Version", description: "Échec de vérification de version", severity: "low", solution: "Vérifiez la configuration de version" },
    { code: "WARN_RUNTIME_SMOKE_TOGGLE", type: "WARN", category: "Dev", description: "Erreur dans le toggle du runtime smoke", severity: "low", solution: "Vérifiez la configuration du runtime smoke" },
    { code: "WARN_MKRUNTIME_CONTRACT", type: "WARN", category: "Dev", description: "Avertissement du contrat mkRuntime", severity: "low", solution: "Vérifiez le contrat mkRuntime" }
  ];

  // Affichage des codes d'erreurs par catégorie
  const categories = Array.from(new Set(allErrorCodes.map(e => e.category))).sort();
  
  categories.forEach(category => {
    const categoryDiv = document.createElement("div");
    categoryDiv.style.cssText = `
      margin-bottom: 24px;
      padding: 20px;
      background: var(--ic-card, #1a1d1f);
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 8px;
    `;
    
    const categoryTitle = document.createElement("div");
    categoryTitle.style.cssText = `
      font-size: 18px;
      font-weight: 700;
      color: var(--ic-text, #e7ecef);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--ic-border, #2b3136);
    `;
    categoryTitle.textContent = category;
    categoryDiv.appendChild(categoryTitle);
    
    const categoryCodes = allErrorCodes.filter(e => e.category === category);
    const codesList = document.createElement("div");
    codesList.style.cssText = `
      display: grid;
      gap: 12px;
    `;
    
    categoryCodes.forEach(errorCode => {
      const codeCard = document.createElement("div");
      codeCard.style.cssText = `
        padding: 12px 16px;
        background: rgba(0,0,0,0.2);
        border-left: 3px solid ${errorCode.type === "ERR" ? "#f48771" : errorCode.type === "WARN" ? "#f59e0b" : "#3b82f6"};
        border-radius: 4px;
      `;
      
      const severityColor = {
        "critical": "#f48771",
        "high": "#f87171",
        "medium": "#f59e0b",
        "low": "#818cf8",
        "info": "#3b82f6"
      }[errorCode.severity] || "#a7b0b7";
      
      codeCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700; color: ${errorCode.type === "ERR" ? "#f48771" : errorCode.type === "WARN" ? "#f59e0b" : "#3b82f6"};">
                ${errorCode.code}
              </span>
              <span style="padding: 2px 8px; background: ${severityColor}20; color: ${severityColor}; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase;">
                ${errorCode.severity}
              </span>
            </div>
            <div style="color: var(--ic-text, #e7ecef); font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
              ${errorCode.description}
            </div>
            <div style="padding: 8px; background: rgba(123, 44, 255, 0.1); border-left: 2px solid #7b2cff; border-radius: 4px; margin-top: 8px;">
              <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600;">💡 Solution</div>
              <div style="color: var(--ic-text, #e7ecef); font-size: 12px; line-height: 1.5;">
                ${errorCode.solution}
              </div>
            </div>
          </div>
        </div>
      `;
      
      codesList.appendChild(codeCard);
    });
    
    categoryDiv.appendChild(codesList);
    errorCodesContent.appendChild(categoryDiv);
  });

  // Gestion du changement d'onglet
  const switchTab = (tab: string) => {
    currentTab = tab;
    if (tab === "verification") {
      verificationContent.style.display = "flex";
      errorCodesContent.style.display = "none";
      verificationTab.style.color = "#e7ecef";
      verificationTab.style.borderBottomColor = "#3b82f6";
      errorCodesTab.style.color = "#a7b0b7";
      errorCodesTab.style.borderBottomColor = "transparent";
    } else {
      verificationContent.style.display = "none";
      errorCodesContent.style.display = "flex";
      verificationTab.style.color = "#a7b0b7";
      verificationTab.style.borderBottomColor = "transparent";
      errorCodesTab.style.color = "#e7ecef";
      errorCodesTab.style.borderBottomColor = "#3b82f6";
    }
  };
  
  verificationTab.onclick = () => switchTab("verification");
  errorCodesTab.onclick = () => switchTab("error-codes");
  
  contentWrapper.appendChild(verificationContent);
  contentWrapper.appendChild(errorCodesContent);
  container.appendChild(contentWrapper);

  return container;
}

/**
 * ICONTROL_DASHBOARD_KPI_V1
 * Vue Exécutive avec 4 cartes KPI: Santé Système, Activité, Erreurs, Modules
 */
async function createKPIDashboard(): Promise<HTMLElement> {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
    background: transparent;
  `;

  // Grille 2x2 pour les 4 cartes KPI
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 16px;
    flex: 1;
    min-height: 600px;
  `;

  // Afficher skeleton loaders pendant chargement
  const skeletons = Array.from({ length: 4 }, () => {
    const skeleton = createCardSkeleton();
    grid.appendChild(skeleton);
    return skeleton;
  });
  container.appendChild(grid);

  // Charger les données en arrière-plan
  Promise.all([
    createHealthSystemCard(),
    createActivityCard(),
    createErrorsCard(),
    createModulesCard()
  ]).then(cards => {
    // Remplacer skeletons par vraies cartes
    grid.innerHTML = "";
    cards.forEach(card => grid.appendChild(card));
  });

  return container;
}

// Carte 1: Santé Système
async function createHealthSystemCard(): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.style.cssText = PANEL_STYLE;
  card.onclick = () => navigate("#/system");

  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const title = document.createElement("div");
  title.textContent = "Santé Système";
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  header.appendChild(title);
  card.appendChild(header);

  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  try {
    const { systemMetrics } = await import("/src/core/monitoring/systemMetrics");
    const metrics = systemMetrics.getLatestMetrics();
    
    if (!metrics) {
      content.innerHTML = "<div style='color:var(--ic-mutedText,#a7b0b7);'>Métriques non disponibles</div>";
      card.appendChild(content);
      return card;
    }

    const cpuPercent = Math.round(metrics.performance.cpu.usage || 0);
    const memPercent = Math.round(metrics.performance.memory.percentage || 0);
    const responseTime = metrics.performance.responseTime || 0;

    const cpuColor = cpuPercent < 50 ? "#34d399" : cpuPercent < 80 ? "#f59e0b" : "#ef4444";
    const memColor = memPercent < 50 ? "#34d399" : memPercent < 80 ? "#f59e0b" : "#ef4444";
    const respColor = responseTime < 100 ? "#34d399" : responseTime < 500 ? "#f59e0b" : "#ef4444";

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: ${cpuColor}; margin-bottom: 4px;">${cpuPercent}%</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 8px;">CPU</div>
          <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${cpuPercent}%; background: ${cpuColor}; transition: width 0.3s;"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: ${memColor}; margin-bottom: 4px;">${memPercent}%</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 8px;">Mémoire</div>
          <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
            <div style="height: 100%; width: ${memPercent}%; background: ${memColor}; transition: width 0.3s;"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: ${respColor}; margin-bottom: 4px;">${responseTime}ms</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 8px;">Temps réponse</div>
          <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;"></div>
        </div>
      </div>
      <div id="health-chart-container" style="margin-top: 16px;">
        <!-- Graphique sera injecté ici -->
      </div>
    `;

    // Créer graphique en ligne pour CPU/Memory/Latency
    const chartContainer = content.querySelector("#health-chart-container") as HTMLElement;
    if (chartContainer) {
      // Générer données simulées pour le graphique (30 points)
      const chartData = Array.from({ length: 30 }, (_, i) => {
        const base = i / 30;
        return {
          cpu: cpuPercent + Math.sin(base * Math.PI * 2) * 10,
          mem: memPercent + Math.cos(base * Math.PI * 2) * 10,
          resp: responseTime + Math.sin(base * Math.PI * 2) * 50
        };
      });
      
      const labels = chartData.map((_, i) => `${i * 8}:00`);
      const cpuValues = chartData.map(d => Math.max(0, Math.min(100, d.cpu)));
      const cpuChart = createLineChart(
        { labels, values: cpuValues },
        { width: 400, height: 120, color: "#4ec9b0", showGrid: true, showLabels: true }
      );
      chartContainer.appendChild(cpuChart);
    }

    // Tooltips sur les métriques
    const cpuDiv = content.querySelector("div > div:first-child") as HTMLElement;
    const memDiv = content.querySelector("div > div:nth-child(2)") as HTMLElement;
    const respDiv = content.querySelector("div > div:nth-child(3)") as HTMLElement;
    if (cpuDiv) addTooltipToElement(cpuDiv, `Utilisation CPU: ${cpuPercent}%`, "top");
    if (memDiv) addTooltipToElement(memDiv, `Utilisation mémoire: ${memPercent}%`, "top");
    if (respDiv) addTooltipToElement(respDiv, `Temps de réponse moyen: ${responseTime}ms`, "top");
  } catch (error) {
    content.innerHTML = `<div style='color:var(--ic-mutedText,#a7b0b7);'>Erreur chargement métriques: ${String(error)}</div>`;
  }

  card.appendChild(content);
  return card;
}

// Carte 2: Activité
async function createActivityCard(): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.style.cssText = PANEL_STYLE;

  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const title = document.createElement("div");
  title.textContent = "Activité";
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  header.appendChild(title);
  card.appendChild(header);

  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  // Données simulées (à remplacer par vraies métriques)
  const activity = { total: "195.4k", api: "17.8K", latency: "1.2k" };

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(52, 211, 153, 0.1); border-radius: 6px; border-left: 3px solid #34d399;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #34d399;">${activity.total}</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">Activité (24h)</div>
        </div>
        <div id="sparkline-total" style="display: inline-block; vertical-align: middle;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border-left: 3px solid #3b82f6;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${activity.api}</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">Retours API</div>
        </div>
        <div id="sparkline-api" style="display: inline-block; vertical-align: middle;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(123, 44, 255, 0.1); border-radius: 6px; border-left: 3px solid #7b2cff;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #7b2cff;">${activity.latency}</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">Latence</div>
        </div>
        <div id="sparkline-latency" style="display: inline-block; vertical-align: middle;"></div>
      </div>
      <div id="activity-chart-container" style="margin-top: 8px;">
        <!-- Graphique sera injecté ici -->
      </div>
    </div>
  `;

  // Injecter les graphiques sparkline après création du HTML
  const sparklineTotal = content.querySelector("#sparkline-total");
  const sparklineApi = content.querySelector("#sparkline-api");
  const sparklineLatency = content.querySelector("#sparkline-latency");
  
  if (sparklineTotal) {
    const sparkline = createSparkline([10, 20, 15, 25, 20, 30, 25], "#34d399");
    sparklineTotal.appendChild(sparkline);
  }
  if (sparklineApi) {
    const sparkline = createSparkline([5, 12, 8, 15, 10, 18, 12], "#3b82f6");
    sparklineApi.appendChild(sparkline);
  }
  if (sparklineLatency) {
    const sparkline = createSparkline([1, 2, 1.5, 2.5, 2, 3, 2.5], "#7b2cff");
    sparklineLatency.appendChild(sparkline);
  }

  // Créer graphique en ligne pour l'activité
  const activityChartContainer = content.querySelector("#activity-chart-container") as HTMLElement;
  if (activityChartContainer) {
    const activityData = Array.from({ length: 24 }, (_, i) => 100 + Math.sin(i * Math.PI / 12) * 50);
    const activityLabels = activityData.map((_, i) => `${i}:00`);
    const activityChart = createLineChart(
      { labels: activityLabels, values: activityData },
      { width: 400, height: 120, color: "#3b82f6", showGrid: true, showLabels: true }
    );
    activityChartContainer.appendChild(activityChart);
  }

  card.appendChild(content);
  return card;
}

// Carte 3: Erreurs
async function createErrorsCard(): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.style.cssText = PANEL_STYLE;

  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const title = document.createElement("div");
  title.textContent = "Erreurs";
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  header.appendChild(title);
  card.appendChild(header);

  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  try {
    const allLogs = readAuditLog();
    const now = Date.now();
    const warnCount = allLogs.filter(log => log.level === "WARN" && now - new Date(log.ts).getTime() < 3600000).length;
    const errCount = allLogs.filter(log => log.level === "ERR" && now - new Date(log.ts).getTime() < 3600000).length;
    const recentErrors = allLogs.filter(log => log.level === "ERR").slice(-5);

    const isCritical = errCount > 10;

    content.innerHTML = `
      <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">${warnCount}</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">WARN</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: #ef4444; margin-bottom: 4px;">${errCount}</div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">ERR</div>
          ${isCritical ? `<div style="margin-top: 4px;"><span style="padding: 2px 8px; background: #ef4444; color: white; border-radius: 4px; font-size: 10px; font-weight: 600;">CRITIQUE</span></div>` : ""}
        </div>
      </div>
      <div style="margin-bottom: 16px;">
        <button style="width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s;" 
                onmouseenter="this.style.background='#2563eb'" 
                onmouseleave="this.style.background='#3b82f6'"
                onclick="window.location.hash='#/logs'">
          Voir logs
        </button>
      </div>
      ${recentErrors.length > 0 ? `
        <div style="font-size: 12px; font-weight: 600; color: var(--ic-text, #e7ecef); margin-bottom: 8px;">Dernières erreurs:</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${recentErrors.map(err => `
            <div style="padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px; font-size: 11px;">
              <div style="color: #ef4444; font-weight: 600;">${err.code || "ERR"}</div>
              <div style="color: var(--ic-mutedText, #a7b0b7); margin-top: 2px;">${err.message || "Aucun message"}</div>
            </div>
          `).join("")}
        </div>
      ` : ""}
    `;
  } catch (error) {
    content.innerHTML = `<div style='color:var(--ic-mutedText,#a7b0b7);'>Erreur chargement logs: ${String(error)}</div>`;
  }

  card.appendChild(content);
  return card;
}

// Carte 4: Modules
async function createModulesCard(): Promise<HTMLElement> {
  const card = document.createElement("div");
  card.style.cssText = PANEL_STYLE;

  const header = document.createElement("div");
  header.style.cssText = PANEL_HEADER_STYLE;
  const title = document.createElement("div");
  title.textContent = "Modules";
  title.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  header.appendChild(title);
  card.appendChild(header);

  const content = document.createElement("div");
  content.style.cssText = PANEL_CONTENT_STYLE;

  const activeModules = MAIN_SYSTEM_MODULES.filter(m => m.activeDefault).length;
  const inactiveModules = MAIN_SYSTEM_MODULES.length - activeModules;
  const safeMode = getSafeMode();

  content.innerHTML = `
    <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
      <div style="text-align: center;">
        <div style="font-size: 36px; font-weight: 700; color: #34d399; margin-bottom: 4px;">${activeModules}</div>
        <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">Actifs</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 36px; font-weight: 700; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 4px;">${inactiveModules}</div>
        <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">Inactifs</div>
      </div>
    </div>
    ${safeMode?.enabled ? `
      <div style="padding: 10px; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 600; color: #f59e0b; margin-bottom: 4px;">SAFE_MODE Impact</div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">Mode strict actif: certains modules peuvent être affectés</div>
      </div>
    ` : ""}
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${MAIN_SYSTEM_MODULES.map(mod => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
          <span style="font-size: 13px; color: var(--ic-text, #e7ecef);">${mod.label}</span>
          <span style="font-size: 18px; color: ${mod.activeDefault ? "#34d399" : "#a7b0b7"};">${mod.activeDefault ? "✓" : "✗"}</span>
        </div>
      `).join("")}
    </div>
  `;

  card.appendChild(content);
  return card;
}
