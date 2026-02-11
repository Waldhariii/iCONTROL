// @ts-nocheck
import { MAIN_SYSTEM_TABLE_CONTRACT } from "../../_shared/mainSystem.data";
import { appendTable, sectionCard } from "../../_shared/uiBlocks";

export function render_contracts_table(host: HTMLElement): void {
  const card = sectionCard("Contracts: TableDef / ColumnDef");
  appendTable(
    card,
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
