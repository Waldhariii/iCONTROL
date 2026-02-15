/**
 * Studio diff engine: compare ACTIVE vs PREVIEW manifest.
 * Returns { added, removed, changed } with items { kind, id }.
 * No external libs; uses existing manifest shape.
 */

function collectItems(manifest) {
  const items = [];
  const routes = manifest?.routes?.routes || [];
  for (const r of routes) {
    const id = r.route_id || r.path || r.id;
    if (id) items.push({ kind: "route_spec", id, value: r });
  }
  const pages = manifest?.pages?.pages || [];
  for (const p of pages) {
    const id = p.id || p.page_id;
    if (id) items.push({ kind: "page_definition", id, value: p });
  }
  const nav = manifest?.nav?.nav_specs || [];
  for (const n of nav) {
    const id = n.id || n.path;
    if (id) items.push({ kind: "nav_spec", id, value: n });
  }
  const widgets = manifest?.widgets || [];
  for (const w of widgets) {
    const id = w.widget_instance_id || w.id;
    if (id) items.push({ kind: "widget_instance", id, value: w });
  }
  const themes = manifest?.themes?.themes || [];
  for (const t of themes) {
    const id = t.theme_id || t.id;
    if (id) items.push({ kind: "theme", id, value: t });
  }
  return items;
}

function key(kind, id) {
  return `${kind}:${id}`;
}

function serialize(value) {
  try {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) out[k] = value[k];
    return JSON.stringify(out);
  } catch {
    return String(value);
  }
}

/**
 * Compare ACTIVE manifest vs PREVIEW manifest.
 * @param {object} activeManifest - loaded active manifest
 * @param {object} previewManifest - loaded preview manifest
 * @returns {{ added: Array<{kind, id}>, removed: Array<{kind, id}>, changed: Array<{kind, id}> }}
 */
export function diffManifests(activeManifest, previewManifest) {
  const active = collectItems(activeManifest || {});
  const preview = collectItems(previewManifest || {});

  const activeByKey = new Map();
  for (const it of active) activeByKey.set(key(it.kind, it.id), it);
  const previewByKey = new Map();
  for (const it of preview) previewByKey.set(key(it.kind, it.id), it);

  const added = [];
  const removed = [];
  const changed = [];

  for (const it of preview) {
    const k = key(it.kind, it.id);
    if (!activeByKey.has(k)) added.push({ kind: it.kind, id: it.id });
    else {
      const a = activeByKey.get(k);
      if (serialize(a.value) !== serialize(it.value)) changed.push({ kind: it.kind, id: it.id });
    }
  }
  for (const it of active) {
    const k = key(it.kind, it.id);
    if (!previewByKey.has(k)) removed.push({ kind: it.kind, id: it.id });
  }

  return { added, removed, changed };
}

/**
 * Compare two SSOT file sets (path -> content).
 * @param {Record<string, string>} activeFiles - relative path -> content
 * @param {Record<string, string>} previewFiles - relative path -> content
 * @returns {{ added: string[], removed: string[], changed: string[] }}
 */
export function diffSsotFiles(activeFiles, previewFiles) {
  const active = activeFiles || {};
  const preview = previewFiles || {};
  const activePaths = new Set(Object.keys(active));
  const previewPaths = new Set(Object.keys(preview));

  const added = [...previewPaths].filter((p) => !activePaths.has(p));
  const removed = [...activePaths].filter((p) => !previewPaths.has(p));
  const changed = [...activePaths]
    .filter((p) => previewPaths.has(p) && active[p] !== preview[p]);

  return { added, removed, changed };
}
