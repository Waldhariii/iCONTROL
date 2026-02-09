import { useTenantContext } from '@/core/tenant/tenantContext';

/**
 * ICONTROL_CP_PAGES_INVENTORY_V3
 * Pages Inventory — Complete listing of all CP pages (active/inactive) from ROUTE_CATALOG and registry
 */
import { coreBaseStyles } from "../../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createGovernanceFooter, mapSafeMode } from "../_shared/cpLayout";
import { getSafeMode } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { getPagesInventory, type PageInventoryEntry } from "/src/core/pagesInventory";

const CP_PAGES = getPagesInventory("CP");

export function renderPages(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Registre des pages",
    subtitle: "Routes et périmètre",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const activeCount = CP_PAGES.filter((p) => p.status === "ACTIVE").length;
  const experimentalCount = CP_PAGES.filter((p) => p.status === "EXPERIMENTAL").length;
  const hiddenCount = CP_PAGES.filter((p) => p.status === "HIDDEN").length;
  const inRegistryCount = CP_PAGES.filter((p) => p.inRegistry).length;
  
  const kpis = createKpiStrip([
    { label: "Total Pages", value: String(CP_PAGES.length), tone: "info" },
    { label: "Active", value: String(activeCount), tone: "ok" },
    { label: "Experimental", value: String(experimentalCount), tone: "warn" },
    { label: "In Registry", value: String(inRegistryCount), tone: inRegistryCount === CP_PAGES.length ? "ok" : "warn" }
  ]);
  content.appendChild(kpis);

  const { card, body } = createSectionCard({
    title: "Pages Inventory — CP",
    description: "Complete listing: Index, PageName, RouteId, Status, SourceFile, DuplicateGroup, Notes"
  });

  const state = { search: "", status: "" };
  const { element: toolbar } = createToolbar({
    onSearch: (value) => {
      state.search = value;
      renderTable();
    },
    searchPlaceholder: "Rechercher une page...",
    filters: [
      {
        label: "Status",
        value: state.status,
        options: [
          { value: "", label: "Tous" },
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "EXPERIMENTAL", label: "EXPERIMENTAL" },
          { value: "HIDDEN", label: "HIDDEN" },
          { value: "UNKNOWN", label: "UNKNOWN" }
        ],
        onChange: (value) => {
          state.status = value;
          renderTable();
        }
      }
    ]
  });
  body.appendChild(toolbar);

  const tableContainer = document.createElement("div");
  body.appendChild(tableContainer);

  const columns: TableColumn<PageInventoryEntry>[] = [
    { key: "index", label: "Index", sortable: true, render: (v) => String(v) },
    { key: "pageName", label: "PageName", sortable: true },
    { key: "routeId", label: "RouteId", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true, 
      render: (v) => {
        const status = String(v);
        const tone = status === "ACTIVE" ? "ok" : status === "EXPERIMENTAL" ? "warn" : status === "HIDDEN" ? "neutral" : "err";
        return createBadge(status, tone);
      }
    },
    { key: "sourceFile", label: "SourceFile", sortable: true },
    { 
      key: "duplicateGroup", 
      label: "DuplicateGroup", 
      sortable: true,
      render: (v) => v ? createBadge(String(v), "warn") : "-"
    },
    { 
      key: "notes", 
      label: "Notes",
      render: (v) => v ? createBadge(String(v), "warn") : "-"
    }
  ];

  const renderTable = () => {
    tableContainer.innerHTML = "";
    let rows = [...CP_PAGES];
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter((r) => 
        r.pageName.toLowerCase().includes(q) ||
        r.routeId.toLowerCase().includes(q) ||
        r.sourceFile.toLowerCase().includes(q)
      );
    }
    if (state.status) {
      rows = rows.filter((r) => r.status === state.status);
    }
    tableContainer.appendChild(createDataTable({ columns, data: rows, pagination: true, pageSize: 15 }));
  };
  renderTable();

  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
