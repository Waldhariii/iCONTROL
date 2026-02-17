import fs from "fs";
import path from "path";

const _registry = new Map();

export function registerWidget(contract, extensionId, sourcePath) {
  if (!contract?.widget_id) throw new Error("widget contract missing widget_id");
  const id = contract.widget_id;
  if (_registry.has(id)) {
    const prev = _registry.get(id);
    throw new Error("duplicate widget_id " + id + " from " + sourcePath + " (already from " + prev.sourcePath + ")");
  }
  _registry.set(id, { contract, extensionId, sourcePath });
}

export function listWidgets() {
  return Array.from(_registry.values()).map((x) => x.contract);
}

export function getWidget(widgetId) {
  return _registry.get(widgetId)?.contract || null;
}

export function loadWidgetContractsFromDir(dir, extensionId) {
  if (!fs.existsSync(dir)) return { loaded: 0 };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".widget.json"));
  let loaded = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf8");
    const contract = JSON.parse(raw);
    registerWidget(contract, extensionId, p);
    loaded += 1;
  }
  return { loaded };
}
