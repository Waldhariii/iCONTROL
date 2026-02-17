import fs from "fs";
import path from "path";
import { loadWidgetContractsFromDir, listWidgets } from "./widget-registry.mjs";

export function loadAllWidgets({ extensionsRoot }) {
  const root = extensionsRoot;
  if (!fs.existsSync(root)) return { ok: true, loaded: 0, widgets: [] };

  const extKinds = ["official", "customers", "marketplace", "custom"];
  let loaded = 0;

  for (const kind of extKinds) {
    const kindDir = path.join(root, kind);
    if (!fs.existsSync(kindDir)) continue;
    for (const extId of fs.readdirSync(kindDir)) {
      const extDir = path.join(kindDir, extId);
      const widgetsDir = path.join(extDir, "widgets");
      const extensionId = "extension:" + kind + ":" + extId;
      const r = loadWidgetContractsFromDir(widgetsDir, extensionId);
      loaded += r.loaded;
    }
  }

  return { ok: true, loaded, widgets: listWidgets() };
}
