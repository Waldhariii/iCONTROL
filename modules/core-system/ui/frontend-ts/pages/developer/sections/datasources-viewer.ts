import { MAIN_SYSTEM_DATASOURCES } from "../../_shared/mainSystem.data";
import { appendTable, sectionCard } from "../../_shared/uiBlocks";

const EXTERNAL_TYPES = new Set(["files", "api_stub"]);

export function render_datasources_viewer(host: HTMLElement, safeMode: string): void {
  const card = sectionCard("Datasources (contract)");
  const rows = MAIN_SYSTEM_DATASOURCES.types.map((t) => ({
    type: t,
    status: safeMode === "STRICT" && EXTERNAL_TYPES.has(t) ? "blocked" : "allowed"
  }));
  appendTable(card, ["type", "status"], rows);
  host.appendChild(card);
}
