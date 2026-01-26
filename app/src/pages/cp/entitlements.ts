/**
 * ICONTROL_CP_ENTITLEMENTS_V2
 * Entitlements governance page (visual-only, governed actions).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createDonutChart } from "/src/core/ui/charts";
import { createGovernanceFooter, createTwoColumnLayout, createDemoDataBanner, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type EntitlementRow = {
  key: string;
  plan: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  owner: string;
  expiresAt: string;
  scope: string;
};

const DEMO_ENTITLEMENTS: EntitlementRow[] = [
  { key: "pro.analytics", plan: "PRO", status: "ACTIVE", owner: "CP", expiresAt: "2025-02-12", scope: "tenant" },
  { key: "enterprise.sso", plan: "ENTERPRISE", status: "ACTIVE", owner: "Security", expiresAt: "2026-01-01", scope: "global" },
  { key: "pro.audit", plan: "PRO", status: "ACTIVE", owner: "Governance", expiresAt: "2024-12-10", scope: "tenant" },
  { key: "trial.feature-x", plan: "FREE", status: "EXPIRED", owner: "CP", expiresAt: "2024-07-05", scope: "tenant" },
  { key: "legacy.reports", plan: "FREE", status: "INACTIVE", owner: "CP", expiresAt: "—", scope: "tenant" },
  { key: "enterprise.ml", plan: "ENTERPRISE", status: "ACTIVE", owner: "CP", expiresAt: "2026-05-08", scope: "global" },
  { key: "pro.export", plan: "PRO", status: "ACTIVE", owner: "CP", expiresAt: "2025-05-18", scope: "tenant" },
  { key: "compliance.iso", plan: "ENTERPRISE", status: "ACTIVE", owner: "Audit", expiresAt: "2025-11-30", scope: "global" }
];

export function renderEntitlements(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Droits",
    subtitle: "Plans, modules et quotas",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const data = isCpDemoEnabled() ? DEMO_ENTITLEMENTS : DEMO_ENTITLEMENTS;
  const demoBanner = createDemoDataBanner();
  if (demoBanner) content.appendChild(demoBanner);
  const kpis = createKpiStrip([
    { label: "Total", value: String(data.length), tone: "info" },
    { label: "Actifs", value: String(data.filter((e) => e.status === "ACTIVE").length), tone: "ok" },
    { label: "Inactifs", value: String(data.filter((e) => e.status === "INACTIVE").length), tone: "warn" },
    { label: "Expirés", value: String(data.filter((e) => e.status === "EXPIRED").length), tone: "err" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Liste des entitlements",
    description: "Statuts, plans et gouvernance"
  });

  const detailPanel = createDetailsPanel(data[0] || null);

  if (data.length === 0) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Aucun entitlement",
      message: "Aucun entitlement n'est configuré."
    }));
  } else {
    const state = { search: "", status: "" };
    const { element: toolbar } = createToolbar({
      onSearch: (value) => {
        state.search = value;
        renderTable();
      },
      searchPlaceholder: "Rechercher un entitlement...",
      filters: [
        {
          label: "Statut",
          value: state.status,
          options: [
            { value: "", label: "Tous" },
            { value: "ACTIVE", label: "Actif" },
            { value: "INACTIVE", label: "Inactif" },
            { value: "EXPIRED", label: "Expiré" }
          ],
          onChange: (value) => {
            state.status = value;
            renderTable();
          }
        }
      ]
    });
    tableBody.appendChild(toolbar);

    const tableContainer = document.createElement("div");
    tableBody.appendChild(tableContainer);

    const columns: TableColumn<EntitlementRow>[] = [
      { key: "key", label: "Entitlement", sortable: true },
      { key: "plan", label: "Plan", sortable: true, render: (v) => createBadge(String(v), "neutral") },
      { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "ACTIVE" ? "ok" : v === "EXPIRED" ? "err" : "warn") },
      { key: "owner", label: "Propriétaire", sortable: true },
      { key: "expiresAt", label: "Expiration", sortable: true }
    ];

    const renderTable = () => {
      tableContainer.innerHTML = "";
      let rows = [...data];
      if (state.search) {
        const q = state.search.toLowerCase();
        rows = rows.filter((r) => r.key.toLowerCase().includes(q) || r.plan.toLowerCase().includes(q));
      }
      if (state.status) {
        rows = rows.filter((r) => r.status === state.status);
      }
      const table = createDataTable({
        columns,
        data: rows,
        pagination: true,
        pageSize: 8,
        onRowClick: (row) => {
          grid.replaceChild(createDetailsPanel(row), grid.children[1]);
        }
      });
      tableContainer.appendChild(table);
    };
    renderTable();
  }

  grid.appendChild(tableCard);
  grid.appendChild(detailPanel);

  const { card: chartCard, body: chartBody } = createSectionCard({
    title: "Distribution par statut",
    description: "Lecture agrégée (audit visible)"
  });
  chartBody.appendChild(createDonutChart([
    { label: "Actifs", value: data.filter((e) => e.status === "ACTIVE").length, color: "var(--ic-success)" },
    { label: "Inactifs", value: data.filter((e) => e.status === "INACTIVE").length, color: "var(--ic-warn)" },
    { label: "Expirés", value: data.filter((e) => e.status === "EXPIRED").length, color: "var(--ic-error)" }
  ]));
  content.appendChild(chartCard);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}

function createDetailsPanel(entitlement: EntitlementRow | null): HTMLElement {
  const { card, body } = createSectionCard({
    title: "Détails entitlement",
    description: "Panneau gouverné (lecture seule)"
  });

  if (!entitlement) {
    body.appendChild(createEmptyStateCard({
      title: "Aucune sélection",
      message: "Sélectionnez un entitlement pour afficher le détail."
    }));
    return card;
  }

  body.appendChild(createRow("Entitlement", entitlement.key));
  body.appendChild(createRow("Plan", entitlement.plan));
  body.appendChild(createRow("Statut", entitlement.status));
  body.appendChild(createRow("Propriétaire", entitlement.owner));
  body.appendChild(createRow("Scope", entitlement.scope));
  body.appendChild(createRow("Expiration", entitlement.expiresAt));

  const audit = document.createElement("div");
  audit.style.cssText = "margin-top: 10px; font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  audit.textContent = "Audit trail: dernière action gouvernée il y a 2h.";
  body.appendChild(audit);

  return card;
}

function createRow(label: string, value: string): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; justify-content:space-between; gap:12px; font-size:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "color: var(--ic-mutedText, #a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = "color: var(--ic-text, #e7ecef); font-weight: 600;";
  row.appendChild(left);
  row.appendChild(right);
  return row;
}
