import { MAIN_SYSTEM_MODULES } from "../../_shared/mainSystem.data";
import { appendActionRow, appendTable, bindActions, sectionCard } from "../../_shared/uiBlocks";

export function render_registry_viewer(host: HTMLElement): void {
  const card = sectionCard("Registry viewer");
  appendTable(
    card,
    ["Component", "Type", "Notes"],
    [
      { Component: "Table", Type: "builtin", Notes: "TableDef/ColumnDef contract" },
      { Component: "Form", Type: "builtin", Notes: "FormDef contract" },
      { Component: "Blocks", Type: "runtime", Notes: "text | component" }
    ]
  );
  appendTable(
    card,
    ["Module", "Routes"],
    MAIN_SYSTEM_MODULES.map((m) => ({ Module: m.id, Routes: m.routes.join(", ") }))
  );

  const actions = [
    { id: "nav_dashboard", label: "Aller au Dashboard", type: "navigate", payload: "#/dashboard" },
    { id: "export_registry", label: "Exporter registry CSV", type: "exportCsv" },
    { id: "noop_registry", label: "No-op", type: "noop" }
  ] as const;

  const row = appendActionRow(card, actions);
  bindActions(row, actions, {
    allowRoutes: ["#/dashboard", "#/users", "#/account", "#/verification", "#/developer", "#/toolbox"],
    exportRows: MAIN_SYSTEM_MODULES.map((m) => ({ id: m.id, label: m.label, type: m.type, routes: m.routes.join(";") }))
  });

  host.appendChild(card);
}
