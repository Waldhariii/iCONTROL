/**
 * ICONTROL_CP_PAGES_V2
 * Registry viewer (visual-only).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createGovernanceFooter, mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type PageRow = { route: string; scope: "APP" | "CP"; tags: string[]; status: "GOVERNED" | "LEGACY" };

const DEMO_PAGES: PageRow[] = [
  { route: "/cp/#/dashboard", scope: "CP", tags: ["governance", "kpi"], status: "GOVERNED" },
  { route: "/cp/#/tenants", scope: "CP", tags: ["tenants", "policy"], status: "GOVERNED" },
  { route: "/cp/#/users", scope: "CP", tags: ["rbac", "security"], status: "GOVERNED" },
  { route: "/app/#/dashboard", scope: "APP", tags: ["client", "workflow"], status: "LEGACY" },
  { route: "/app/#/dossiers", scope: "APP", tags: ["client", "workflow"], status: "LEGACY" }
];

export function renderPages(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Registre des pages",
    subtitle: "Routes et périmètre",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const kpis = createKpiStrip([
    { label: "Pages CP", value: String(DEMO_PAGES.filter((p) => p.scope === "CP").length), tone: "info" },
    { label: "Pages APP", value: String(DEMO_PAGES.filter((p) => p.scope === "APP").length), tone: "neutral" },
    { label: "Governed", value: String(DEMO_PAGES.filter((p) => p.status === "GOVERNED").length), tone: "ok" },
    { label: "Legacy", value: String(DEMO_PAGES.filter((p) => p.status === "LEGACY").length), tone: "warn" }
  ]);
  content.appendChild(kpis);

  const { card, body } = createSectionCard({
    title: "Registry",
    description: "Scope, tags, gouvernance"
  });

  const state = { search: "", scope: "" };
  const { element: toolbar } = createToolbar({
    onSearch: (value) => {
      state.search = value;
      renderTable();
    },
    searchPlaceholder: "Rechercher une route...",
    filters: [
      {
        label: "Scope",
        value: state.scope,
        options: [
          { value: "", label: "Tous" },
          { value: "APP", label: "APP" },
          { value: "CP", label: "CP" }
        ],
        onChange: (value) => {
          state.scope = value;
          renderTable();
        }
      }
    ]
  });
  body.appendChild(toolbar);

  const tableContainer = document.createElement("div");
  body.appendChild(tableContainer);

  const columns: TableColumn<PageRow>[] = [
    { key: "route", label: "Route", sortable: true },
    { key: "scope", label: "Scope", sortable: true, render: (v) => createBadge(String(v), v === "CP" ? "info" : "neutral") },
    { key: "tags", label: "Tags", render: (v) => createBadge(Array.isArray(v) ? v.join(", ") : String(v), "neutral") },
    { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "GOVERNED" ? "ok" : "warn") }
  ];

  const renderTable = () => {
    tableContainer.innerHTML = "";
    let rows = [...DEMO_PAGES];
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter((r) => r.route.toLowerCase().includes(q));
    }
    if (state.scope) {
      rows = rows.filter((r) => r.scope === state.scope);
    }
    tableContainer.appendChild(createDataTable({ columns, data: rows, pagination: true, pageSize: 8 }));
  };
  renderTable();

  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
