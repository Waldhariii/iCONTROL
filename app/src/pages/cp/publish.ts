/**
 * ICONTROL_CP_PUBLISH_V2
 * Release center (visual-only).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createBarChart } from "/src/core/ui/charts";
import { createGovernanceFooter, createTwoColumnLayout, createDemoDataBanner, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type ReleaseRow = { version: string; status: "LIVE" | "READY" | "BLOCKED"; appCompat: string; cpCompat: string; gates: string };

const DEMO_RELEASES: ReleaseRow[] = [
  { version: "0.2.0", status: "LIVE", appCompat: "0.2.x", cpCompat: "0.2.x", gates: "OK" },
  { version: "0.2.1-rc2", status: "READY", appCompat: "0.2.x", cpCompat: "0.2.x", gates: "WARN" },
  { version: "0.3.0-rc1", status: "BLOCKED", appCompat: "0.3.x", cpCompat: "0.3.x", gates: "FAIL" }
];

export function renderPublish(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Publication",
    subtitle: "Versions et déploiement",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const releases = isCpDemoEnabled() ? DEMO_RELEASES : DEMO_RELEASES;
  const demoBanner = createDemoDataBanner();
  if (demoBanner) content.appendChild(demoBanner);
  const kpis = createKpiStrip([
    { label: "Version live", value: "0.2.0", tone: "ok" },
    { label: "Gates OK", value: "12", tone: "ok" },
    { label: "Gates WARN", value: "3", tone: "warn" },
    { label: "Rollbacks", value: "1", tone: "err" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Versions",
    description: "Compatibilités /app ↔ /cp"
  });
  const columns: TableColumn<ReleaseRow>[] = [
    { key: "version", label: "Version", sortable: true },
    { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "LIVE" ? "ok" : v === "READY" ? "warn" : "err") },
    { key: "appCompat", label: "App", sortable: true },
    { key: "cpCompat", label: "CP", sortable: true },
    { key: "gates", label: "Gates", sortable: true }
  ];
  tableBody.appendChild(createDataTable({ columns, data: releases, pagination: true, pageSize: 6 }));
  grid.appendChild(tableCard);

  const { card: detailCard, body: detailBody } = createSectionCard({
    title: "Rollback guard",
    description: "Contraintes de rollback (lecture seule)"
  });
  detailBody.appendChild(createBadge("ROLLBACK GUARD: ACTIVE", "warn"));
  detailBody.appendChild(createBarChart([40, 48, 52, 39, 60, 44, 53]));
  detailBody.appendChild(createBadge("Compat matrix: OK", "ok"));
  grid.appendChild(detailCard);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
