import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compilePages({ ssotDir, outDir, releaseId }) {
  const pageDefs = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
  const layouts = readJson(`${ssotDir}/studio/layouts/layout_instances.json`);
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
  const navSpecs = readJson(`${ssotDir}/studio/nav/nav_specs.json`);

  for (const p of pageDefs) validateOrThrow("page_definition.v1", p, "page_definitions");
  for (const pv of pageVersions) validateOrThrow("page_version.v1", pv, "page_versions");
  validateOrThrow("array_of_objects.v1", layouts, "layout_instances");
  validateOrThrow("array_of_objects.v1", widgets, "widget_instances");

  const widgetsById = new Map(widgets.map((w) => [w.id, w]));
  const sections = [];
  const sectionsByPage = {};
  for (const n of navSpecs) {
    if (n.type !== "section") continue;
    if (!n.page_id || !n.section_key) continue;
    if (!sectionsByPage[n.page_id]) sectionsByPage[n.page_id] = [];
    sectionsByPage[n.page_id].push({
      section_key: n.section_key,
      title_key: n.label_key || n.label || n.section_key,
      order: Number.isInteger(n.order) ? n.order : 0
    });
  }

  for (const pv of pageVersions) {
    const widgetIds = pv.widget_instance_ids || [];
    const bySection = new Map();
    for (const wid of widgetIds) {
      const w = widgetsById.get(wid) || {};
      const key = w.section_key || "__default";
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(wid);
    }
    const defs = sectionsByPage[pv.page_id] || [];
    const defKeys = new Set(defs.map((d) => d.section_key));
    for (const d of defs) {
      sections.push({
        page_id: pv.page_id,
        section_key: d.section_key,
        title_key: d.title_key,
        order: d.order,
        widget_instance_ids: bySection.get(d.section_key) || []
      });
    }
    if (bySection.has("__default") || defs.length === 0) {
      sections.push({
        page_id: pv.page_id,
        section_key: "__default",
        title_key: "section.default",
        order: 999,
        widget_instance_ids: bySection.get("__default") || widgetIds
      });
    }
    for (const [key, ids] of bySection.entries()) {
      if (key === "__default") continue;
      if (defKeys.has(key)) continue;
      sections.push({
        page_id: pv.page_id,
        section_key: key,
        title_key: key,
        order: 500,
        widget_instance_ids: ids
      });
    }
  }

  const sectionKeysAsTab = new Set();
  for (const n of navSpecs) {
    if (n.type === "section" && n.page_id && n.section_key) sectionKeysAsTab.add(`${n.page_id}:${n.section_key}`);
  }

  const sectionAccum = new Map();
  for (const s of sections) {
    const { page_id, section_key, title_key, order, widget_instance_ids } = s;
    const key = `${page_id}:${section_key}`;
    const existing = sectionAccum.get(key);
    const wids = [...(existing?.widget_instance_ids || []), ...(widget_instance_ids || [])];
    const uniq = [...new Set(wids)];
    sectionAccum.set(key, {
      page_id,
      section_key,
      title_key: existing?.title_key || title_key,
      order: existing != null ? existing.order : order,
      widget_instance_ids: uniq
    });
  }
  const sectionsByPageV2 = new Map();
  for (const [, acc] of sectionAccum) {
    const { page_id, section_key, title_key, order, widget_instance_ids } = acc;
    const key = `${page_id}:${section_key}`;
    if (!sectionsByPageV2.has(page_id)) sectionsByPageV2.set(page_id, []);
    const kind = sectionKeysAsTab.has(key) ? "tab" : "section";
    const sectionWidgets = (widget_instance_ids || []).map((wid) => {
      const w = widgetsById.get(wid) || {};
      return {
        id: w.id || wid,
        widget_type: w.widget_id || "widget:placeholder",
        props: w.props || {},
        data_bindings: w.data_bindings || [],
        actions: w.actions || []
      };
    });
    sectionsByPageV2.get(page_id).push({
      id: `${page_id}-${section_key}`,
      key: section_key,
      label: title_key || section_key,
      kind,
      order: Number.isInteger(order) ? order : 999,
      layout: {},
      widgets: sectionWidgets
    });
  }

  const sections_v2 = [];
  for (const [page_id, secs] of sectionsByPageV2) {
    secs.sort((a, b) => a.order - b.order);
    sections_v2.push({ page_id, sections: secs });
  }

  const renderGraph = {
    release_id: releaseId,
    pages: pageDefs,
    page_versions: pageVersions,
    layouts,
    widgets,
    sections,
    sections_v2
  };

  writeJson(`${outDir}/render_graph.${releaseId}.json`, renderGraph);
  validateOrThrow("render_graph.v1", renderGraph, "render_graph");
  return renderGraph;
}
