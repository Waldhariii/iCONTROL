import type { SystemModel } from "../model";
import { blockKeyValueTable } from "../../_shared/uiBlocks";

export function renderSystemLayout(host: HTMLElement, model: SystemModel): void {
  host.appendChild(
    blockKeyValueTable({
      title: "Layout pack",
      rows: [
        { key: "topbarHeight", value: String(model.layout.topbarHeight) },
        { key: "drawerWidth", value: String(model.layout.drawerWidth) },
        { key: "maxWidth", value: String(model.layout.maxWidth) },
        { key: "pagePadding", value: String(model.layout.pagePadding) },
        { key: "menuOrder", value: model.menuOrder.join(" > ") }
      ]
    })
  );
}
