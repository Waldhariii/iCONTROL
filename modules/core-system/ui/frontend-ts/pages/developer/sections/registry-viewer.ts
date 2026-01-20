import { MAIN_SYSTEM_MODULES } from "../../../shared/mainSystem.data";
import { appendActionRow, appendTable, bindActions } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

export function render_registry_viewer(host: HTMLElement): void {
  const card = createToolboxCard("Registry viewer", "Vue d'ensemble des composants et modules enregistrés");
  const content = (card as any).content;
  
  // Panel Components
  const componentsPanel = document.createElement("div");
  componentsPanel.style.cssText = "margin-bottom:20px;";
  componentsPanel.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--ic-mutedText, var(--muted));text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
      Composants
    </div>
  `;
  const componentsTable = document.createElement("div");
  appendTable(
    componentsTable,
    ["Component", "Type", "Notes"],
    [
      { Component: "Table", Type: "builtin", Notes: "TableDef/ColumnDef contract" },
      { Component: "Form", Type: "builtin", Notes: "FormDef contract" },
      { Component: "Blocks", Type: "runtime", Notes: "text | component" }
    ]
  );
  componentsPanel.appendChild(componentsTable);
  content.appendChild(componentsPanel);
  
  // Panel Modules
  const modulesPanel = document.createElement("div");
  modulesPanel.style.cssText = "margin-bottom:20px;";
  modulesPanel.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--ic-mutedText, var(--muted));text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
      Modules
    </div>
  `;
  const modulesTable = document.createElement("div");
  appendTable(
    modulesTable,
    ["Module", "Routes"],
    MAIN_SYSTEM_MODULES.map((m) => ({ Module: m.id, Routes: m.routes.join(", ") }))
  );
  modulesPanel.appendChild(modulesTable);
  content.appendChild(modulesPanel);

  const actions = [
    { id: "nav_dashboard", label: "Aller au Dashboard", type: "navigate", payload: "#/dashboard" },
    { id: "export_registry", label: "Exporter registry CSV", type: "exportCsv" },
    { id: "noop_registry", label: "No-op", type: "noop" }
  ] as const;

  const row = appendActionRow(content, actions);
  bindActions(row, actions, {
    allowRoutes: ["#/dashboard", "#/users", "#/account", "#/verification", "#/developer", "#/toolbox"],
    exportRows: MAIN_SYSTEM_MODULES.map((m) => ({ id: m.id, label: m.label, type: m.type, routes: m.routes.join(";") }))
  });

  host.appendChild(card);
}
