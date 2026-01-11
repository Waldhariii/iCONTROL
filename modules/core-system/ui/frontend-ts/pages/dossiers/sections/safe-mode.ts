import { blockKeyValueTable } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";

export function renderDossiersSafeMode(host: HTMLElement): void {
  const safeMode = getSafeMode();
  host.appendChild(
    blockKeyValueTable({
      title: "SAFE_MODE",
      rows: [{ key: "safe_mode", value: safeMode === "STRICT" ? "STRICT" : "COMPAT" }]
    })
  );
}
