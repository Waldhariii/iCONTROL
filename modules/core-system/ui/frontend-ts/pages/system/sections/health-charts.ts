// @ts-nocheck
/**
 * Section « Analyse et santé du système » — graphiques CPU, mémoire, latence,
 * requêtes API, santé globale (OK/WARN/ERR) et modules.
 * Appel /api/cp/metrics avec fallback sur métriques de démo.
 */
import { createLineChart, createBarChart, createDonutChart, createGaugeChart } from "/src/core/ui/charts";
import { createSectionCard } from "/src/core/ui/sectionCard";

function demoSeries(length = 12, base = 40, variance = 30): number[] {
  const data: number[] = [];
  let seed = base;
  for (let i = 0; i < length; i += 1) {
    const delta = ((i * 17) % variance) - variance / 2;
    seed = Math.max(0, seed + delta * 0.35);
    data.push(Math.round(seed));
  }
  return data;
}

export type SystemHealthMetrics = {
  cpuPct: number;
  memPct: number;
  latencySeries: number[];
  apiSeries: number[];
  ok24h: number;
  warn24h: number;
  err24h: number;
  modulesActive: number;
  modulesInactive: number;
  lastUpdated: string;
};

const GAUGE_SEGMENTS = [
  { to: 70, color: "var(--ic-success, #4ec9b0)" },
  { to: 85, color: "var(--ic-warn, #f59e0b)" },
  { to: 100, color: "var(--ic-error, #f48771)" }
];

function buildDemoSystemMetrics(): SystemHealthMetrics {
  return {
    cpuPct: 32,
    memPct: 58,
    latencySeries: demoSeries(14, 80, 35),
    apiSeries: demoSeries(10, 120, 50),
    ok24h: 62,
    warn24h: 28,
    err24h: 10,
    modulesActive: 14,
    modulesInactive: 2,
    lastUpdated: new Date().toISOString()
  };
}

async function fetchSystemMetrics(): Promise<SystemHealthMetrics> {
  const demo = buildDemoSystemMetrics();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch("/api/cp/metrics", { headers: { Accept: "application/json" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return demo;
    const raw = (await res.json()) as Record<string, unknown>;
    return {
      cpuPct: Number(raw.cpuPct ?? raw.cpu ?? demo.cpuPct),
      memPct: Number(raw.memPct ?? raw.memoryPct ?? demo.memPct),
      latencySeries: Array.isArray(raw.latencySeries) ? (raw.latencySeries as number[]) : demo.latencySeries,
      apiSeries: Array.isArray(raw.apiSeries) ? (raw.apiSeries as number[]) : demo.apiSeries,
      ok24h: Number(raw.ok24h ?? raw.ok ?? demo.ok24h),
      warn24h: Number(raw.warn24h ?? demo.warn24h),
      err24h: Number(raw.err24h ?? demo.err24h),
      modulesActive: Number(raw.modulesActive ?? demo.modulesActive),
      modulesInactive: Number(raw.modulesInactive ?? demo.modulesInactive),
      lastUpdated: String(raw.lastUpdated ?? raw.lastUpdatedAt ?? demo.lastUpdated)
    };
  } catch {
    return demo; // timeout, réseau ou erreur → démo
  }
}

function renderCharts(container: HTMLElement, data: SystemHealthMetrics): void {
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
  `;

  const { card: resourcesCard, body: resourcesBody } = createSectionCard({
    title: "Ressources",
    description: "CPU et mémoire (seuils: 70% / 85% / 95%)"
  });
  const gaugesRow = document.createElement("div");
  gaugesRow.style.cssText = "display:flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;";
  gaugesRow.appendChild(createGaugeChart(data.cpuPct, 100, { label: "CPU %", segments: GAUGE_SEGMENTS, size: 140 }));
  gaugesRow.appendChild(createGaugeChart(data.memPct, 100, { label: "Mémoire %", segments: GAUGE_SEGMENTS, size: 140 }));
  resourcesBody.appendChild(gaugesRow);
  grid.appendChild(resourcesCard);

  const { card: healthCard, body: healthBody } = createSectionCard({
    title: "Santé globale (24h)",
    description: "Répartition OK / WARN / ERR"
  });
  healthBody.appendChild(createDonutChart([
    { label: "OK", value: data.ok24h, color: "var(--ic-success, #4ec9b0)" },
    { label: "WARN", value: data.warn24h, color: "var(--ic-warn, #f59e0b)" },
    { label: "ERR", value: data.err24h, color: "var(--ic-error, #f48771)" }
  ], { size: 140 }));
  grid.appendChild(healthCard);

  const { card: latencyCard, body: latencyBody } = createSectionCard({
    title: "Latence / performance",
    description: "Temps de réponse dans le temps"
  });
  latencyBody.appendChild(createLineChart(data.latencySeries, { width: 320, height: 140 }));
  grid.appendChild(latencyCard);

  const { card: apiCard, body: apiBody } = createSectionCard({
    title: "Requêtes API",
    description: "Volume de requêtes (période récente)"
  });
  apiBody.appendChild(createBarChart(data.apiSeries, { width: 320, height: 140 }));
  grid.appendChild(apiCard);

  const { card: modulesCard, body: modulesBody } = createSectionCard({
    title: "Modules",
    description: "Actifs / inactifs"
  });
  modulesBody.appendChild(createDonutChart([
    { label: "Actifs", value: data.modulesActive, color: "var(--ic-success, #4ec9b0)" },
    { label: "Inactifs", value: data.modulesInactive, color: "var(--ic-mutedText, #a7b0b7)" }
  ], { size: 140 }));
  grid.appendChild(modulesCard);

  const foot = document.createElement("div");
  foot.style.cssText = "grid-column: 1 / -1; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  foot.textContent = `Dernière mise à jour: ${new Date(data.lastUpdated).toLocaleString()}`;
  grid.appendChild(foot);

  container.appendChild(grid);
}

/**
 * Point d’entrée de la section. Affiche un chargement, appelle /api/cp/metrics
 * puis remplace par les graphiques (ou démo si l’API échoue).
 */
export function renderSystemHealthCharts(host: HTMLElement): void {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-section", "system-health-charts");
  const loading = document.createElement("div");
  loading.style.cssText = "padding: 24px; text-align: center; color: var(--ic-mutedText, #a7b0b7); font-size: 13px;";
  loading.textContent = "Chargement des métriques…";
  wrap.appendChild(loading);
  host.appendChild(wrap);

  fetchSystemMetrics().then((data) => {
    wrap.innerHTML = "";
    renderCharts(wrap, data);
  }).catch(() => {
    wrap.innerHTML = "";
    renderCharts(wrap, buildDemoSystemMetrics());
  });
}
