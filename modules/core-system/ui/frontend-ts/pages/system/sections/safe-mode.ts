// @ts-nocheck
import type { SystemModel } from "../model";
import { blockKeyValueTable } from "../../_shared/uiBlocks";

export function renderSystemSafeMode(host: HTMLElement, model: SystemModel): void {
  const table = blockKeyValueTable({
    title: "SAFE_MODE",
    rows: [
      { key: "safe_mode", value: model.safeMode === "STRICT" ? "ON (strict)" : "OFF" }
    ]
  });
  host.appendChild(table);
}
