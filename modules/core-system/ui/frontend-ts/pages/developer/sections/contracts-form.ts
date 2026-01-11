import { MAIN_SYSTEM_FORM_CONTRACT } from "../../_shared/mainSystem.data";
import { appendTable, sectionCard } from "../../_shared/uiBlocks";

export function render_contracts_form(host: HTMLElement): void {
  const card = sectionCard("Contracts: FormDef");
  appendTable(
    card,
    ["fields", "validation", "visibleForRoles"],
    [
      {
        fields: MAIN_SYSTEM_FORM_CONTRACT.fieldTypes.join(" "),
        validation: MAIN_SYSTEM_FORM_CONTRACT.validation.join(" "),
        visibleForRoles: MAIN_SYSTEM_FORM_CONTRACT.roleVisibility
      }
    ]
  );
  host.appendChild(card);
}
