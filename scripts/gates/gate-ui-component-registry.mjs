import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "../..");
const registryPath = path.join(repoRoot, "app/src/core/ui/registry.ts");
const cssPath = path.join(repoRoot, "app/src/styles/STYLE_ADMIN_FINAL.css");
const reportPath = path.join(repoRoot, "_REPORTS/ui-component-registry-report.md");

// Report-only by default; strict mode blocks (PHASE 6.4)
const STRICT = process.env.STRICT === "1";

// Very small parser: extracts `classBase: "..."` occurrences
function extractClassBases(ts) {
  const out = [];
  const re = /classBase:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts))) out.push(m[1]);
  return Array.from(new Set(out));
}

// Extract sources list (basic) to compute coverage by file existence
function extractSources(ts) {
  const out = [];
  const re = /sources:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(ts))) {
    const chunk = m[1];
    const sRe = /"([^"]+)"/g;
    let sm;
    while ((sm = sRe.exec(chunk))) out.push(sm[1]);
  }
  return Array.from(new Set(out));
}

function exists(p) {
  try { fs.accessSync(p, fs.constants.R_OK); return true; } catch { return false; }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

// Minimal feature flag check (reads JSON directly, no TS imports)
function __isFeatureFlagEnabled(flagName) {
  try {
    const rt = globalThis;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) {
      const decision = decisions.find(d => d.flag === flagName);
      if (decision) return decision.enabled === true;
    }
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    if (flags && flags[flagName]) {
      const state = flags[flagName].state;
      return state === "ON" || state === "ROLLOUT";
    }
    const flagsPath = path.join(repoRoot, "app/src/policies/feature_flags.default.json");
    if (fs.existsSync(flagsPath)) {
      const flagsJson = JSON.parse(fs.readFileSync(flagsPath, "utf8"));
      const flag = flagsJson.flags?.[flagName];
      if (flag) {
        const state = flag.state;
        return state === "ON" || state === "ROLLOUT";
      }
    }
    return false;
  } catch {
    return false;
  }
}

function __logWarn(prefix, message, meta = {}) {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.warn(`WARN_${prefix}: ${message}${metaStr}`);
}

function writeReport({ missingClasses, missingFiles, stats }) {
  const lines = [];
  lines.push(`# UI Component Registry Gate Report`);
  lines.push(``);
  lines.push(`- Date: ${new Date().toISOString()}`);
  lines.push(`- Mode: ${STRICT ? "STRICT (blocking)" : "REPORT-ONLY (non-blocking)"}`);
  lines.push(`- Registry: \`${path.relative(repoRoot, registryPath)}\``);
  lines.push(`- CSS: \`${path.relative(repoRoot, cssPath)}\``);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`- Registry classBase count: **${stats.classCount}**`);
  lines.push(`- Registry sources count: **${stats.sourceCount}**`);
  lines.push(`- Missing CSS classes: **${missingClasses.length}**`);
  lines.push(`- Missing source files: **${missingFiles.length}**`);
  lines.push(``);

  if (missingClasses.length) {
    lines.push(`## Missing CSS Classes (expected under CP scope)`);
    for (const c of missingClasses) lines.push(`- \`${c}\``);
    lines.push(``);
  }

  if (missingFiles.length) {
    lines.push(`## Missing Source Files`);
    for (const f of missingFiles) lines.push(`- \`${f}\``);
    lines.push(``);
  }

  lines.push(`## Next Actions`);
  lines.push(`- Ajouter les classes manquantes dans STYLE_ADMIN_FINAL.css (scope CP)`);
  lines.push(`- Corriger les chemins "sources" si des fichiers ont été déplacés`);
  lines.push(`- PHASE 6.2: ajouter une validation contractuelle (datasets/variants)`);
  lines.push(``);

  // Legacy-first FS write
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  let __wrote = false;
  let __bytes = 0;
  try {
    const content = lines.join("\n");
    fs.writeFileSync(reportPath, content, "utf8");
    __wrote = true;
    __bytes = Buffer.byteLength(content, "utf8");
  } catch (err) {
    __logWarn("GATE_UI_COMPONENT_REGISTRY_FS_WRITE", `Failed to write ${reportPath}: ${String(err)}`);
  }

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  if (__wrote && __isFeatureFlagEnabled("gate_ui_component_registry_fs_shadow")) {
    const correlationId = `uiComponentRegistry-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    __logWarn("WRITE_GATEWAY_UI_COMPONENT_REGISTRY_SHADOW", "Shadow write gateway disabled in standalone gate", {
      kind: "GATE_UI_COMPONENT_REGISTRY_FS_WRITE_SHADOW",
      correlation_id: correlationId,
      path: path.relative(repoRoot, reportPath),
      bytes: __bytes,
      note: "Shadow gateway requires TS imports; gate is standalone. Enable shadow via separate mechanism if needed.",
    });
  }
}

function main() {
  if (!exists(registryPath)) {
    console.error(`[gate-ui-component-registry] Missing registry: ${registryPath}`);
    process.exit(STRICT ? 2 : 0);
  }
  if (!exists(cssPath)) {
    console.error(`[gate-ui-component-registry] Missing CSS: ${cssPath}`);
    process.exit(STRICT ? 3 : 0);
  }

  const ts = read(registryPath);
  const css = read(cssPath);

  const classes = extractClassBases(ts);
  const sources = extractSources(ts);

  const missingClasses = classes.filter((c) => !css.includes(`.${c}`));
  const missingFiles = sources
    .map((s) => path.join(repoRoot, s))
    .filter((abs) => !exists(abs))
    .map((abs) => path.relative(repoRoot, abs));

  writeReport({
    missingClasses,
    missingFiles,
    stats: { classCount: classes.length, sourceCount: sources.length }
  });

  const ok = missingClasses.length === 0 && missingFiles.length === 0;

  if (!ok) {
    console.error(`[gate-ui-component-registry] Issues found. Report: ${path.relative(repoRoot, reportPath)}`);
    if (missingClasses.length) console.error(`- Missing CSS classes: ${missingClasses.join(", ")}`);
    if (missingFiles.length) console.error(`- Missing files: ${missingFiles.join(", ")}`);
    process.exit(STRICT ? 1 : 0);
  }

  console.log(`[gate-ui-component-registry] OK. Report: ${path.relative(repoRoot, reportPath)}`);
}

main();
