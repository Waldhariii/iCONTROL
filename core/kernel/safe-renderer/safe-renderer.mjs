import { readFileSync } from "fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function renderSafeWidget({ widgetId, props, manifest }) {
  const catalog = manifest?.pages?.widgets || manifest?.widgets || [];
  const widget = catalog.find((w) => w.id === widgetId || w.widget_id === widgetId);
  if (!widget) {
    throw new Error(`Widget not allowed: ${widgetId}`);
  }

  const schema = widget.props_schema || { allowed_props: [] };
  const allowed = new Set(schema.allowed_props || []);
  const propKeys = Object.keys(props || {});
  for (const k of propKeys) {
    if (!allowed.has(k)) {
      throw new Error(`Prop not allowed: ${k}`);
    }
  }

  return {
    widget_id: widgetId,
    props: props || {},
    rendered: true
  };
}

export function loadWidgetCatalogFromManifest(manifestPath) {
  const manifest = readJson(manifestPath);
  return manifest.widgets || [];
}
