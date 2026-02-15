import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function diffList(a, b, keyFn) {
  const aKeys = new Set((a || []).map(keyFn));
  const bKeys = new Set((b || []).map(keyFn));
  const removed = [...aKeys].filter((k) => !bKeys.has(k));
  const added = [...bKeys].filter((k) => !aKeys.has(k));
  return { removed, added };
}

export function diffManifests({ fromPath, toPath, reportsDir }) {
  const from = readJson(fromPath);
  const to = readJson(toPath);
  const breaking = [];
  const compatible = [];
  const info = [];

  const routeDiff = diffList(from.routes?.routes || [], to.routes?.routes || [], (r) => r.route_id);
  if (routeDiff.removed.length) breaking.push(`routes removed: ${routeDiff.removed.join(", ")}`);
  if (routeDiff.added.length) compatible.push(`routes added: ${routeDiff.added.join(", ")}`);

  const navDiff = diffList(from.nav?.items || [], to.nav?.items || [], (n) => n.id || JSON.stringify(n));
  if (navDiff.removed.length) compatible.push(`nav removed: ${navDiff.removed.length}`);
  if (navDiff.added.length) compatible.push(`nav added: ${navDiff.added.length}`);

  const permDiff = diffList(from.permissions?.guards || [], to.permissions?.guards || [], (g) => g.guard_pack_id || g.id || JSON.stringify(g));
  if (permDiff.removed.length) breaking.push(`permissions removed: ${permDiff.removed.join(", ")}`);

  const modelDiff = diffList(from.data_catalog?.data_models || [], to.data_catalog?.data_models || [], (m) => m.model_id || m.id);
  if (modelDiff.removed.length) breaking.push(`data models removed: ${modelDiff.removed.join(", ")}`);
  if (modelDiff.added.length) compatible.push(`data models added: ${modelDiff.added.join(", ")}`);

  const qosDiff = diffList(from.qos_policies || [], to.qos_policies || [], (q) => q.tier);
  if (qosDiff.removed.length) info.push(`qos policies removed: ${qosDiff.removed.join(", ")}`);
  if (qosDiff.added.length) info.push(`qos policies added: ${qosDiff.added.join(", ")}`);

  const extDiff = diffList(from.extensions_runtime || [], to.extensions_runtime || [], (e) => `${e.extension_id}@${e.version}`);
  if (extDiff.removed.length) info.push(`extensions removed: ${extDiff.removed.join(", ")}`);
  if (extDiff.added.length) info.push(`extensions added: ${extDiff.added.join(", ")}`);

  const integDiff = diffList(from.integrations?.connectors || [], to.integrations?.connectors || [], (c) => c.connector_id || c.id);
  if (integDiff.removed.length) breaking.push(`connectors removed: ${integDiff.removed.join(", ")}`);

  const opsDiff = diffList(from.ops?.runbooks || [], to.ops?.runbooks || [], (r) => r.runbook_id);
  if (opsDiff.removed.length) breaking.push(`runbooks removed: ${opsDiff.removed.join(", ")}`);
  if (opsDiff.added.length) compatible.push(`runbooks added: ${opsDiff.added.join(", ")}`);

  const lines = [
    `Compatibility diff: ${from.release_id} -> ${to.release_id}`,
    "",
    "Breaking:",
    ...(breaking.length ? breaking.map((b) => `- ${b}`) : ["- none"]),
    "",
    "Compatible:",
    ...(compatible.length ? compatible.map((c) => `- ${c}`) : ["- none"]),
    "",
    "Informational:",
    ...(info.length ? info.map((i) => `- ${i}`) : ["- none"])
  ];

  const reportDir = reportsDir || join(process.cwd(), "runtime", "reports");
  ensureDir(reportDir);
  const outPath = join(reportDir, `COMPAT_DIFF_${from.release_id}_${to.release_id}.md`);
  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  return { breaking, compatible, info, report: outPath };
}
