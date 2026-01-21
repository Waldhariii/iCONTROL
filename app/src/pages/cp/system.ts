/**
 * ICONTROL_CP_SYSTEM_V3
 * System health & runtime governance (visual-only).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createLineChart, createBarChart } from "/src/core/ui/charts";
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled, demoSeries } from "./_shared/cpDemo";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { getRole } from "/src/runtime/rbac";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/system/contract";

type MetricRow = { key: string; value: string; domain: string; updatedAt: string; status: "OK" | "WARN" | "ERR" };

const DEMO_METRICS: MetricRow[] = [
  { key: "runtime.uptime", value: "99.98%", domain: "runtime", updatedAt: "2024-10-18 09:12", status: "OK" },
  { key: "api.latency.p95", value: "180ms", domain: "runtime", updatedAt: "2024-10-18 09:12", status: "OK" },
  { key: "safe_mode", value: "COMPAT", domain: "governance", updatedAt: "2024-10-18 07:40", status: "WARN" },
  { key: "alerts.pending", value: "12", domain: "security", updatedAt: "2024-10-18 08:20", status: "WARN" },
  { key: "incidents.critical", value: "1", domain: "security", updatedAt: "2024-10-18 06:05", status: "ERR" },
  { key: "feature_flags.active", value: "42", domain: "flags", updatedAt: "2024-10-18 08:55", status: "OK" }
];

export function renderSystemPage(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  const role = getRole();
  const allowed = canAccess(role as any, safeModeValue as any);

  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Système",
    subtitle: "Santé runtime, SAFE_MODE, politiques gouvernées",
    safeMode: safeModeValue,
    statusBadge: { label: allowed ? "GOUVERNÉ" : "ENTITLEMENT REQUIS", tone: allowed ? "info" : "warn" }
  });

  const data = isCpDemoEnabled() ? DEMO_METRICS : DEMO_METRICS;
  const kpis = createKpiStrip([
    { label: "Uptime", value: "99.98%", tone: "ok" },
    { label: "Latence p95", value: "180ms", tone: "ok" },
    { label: "SAFE_MODE", value: safeModeValue, tone: safeModeValue === "STRICT" ? "err" : safeModeValue === "COMPAT" ? "warn" : "ok" },
    { label: "Incidents", value: "1", tone: "err" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: healthCard, body: healthBody } = createSectionCard({
    title: "Health metrics",
    description: "Vue synthétique (lecture seule)"
  });
  healthBody.appendChild(createLineChart(demoSeries(14, 80, 20)));
  healthBody.appendChild(createBarChart(demoSeries(10, 120, 50)));
  grid.appendChild(healthCard);

  const { card: statusCard, body: statusBody } = createSectionCard({
    title: "Status cards",
    description: "Alertes et SAFE_MODE"
  });
  statusBody.appendChild(createBadge(`SAFE_MODE: ${safeModeValue}`, safeModeValue === "STRICT" ? "err" : safeModeValue === "COMPAT" ? "warn" : "ok"));
  statusBody.appendChild(createBadge("AUDIT ENABLED", "info"));
  statusBody.appendChild(createBadge("DEGRADATION: NONE", "ok"));
  grid.appendChild(statusCard);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Metrics runtime",
    description: "Lecture gouvernée"
  });

  if (!allowed) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Entitlement requis",
      message: "Accès gouverné requis pour afficher les métriques."
    }));
  } else {
    const columns: TableColumn<MetricRow>[] = [
      { key: "key", label: "Clé", sortable: true },
      { key: "value", label: "Valeur", sortable: true },
      { key: "domain", label: "Domaine", sortable: true },
      { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "OK" ? "ok" : v === "ERR" ? "err" : "warn") },
      { key: "updatedAt", label: "Mise à jour", sortable: true }
    ];
    tableBody.appendChild(createDataTable({ columns, data, pagination: true, pageSize: 8 }));
  }

  content.appendChild(tableCard);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
