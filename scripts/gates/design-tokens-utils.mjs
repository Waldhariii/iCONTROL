import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const TOKENS_PATH = resolve(process.cwd(), "runtime/configs/ssot/design.tokens.json");
export const GENERATED_CSS_PATH = resolve(
  process.cwd(),
  "apps/control-plane/src/styles/tokens.generated.css",
);

const CP_LOGIN_MAPPING = {
  pageBg: "--cp-login-page-bg",
  panelBg: "--cp-login-panel-bg",
  cardBg: "--cp-login-card-bg",
  inputBg: "--cp-login-input-bg",
  buttonBg: "--cp-login-button-bg",
};

export function loadDesignTokens() {
  let raw;
  try {
    raw = readFileSync(TOKENS_PATH, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new Error("design.tokens.json manquant: " + TOKENS_PATH);
    }
    throw e;
  }

  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error("design.tokens.json JSON invalide: " + e.message);
  }

  if (!obj || typeof obj !== "object") {
    throw new Error("design.tokens.json: racine doit etre un objet.");
  }

  return obj;
}

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(label + " doit etre un objet.");
  }
}

function normalizeModes(preset) {
  if (!Array.isArray(preset.modes) || preset.modes.length === 0) {
    throw new Error("preset.modes doit etre une liste non vide.");
  }
  return preset.modes.map((m) => String(m));
}

export function extractPresetEntries(tokens) {
  const presets = tokens.presets || {};
  ensureObject(presets, "design.tokens.json presets");

  const entries = [];
  for (const [presetKey, preset] of Object.entries(presets)) {
    ensureObject(preset, `preset ${presetKey}`);

    const id = String(preset.id || presetKey);
    const scope = preset.scope ? String(preset.scope) : "";
    const modes = normalizeModes(preset);

    if (preset.tokensByMode) {
      ensureObject(preset.tokensByMode, `preset ${id}.tokensByMode`);
      for (const mode of modes) {
        const modeTokens = preset.tokensByMode[mode];
        ensureObject(modeTokens, `preset ${id} tokensByMode.${mode}`);
        entries.push({ id, scope, mode, tokens: modeTokens });
      }
      continue;
    }

    if (preset.tokens) {
      ensureObject(preset.tokens, `preset ${id}.tokens`);
      if (modes.length > 1) {
        throw new Error(
          `preset ${id} a plusieurs modes mais aucun tokensByMode defni.`,
        );
      }
      entries.push({ id, scope, mode: modes[0], tokens: preset.tokens });
      continue;
    }

    throw new Error(`preset ${id} ne contient ni tokens ni tokensByMode.`);
  }

  if (entries.length === 0) {
    throw new Error("Aucun preset detecte dans design.tokens.json.");
  }

  return entries;
}

export function validateDesignTokens(tokens) {
  const hasBase = tokens.base != null && typeof tokens.base === "object";
  const hasPresets = tokens.presets != null && typeof tokens.presets === "object";
  const hasMapping =
    tokens.cssVarsMapping != null && typeof tokens.cssVarsMapping === "object";

  if (!hasBase && !hasPresets && !hasMapping) {
    throw new Error(
      "design.tokens.json: au moins un de base, presets, cssVarsMapping doit etre un objet.",
    );
  }

  ensureObject(tokens.cssVarsMapping, "design.tokens.json cssVarsMapping");

  const mapping = tokens.cssVarsMapping;
  const mappingKeys = Object.keys(mapping);
  if (mappingKeys.length === 0) {
    throw new Error("cssVarsMapping vide.");
  }

  for (const [key, value] of Object.entries(mapping)) {
    if (typeof value !== "string" || !value.startsWith("--")) {
      throw new Error(`cssVarsMapping.${key} doit etre une CSS var (--xxx).`);
    }
  }

  const entries = extractPresetEntries(tokens);
  for (const entry of entries) {
    for (const mapKey of mappingKeys) {
      if (!Object.prototype.hasOwnProperty.call(entry.tokens, mapKey)) {
        throw new Error(
          `preset ${entry.id} (${entry.mode}) manque la cle token: ${mapKey}`,
        );
      }
    }
  }

  return { mapping, entries };
}

function cssForTokens(tokens, mapping) {
  const lines = [];
  for (const [key, cssVar] of Object.entries(mapping)) {
    const value = tokens[key];
    lines.push(`  ${cssVar}: ${value};`);
  }

  if (tokens.cpLogin && typeof tokens.cpLogin === "object") {
    for (const [key, cssVar] of Object.entries(CP_LOGIN_MAPPING)) {
      const value = tokens.cpLogin[key];
      if (value != null && value !== "") {
        lines.push(`  ${cssVar}: ${value};`);
      }
    }
  }

  return lines.join("\n");
}

function getDefaultEntry(tokens, entries) {
  const presetId = tokens.defaultPresetId
    ? String(tokens.defaultPresetId)
    : entries[0].id;
  const mode = tokens.defaultMode
    ? String(tokens.defaultMode)
    : entries[0].mode;

  const match = entries.find(
    (entry) => entry.id === presetId && entry.mode === mode,
  );
  if (!match) {
    return entries[0];
  }
  return match;
}

export function buildDesignTokensCss(tokens) {
  const { mapping, entries } = validateDesignTokens(tokens);
  const defaultEntry = getDefaultEntry(tokens, entries);

  const header = [
    "/* AUTO-GENERATED: DO NOT EDIT DIRECTLY.",
    " * Source: runtime/configs/ssot/design.tokens.json",
    " * Run: node scripts/gates/generate-design-tokens-css.mjs",
    " */",
    "",
  ];

  const blocks = [];
  blocks.push(
    `:root {\n${cssForTokens(defaultEntry.tokens, mapping)}\n}`,
  );

  for (const entry of entries) {
    const selector =
      `:root[data-ic-theme-id=\"${entry.id}\"]` +
      `[data-ic-theme-mode=\"${entry.mode}\"]`;
    blocks.push(`\n${selector} {\n${cssForTokens(entry.tokens, mapping)}\n}`);
  }

  return header.join("\n") + blocks.join("\n") + "\n";
}
