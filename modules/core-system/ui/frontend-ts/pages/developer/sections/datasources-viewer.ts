import { MAIN_SYSTEM_DATASOURCES } from "../../../shared/mainSystem.data";
import { appendTable } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

const EXTERNAL_TYPES = new Set(["files", "api_stub"]);

export function render_datasources_viewer(host: HTMLElement, safeMode: string): void {
  const card = createToolboxCard("Datasources (contract)", "Types de sources de données disponibles");
  const content = (card as any).content;
  
  const rows = MAIN_SYSTEM_DATASOURCES.types.map((t) => ({
    type: t,
    status: safeMode === "STRICT" && EXTERNAL_TYPES.has(t) ? "blocked" : "allowed"
  }));
  appendTable(content, ["type", "status"], rows);
  host.appendChild(card);
}
