import { blockKeyValueTable } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";

export function renderDossiersSafeMode(host: HTMLElement): void {
  const safeMode = getSafeMode();
  host.appendChild(
    blockKeyValueTable({
      title: "SAFE_MODE",
      rows: [{ key: "safe_mode", value: safeMode === "STRICT" ? "STRICT" : "COMPAT" }]
    })
  );
}
