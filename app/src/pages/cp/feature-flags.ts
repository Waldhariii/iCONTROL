/**
 * ICONTROL_CP_FEATURE_FLAGS_V2
 * Feature flags governance (visual-only).
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
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type FlagRow = {
  key: string;
  owner: string;
  status: "ON" | "OFF" | "ROLLOUT";
  rollout: string;
  expiry: string;
};

const DEMO_FLAGS: FlagRow[] = [
  { key: "cp.audit.export", owner: "Security", status: "ON", rollout: "100%", expiry: "2025-12-31" },
  { key: "cp.safe_mode_guard", owner: "Governance", status: "ON", rollout: "100%", expiry: "2026-01-01" },
  { key: "cp.release.gates", owner: "Release", status: "ROLLOUT", rollout: "60%", expiry: "2024-11-12" },
  { key: "cp.tenant.billing", owner: "Billing", status: "OFF", rollout: "0%", expiry: "—" },
  { key: "cp.entitlements.rules", owner: "CP", status: "ON", rollout: "100%", expiry: "2025-05-05" },
  { key: "cp.flags.audit", owner: "Audit", status: "ROLLOUT", rollout: "30%", expiry: "2024-12-01" }
];

export function renderFeatureFlags(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Feature Flags",
    subtitle: "Gouvernance des flags et rollouts (lecture seule)",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const data = isCpDemoEnabled() ? DEMO_FLAGS : DEMO_FLAGS;
  const kpis = createKpiStrip([
    { label: "Flags actifs", value: String(data.filter((f) => f.status === "ON").length), tone: "ok" },
    { label: "Rollout", value: String(data.filter((f) => f.status === "ROLLOUT").length), tone: "warn" },
    { label: "Off", value: String(data.filter((f) => f.status === "OFF").length), tone: "neutral" },
    { label: "Expirations proches", value: "2", tone: "warn" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Flags gouvernés",
    description: "Owner, expiry et statut"
  });

  const detailPanel = createDetailsPanel(data[0] || null);

  if (data.length === 0) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Aucun flag",
      message: "Aucun feature flag configuré."
    }));
  } else {
    const state = { search: "", status: "" };
    const { element: toolbar } = createToolbar({
      onSearch: (value) => {
        state.search = value;
        renderTable();
      },
      searchPlaceholder: "Rechercher un flag...",
      filters: [
        {
          label: "Statut",
          value: state.status,
          options: [
            { value: "", label: "Tous" },
            { value: "ON", label: "ON" },
            { value: "OFF", label: "OFF" },
            { value: "ROLLOUT", label: "ROLLOUT" }
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

    const columns: TableColumn<FlagRow>[] = [
      { key: "key", label: "Flag", sortable: true },
      { key: "owner", label: "Owner", sortable: true },
      { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "ON" ? "ok" : v === "ROLLOUT" ? "warn" : "neutral") },
      { key: "rollout", label: "Rollout", sortable: true },
      { key: "expiry", label: "Expiry", sortable: true }
    ];

    const renderTable = () => {
      tableContainer.innerHTML = "";
      let rows = [...data];
      if (state.search) {
        const q = state.search.toLowerCase();
        rows = rows.filter((r) => r.key.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q));
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

  const { card: auditCard, body: auditBody } = createSectionCard({
    title: "Audit flags",
    description: "Derniers changements gouvernés"
  });
  auditBody.appendChild(createDonutChart([
    { label: "ON", value: data.filter((f) => f.status === "ON").length, color: "#4ec9b0" },
    { label: "ROLLOUT", value: data.filter((f) => f.status === "ROLLOUT").length, color: "#f59e0b" },
    { label: "OFF", value: data.filter((f) => f.status === "OFF").length, color: "#9aa4ae" }
  ]));
  content.appendChild(auditCard);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}

function createDetailsPanel(flag: FlagRow | null): HTMLElement {
  const { card, body } = createSectionCard({
    title: "Détails flag",
    description: "Panneau gouverné (lecture seule)"
  });

  if (!flag) {
    body.appendChild(createEmptyStateCard({
      title: "Aucune sélection",
      message: "Sélectionnez un flag pour afficher le détail."
    }));
    return card;
  }

  body.appendChild(createRow("Flag", flag.key));
  body.appendChild(createRow("Owner", flag.owner));
  body.appendChild(createRow("Statut", flag.status));
  body.appendChild(createRow("Rollout", flag.rollout));
  body.appendChild(createRow("Expiry", flag.expiry));

  const hint = document.createElement("div");
  hint.textContent = "Toggles visuels uniquement — actions gouvernées via Core.";
  hint.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); margin-top: 8px;";
  body.appendChild(hint);
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
