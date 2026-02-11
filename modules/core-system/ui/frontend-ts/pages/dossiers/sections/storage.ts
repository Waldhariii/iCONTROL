// @ts-nocheck
import { blockKeyValueTable } from "../../_shared/uiBlocks";
import { createDossiersModel } from "../model";

export function renderDossiersStorage(root: HTMLElement): void {
  const model = createDossiersModel();
  root.appendChild(
    blockKeyValueTable({
      title: "Storage",
      rows: [
        { key: "storage_key", value: model.storageKey },
        { key: "bytes", value: String(model.storageBytes) },
        { key: "count", value: String(model.dossiers.length) }
      ]
    })
  );
}
