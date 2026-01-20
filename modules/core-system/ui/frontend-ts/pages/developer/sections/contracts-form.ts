import { MAIN_SYSTEM_FORM_CONTRACT } from "../../../shared/mainSystem.data";
import { appendTable } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

export function render_contracts_form(host: HTMLElement): void {
  const card = createToolboxCard("Contracts: FormDef", "Définition des contrats de formulaires");
  const content = (card as any).content;
  
  appendTable(
    content,
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
