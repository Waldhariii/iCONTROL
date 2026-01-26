/**
 * ICONTROL_CP_AUDIT_V1
 * Audit & compliance (visual-only).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createGovernanceFooter, createTwoColumnLayout, createDemoDataBanner, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { formatDateTime } from "/src/core/utils/dateFormat";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type AuditRow = {
  ts: string;
  level: "INFO" | "WARN" | "ERR";
  action: string;
  actor: string;
  scope: string;
  correlationId: string;
};

const DEMO_AUDIT: AuditRow[] = [
  { ts: "2024-10-18 09:12", level: "INFO", action: "tenant.create", actor: "admin.core", scope: "cp", correlationId: "a-1024" },
  { ts: "2024-10-18 08:40", level: "WARN", action: "flag.rollout", actor: "release.bot", scope: "cp", correlationId: "a-1021" },
  { ts: "2024-10-18 07:15", level: "ERR", action: "policy.violation", actor: "audit.bot", scope: "cp", correlationId: "a-1019" },
  { ts: "2024-10-17 18:22", level: "INFO", action: "subscription.update", actor: "billing.sys", scope: "cp", correlationId: "a-1012" }
];

export function renderAudit(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Audit",
    subtitle: "Traces et conformité",
    safeMode: safeModeValue,
    statusBadge: { label: "READ-ONLY", tone: "info" }
  });

  const data = isCpDemoEnabled() ? DEMO_AUDIT : DEMO_AUDIT;
  const demoBanner = createDemoDataBanner();
  if (demoBanner) content.appendChild(demoBanner);
  const kpis = createKpiStrip([
    { label: "Events (24h)", value: String(data.length), tone: "info" },
    { label: "Violations", value: String(data.filter((r) => r.level === "ERR").length), tone: "err" },
    { label: "Warnings", value: String(data.filter((r) => r.level === "WARN").length), tone: "warn" },
    { label: "Exports", value: "3", tone: "neutral" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Audit log",
    description: "Filtrage, export, détail"
  });

  if (data.length === 0) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Aucun événement",
      message: "Le journal d'audit est vide."
    }));
  } else {
    const state = { search: "", level: "" };
    const { element: toolbar } = createToolbar({
      onSearch: (value) => {
        state.search = value;
        renderTable();
      },
      searchPlaceholder: "Rechercher action ou acteur...",
      filters: [
        {
          label: "Niveau",
          value: state.level,
          options: [
            { value: "", label: "Tous" },
            { value: "INFO", label: "INFO" },
            { value: "WARN", label: "WARN" },
            { value: "ERR", label: "ERR" }
          ],
          onChange: (value) => {
            state.level = value;
            renderTable();
          }
        }
      ]
    });
    tableBody.appendChild(toolbar);

    const tableContainer = document.createElement("div");
    tableBody.appendChild(tableContainer);

    const columns: TableColumn<AuditRow>[] = [
      { key: "ts", label: "Timestamp", sortable: true },
      { key: "level", label: "Niveau", sortable: true, render: (v) => createBadge(String(v), v === "ERR" ? "err" : v === "WARN" ? "warn" : "info") },
      { key: "action", label: "Action", sortable: true },
      { key: "actor", label: "Acteur", sortable: true },
      { key: "correlationId", label: "Correlation ID", sortable: true }
    ];

    const renderTable = () => {
      tableContainer.innerHTML = "";
      let rows = [...data];
      if (state.search) {
        const q = state.search.toLowerCase();
        rows = rows.filter((r) => r.action.toLowerCase().includes(q) || r.actor.toLowerCase().includes(q));
      }
      if (state.level) {
        rows = rows.filter((r) => r.level === state.level);
      }
      tableContainer.appendChild(createDataTable({ columns, data: rows, pagination: true, pageSize: 8 }));
    };
    renderTable();
  }

  const detailPanel = createDetailPanel(data[0] || null);
  grid.appendChild(tableCard);
  grid.appendChild(detailPanel);

  const { card: exportCard, body: exportBody } = createSectionCard({
    title: "Exports",
    description: "Formats disponibles (lecture seule)"
  });
  exportBody.appendChild(createBadge("CSV", "neutral"));
  exportBody.appendChild(createBadge("JSON", "neutral"));
  exportBody.appendChild(createBadge("PDF", "neutral"));
  content.appendChild(exportCard);

  content.appendChild(createGovernanceFooter(data[0]?.ts));
  root.appendChild(shell);
}

function createDetailPanel(row: AuditRow | null): HTMLElement {
  const { card, body } = createSectionCard({
    title: "Détail événement",
    description: "Lecture seule"
  });
  if (!row) {
    body.appendChild(createEmptyStateCard({
      title: "Aucun événement sélectionné",
      message: "Sélectionnez un événement pour afficher le détail."
    }));
    return card;
  }
  body.appendChild(createRow("Timestamp", row.ts));
  body.appendChild(createRow("Niveau", row.level));
  body.appendChild(createRow("Action", row.action));
  body.appendChild(createRow("Acteur", row.actor));
  body.appendChild(createRow("Scope", row.scope));
  body.appendChild(createRow("Correlation ID", row.correlationId));
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
