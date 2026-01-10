import { MAIN_SYSTEM_RULES } from "../../_shared/mainSystem.data";
import { appendTable, sectionCard } from "../../_shared/uiBlocks";

export function render_rules_viewer(host: HTMLElement): void {
  const card = sectionCard("Rules engine inventory");
  appendTable(
    card,
    ["category", "items"],
    [
      { category: "value_refs", items: MAIN_SYSTEM_RULES.valueRefs.join(" ") },
      { category: "conditions", items: MAIN_SYSTEM_RULES.conditions.join(" ") },
      { category: "effects", items: MAIN_SYSTEM_RULES.effects.join(" ") }
    ]
  );
  host.appendChild(card);
}
