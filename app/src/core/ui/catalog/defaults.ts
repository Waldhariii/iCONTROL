import { createBadge, createRoleBadge, createSafeModeBadge } from "../badge";
import { createContextualEmptyState } from "../emptyState";
import { createErrorState } from "../errorState";
import { createPageShell } from "../pageShell";
import { createSectionCard } from "../sectionCard";
import { createDataTable } from "../dataTable";
import { createToolbar } from "../toolbar";
import { showToast } from "../toast";
import { registerComponent } from "./registry";
import { renderAccessDenied } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/renderAccessDenied";

let registered = false;

function sampleRows(count = 6): Array<Record<string, unknown>> {
  return Array.from({ length: count }).map((_, idx) => ({
    id: `row_${idx + 1}`,
    name: ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"][idx % 6],
    status: idx % 2 === 0 ? "active" : "paused",
    updatedAt: `2024-10-${String(idx + 10).padStart(2, "0")}`,
  }));
}

export function registerDefaultCatalogEntries(): void {
  if (registered) return;
  registered = true;

  registerComponent({
    id: "ui.pageShell.basic",
    name: "PageShell / Basic",
    kind: "layout",
    app: "shared",
    supports: ["default", "safeMode", "readOnly"],
    render: (host) => {
      const { shell, content } = createPageShell({
        title: "UI Catalog Shell",
        subtitle: "Standard page container",
        breadcrumbs: ["Catalog", "Layout"],
        statusBadge: { label: "ACTIVE", tone: "ok" },
      });
      content.textContent = "Page content placeholder.";
      host.appendChild(shell);
    },
  });

  registerComponent({
    id: "ui.sectionCard.basic",
    name: "SectionCard / Basic",
    kind: "panel",
    app: "shared",
    render: (host) => {
      const { card, body } = createSectionCard({
        title: "Section Card",
        description: "Standard card with header + body",
      });
      body.innerHTML = "<div>Body content area</div>";
      host.appendChild(card);
    },
  });

  registerComponent({
    id: "ui.sectionCard.actions",
    name: "SectionCard / Actions",
    kind: "panel",
    app: "shared",
    render: (host) => {
      const { card, body } = createSectionCard({
        title: "Actions",
        description: "Header with actions",
        actions: [
          { label: "Primary", onClick: () => {}, primary: true },
          { label: "Secondary", onClick: () => {} },
        ],
      });
      body.innerHTML = "<div>Actionable content</div>";
      host.appendChild(card);
    },
  });

  registerComponent({
    id: "ui.sectionCard.dense",
    name: "SectionCard / Dense",
    kind: "panel",
    app: "shared",
    render: (host) => {
      const { card, body } = createSectionCard({
        title: "Dense Card",
        description: "Compact spacing",
        dense: true,
      });
      body.innerHTML = "<div>Dense body content</div>";
      host.appendChild(card);
    },
  });

  registerComponent({
    id: "ui.sectionCard.collapsible",
    name: "SectionCard / Collapsible",
    kind: "panel",
    app: "shared",
    render: (host) => {
      const { card, body } = createSectionCard({
        title: "Collapsible Card",
        description: "Click header to toggle",
        collapsible: true,
      });
      body.innerHTML = "<div>Toggle visibility</div>";
      host.appendChild(card);
    },
  });

  registerComponent({
    id: "ui.toolbar.search",
    name: "Toolbar / Search + Filters",
    kind: "widget",
    app: "shared",
    render: (host) => {
      const { element } = createToolbar({
        searchPlaceholder: "Search items",
        filters: [
          { label: "Status", options: ["Active", "Paused", "Draft"], value: "" },
          { label: "Owner", options: ["Team A", "Team B"], value: "" },
        ],
        onSearch: () => {},
        onFilterChange: () => {},
      });
      host.appendChild(element);
    },
  });

  registerComponent({
    id: "ui.toolbar.actions",
    name: "Toolbar / Actions",
    kind: "widget",
    app: "shared",
    render: (host) => {
      const { element } = createToolbar({
        actions: [
          { label: "Primary", primary: true, onClick: () => {} },
          { label: "Secondary", onClick: () => {} },
        ],
      });
      host.appendChild(element);
    },
  });

  registerComponent({
    id: "ui.dataTable.basic",
    name: "DataTable / Basic",
    kind: "table",
    app: "shared",
    supports: ["default", "empty"],
    render: (host, ctx) => {
      const data = ctx.state === "empty" ? [] : sampleRows(5);
      const table = createDataTable({
        columns: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" },
        ],
        data,
      });
      host.appendChild(table);
    },
  });

  registerComponent({
    id: "ui.dataTable.searchable",
    name: "DataTable / Searchable",
    kind: "table",
    app: "shared",
    supports: ["default", "empty"],
    render: (host, ctx) => {
      const data = ctx.state === "empty" ? [] : sampleRows(8);
      const table = createDataTable({
        columns: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" },
        ],
        data,
        searchable: true,
      });
      host.appendChild(table);
    },
  });

  registerComponent({
    id: "ui.dataTable.paginated",
    name: "DataTable / Paginated",
    kind: "table",
    app: "shared",
    supports: ["default", "empty"],
    render: (host, ctx) => {
      const data = ctx.state === "empty" ? [] : sampleRows(18);
      const table = createDataTable({
        columns: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" },
        ],
        data,
        pagination: true,
        pageSize: 6,
      });
      host.appendChild(table);
    },
  });

  registerComponent({
    id: "ui.dataTable.actions",
    name: "DataTable / Actions",
    kind: "table",
    app: "shared",
    supports: ["default", "empty"],
    render: (host, ctx) => {
      const data = ctx.state === "empty" ? [] : sampleRows(6);
      const table = createDataTable({
        columns: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
        ],
        data,
        actions: () => [
          { label: "Edit", onClick: () => {} },
          { label: "Remove", onClick: () => {} },
        ],
      });
      host.appendChild(table);
    },
  });

  registerComponent({
    id: "ui.dataTable.rowClick",
    name: "DataTable / Row Click",
    kind: "table",
    app: "shared",
    supports: ["default", "empty"],
    render: (host, ctx) => {
      const data = ctx.state === "empty" ? [] : sampleRows(4);
      const table = createDataTable({
        columns: [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
        ],
        data,
        onRowClick: () => {},
      });
      host.appendChild(table);
    },
  });

  registerComponent({
    id: "ui.badge.tones",
    name: "Badge / Tones",
    kind: "widget",
    app: "shared",
    render: (host) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; flex-wrap:wrap; gap:8px;";
      row.appendChild(createBadge("NEUTRAL", "neutral"));
      row.appendChild(createBadge("INFO", "info"));
      row.appendChild(createBadge("OK", "ok"));
      row.appendChild(createBadge("WARN", "warn"));
      row.appendChild(createBadge("ERR", "err"));
      row.appendChild(createBadge("ACCENT", "accent"));
      host.appendChild(row);
    },
  });

  registerComponent({
    id: "ui.badge.roles",
    name: "Badge / Roles",
    kind: "widget",
    app: "shared",
    render: (host) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; flex-wrap:wrap; gap:8px;";
      row.appendChild(createRoleBadge("USER"));
      row.appendChild(createRoleBadge("ADMIN"));
      row.appendChild(createRoleBadge("SYSADMIN"));
      row.appendChild(createRoleBadge("DEVELOPER"));
      host.appendChild(row);
    },
  });

  registerComponent({
    id: "ui.badge.safeMode",
    name: "Badge / Safe Mode",
    kind: "state",
    app: "shared",
    supports: ["safeMode"],
    render: (host) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; flex-wrap:wrap; gap:8px;";
      row.appendChild(createSafeModeBadge("OFF"));
      row.appendChild(createSafeModeBadge("COMPAT"));
      row.appendChild(createSafeModeBadge("STRICT"));
      host.appendChild(row);
    },
  });

  registerComponent({
    id: "ui.state.empty",
    name: "Empty State / Logs",
    kind: "state",
    app: "shared",
    supports: ["empty"],
    render: (host) => {
      host.appendChild(createContextualEmptyState("logs"));
    },
  });

  registerComponent({
    id: "ui.state.emptyUsers",
    name: "Empty State / Users",
    kind: "state",
    app: "shared",
    supports: ["empty"],
    render: (host) => {
      host.appendChild(
        createContextualEmptyState("users", {
          onAdd: () => {},
        })
      );
    },
  });

  registerComponent({
    id: "ui.state.emptyFilters",
    name: "Empty State / Filtered",
    kind: "state",
    app: "shared",
    supports: ["empty"],
    render: (host) => {
      host.appendChild(
        createContextualEmptyState("users", {
          filter: "Status: inactive",
          searchQuery: "demo",
          onClearFilter: () => {},
        })
      );
    },
  });

  registerComponent({
    id: "ui.state.error",
    name: "Error State",
    kind: "state",
    app: "shared",
    supports: ["error"],
    render: (host) => {
      host.appendChild(
        createErrorState({
          code: "ERR_DEMO",
          message: "Erreur de chargement des donnees de demo.",
          correlationId: "demo-1234",
        })
      );
    },
  });

  registerComponent({
    id: "ui.state.errorActions",
    name: "Error State / Actions",
    kind: "state",
    app: "shared",
    supports: ["error"],
    render: (host) => {
      host.appendChild(
        createErrorState({
          code: "ERR_ACTIONS",
          message: "Demo error with actions.",
          correlationId: "demo-5678",
          onViewLogs: () => {},
          onCopyCorrelationId: () => {},
        })
      );
    },
  });

  registerComponent({
    id: "ui.state.accessDenied",
    name: "Access Denied",
    kind: "state",
    app: "shared",
    supports: ["accessDenied"],
    render: (host) => {
      renderAccessDenied(host, "Role missing: SYSADMIN");
    },
  });

  registerComponent({
    id: "ui.toast.demo",
    name: "Toast / Demo",
    kind: "widget",
    app: "shared",
    render: (host) => {
      const wrapper = document.createElement("div");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Show toast";
      btn.style.cssText = `
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
        background: var(--ic-card, var(--icontrol-color-fallback-fg));
        color: var(--ic-text, var(--icontrol-color-fallback-fg));
        font-size: 12px;
        cursor: pointer;
      `;
      btn.onclick = () => {
        showToast({ status: "info", message: "Toast preview (info)" });
      };
      wrapper.appendChild(btn);
      host.appendChild(wrapper);
    },
  });
}
