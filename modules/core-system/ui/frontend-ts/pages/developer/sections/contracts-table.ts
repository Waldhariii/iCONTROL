import { MAIN_SYSTEM_TABLE_CONTRACT } from "../../../shared/mainSystem.data";
import { appendTable } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

export function render_contracts_table(host: HTMLElement): void {
  const card = createToolboxCard("Contracts: TableDef / ColumnDef", "Définition des contrats de tableaux");
  const content = (card as any).content;
  
  appendTable(
    content,
    ["id", "columns", "actions", "visibleForRoles"],
    [
      {
        id: "table_def_contract",
        columns: MAIN_SYSTEM_TABLE_CONTRACT.columnFields.join(" "),
        actions: MAIN_SYSTEM_TABLE_CONTRACT.actionTypes.join(" "),
        visibleForRoles: "column.visibleForRoles" 
      }
    ]
  );
  host.appendChild(card);
}
