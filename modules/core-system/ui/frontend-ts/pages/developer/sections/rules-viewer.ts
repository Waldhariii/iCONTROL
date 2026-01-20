import { MAIN_SYSTEM_RULES } from "../../../shared/mainSystem.data";
import { appendTable } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

export function render_rules_viewer(host: HTMLElement): void {
  const card = createToolboxCard("Rules engine inventory", "Inventaire des règles du moteur de règles");
  const content = (card as any).content;
  
  appendTable(
    content,
    ["category", "items"],
    [
      { category: "value_refs", items: MAIN_SYSTEM_RULES.valueRefs.join(" ") },
      { category: "conditions", items: MAIN_SYSTEM_RULES.conditions.join(" ") },
      { category: "effects", items: MAIN_SYSTEM_RULES.effects.join(" ") }
    ]
  );
  host.appendChild(card);
}
