/**
 * ICONTROL_CP_DASHBOARD_V5
 * Dashboard SSOT — PageShell + KPI grid + événements récents
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { createCardSkeleton } from "/src/core/ui/skeletonLoader";
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
