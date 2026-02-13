// @ts-nocheck
import { MAIN_SYSTEM_FORM_CONTRACT } from "../../_shared/mainSystem.data";
import { appendKeyValueTable, sectionCard } from "../../_shared/uiBlocks";

export function render_contracts_form(host: HTMLElement): void {
  const card = sectionCard("Contracts: FormDef");
  appendKeyValueTable(card, [
    { key: "Fields", value: MAIN_SYSTEM_FORM_CONTRACT.fieldTypes.join(", ") },
    { key: "Validation", value: MAIN_SYSTEM_FORM_CONTRACT.validation.join(", ") },
    { key: "Visible For Roles", value: MAIN_SYSTEM_FORM_CONTRACT.roleVisibility },
  ]);
  host.appendChild(card);
}
