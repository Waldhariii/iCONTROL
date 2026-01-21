import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { showToast } from "/src/core/ui/toast";
import { isSafeMode } from "/src/core/runtime/safeMode";
import { getRole } from "/src/runtime/rbac";
import {
  CP_LOGIN_THEMES,
  getCpLoginPreset,
  type CpLoginTheme,
  type CpLoginThemePresetName
} from "./ui/loginTheme/loginTheme";
import {
  getEffectiveLoginTheme,
  getLoginThemeOverride,
  saveLoginThemeOverride,
  clearLoginThemeOverride,
  exportLoginThemeOverride,
  importLoginThemeOverride
} from "./ui/loginTheme/loginTheme.override";

const TOKEN_LIST: Array<{ key: keyof CpLoginTheme; label: string; type: "color" | "gradient" | "value" }> = [
  { key: "bgGradient0", label: "Background Gradient A", type: "gradient" },
  { key: "bgGradient1", label: "Background Gradient B", type: "gradient" },
  { key: "bgGradient2", label: "Background Gradient Base", type: "gradient" },
  { key: "vignetteColor", label: "Vignette Color (rgb)", type: "value" },
  { key: "vignetteOpacity", label: "Vignette Opacity", type: "value" },
  { key: "noiseOpacity", label: "Noise Opacity", type: "value" },
  { key: "cardBg", label: "Card Background", type: "color" },
  { key: "cardBorder", label: "Card Border", type: "value" },
  { key: "cardShadow", label: "Card Shadow", type: "value" },
  { key: "cardGlow", label: "Card Glow", type: "value" },
  { key: "cardBlur", label: "Card Blur", type: "value" },
  { key: "cardRadius", label: "Card Radius", type: "value" },
  { key: "textPrimary", label: "Text Primary", type: "color" },
  { key: "textMuted", label: "Text Muted", type: "color" },
  { key: "textLabel", label: "Text Label", type: "color" },
  { key: "inputBg", label: "Input Background", type: "color" },
  { key: "inputBorder", label: "Input Border", type: "value" },
  { key: "inputText", label: "Input Text", type: "color" },
  { key: "inputPlaceholder", label: "Input Placeholder", type: "color" },
  { key: "inputIcon", label: "Input Icon", type: "color" },
  { key: "buttonBg0", label: "Button Gradient Start", type: "color" },
  { key: "buttonBg1", label: "Button Gradient End", type: "color" },
  { key: "buttonText", label: "Button Text", type: "color" },
  { key: "buttonGlow", label: "Button Glow", type: "value" },
  { key: "linkColor", label: "Link Color", type: "color" },
  { key: "focusRing", label: "Focus Ring", type: "value" },
  { key: "switchBg", label: "Language Switch BG", type: "color" },
  { key: "switchBorder", label: "Language Switch Border", type: "value" },
  { key: "switchText", label: "Language Switch Text", type: "color" },
  { key: "switchActiveBg", label: "Language Switch Active BG", type: "color" },
  { key: "switchActiveText", label: "Language Switch Active Text", type: "color" },
  { key: "checkboxAccent", label: "Checkbox Accent", type: "color" }
];

export function renderLoginThemeEditor(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const preset = getCpLoginPreset();
  const { theme, effects, source } = getEffectiveLoginTheme(preset);

  const role = getRole();
  const readOnly = isSafeMode() || !(role === "SYSADMIN" || role === "ADMIN");

  const { shell, content } = createPageShell({
    title: "Login Theme Editor",
    subtitle: "Tokens visuels et overrides runtime pour /cp/#/login",
    statusBadge: readOnly ? { label: "READ-ONLY", tone: "warn" } : { label: "EDITABLE", tone: "ok" }
  });

  const controlRow = document.createElement("div");
  controlRow.style.cssText = "display:flex; flex-wrap:wrap; gap:12px; align-items:center;";

  const presetSelect = document.createElement("select");
  presetSelect.style.cssText = "padding:6px 10px; border-radius:8px; border:1px solid var(--ic-border, #2b3136); background: var(--ic-panel, #1a1d1f); color: var(--ic-text, #e7ecef);";
  Object.keys(CP_LOGIN_THEMES).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === preset) opt.selected = true;
    presetSelect.appendChild(opt);
  });

  const sourceBadge = document.createElement("div");
  sourceBadge.textContent = `Override source: ${source}`;
  sourceBadge.style.cssText = "font-size:12px; color: var(--ic-mutedText, #a7b0b7);";

  controlRow.appendChild(presetSelect);
  controlRow.appendChild(sourceBadge);

  presetSelect.onchange = () => {
    const next = presetSelect.value as CpLoginThemePresetName;
    window.location.hash = `#/login-theme?theme=${next}`;
  };

  const actionsRow = document.createElement("div");
  actionsRow.style.cssText = "display:flex; flex-wrap:wrap; gap:8px;";

  const btnSave = makeButton("Save override", () => handleSave(readOnly, themeState, effectsState));
  const btnReset = makeButton("Reset", () => handleReset(readOnly));
  const btnExport = makeButton("Export JSON", () => openExportModal());
  const btnImport = makeButton("Import JSON", () => openImportModal(readOnly));

  if (readOnly) {
    btnSave.disabled = true;
    btnReset.disabled = true;
    btnImport.disabled = true;
  }

  actionsRow.appendChild(btnSave);
  actionsRow.appendChild(btnReset);
  actionsRow.appendChild(btnExport);
  actionsRow.appendChild(btnImport);

  const { card: tokenCard, body: tokenBody } = createSectionCard({
    title: "Tokens de couleur",
    description: "Cliquez un swatch pour éditer couleur, gradient ou effet metallic"
  });

  const list = document.createElement("div");
  list.style.cssText = "display:flex; flex-direction:column; gap:10px;";

  const themeState: Partial<CpLoginTheme> = {};
  TOKEN_LIST.forEach((token) => {
    themeState[token.key] = String((theme as any)[token.key]);
  });

  const effectsState = { ...effects };

  TOKEN_LIST.forEach((token) => {
    const row = document.createElement("div");
    row.style.cssText = "display:grid; grid-template-columns: 180px 1fr 44px; gap:12px; align-items:center;";

    const label = document.createElement("div");
    label.textContent = token.label;
    label.style.cssText = "font-size:12px; color: var(--ic-mutedText, #a7b0b7);";

    const input = document.createElement("input");
    input.value = String(themeState[token.key] || "");
    input.disabled = readOnly;
    input.style.cssText = "padding:6px 10px; border-radius:8px; border:1px solid var(--ic-border, #2b3136); background: var(--ic-panel, #1a1d1f); color: var(--ic-text, #e7ecef); font-size:12px;";
    input.onchange = () => {
      themeState[token.key] = input.value as any;
      swatch.style.background = input.value;
    };

    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.disabled = readOnly;
    swatch.style.cssText = "width:38px; height:26px; border-radius:6px; border:1px solid var(--ic-border, #2b3136); background: transparent; cursor:pointer;";
    swatch.style.background = String(themeState[token.key] || "");
    swatch.onclick = () => openTokenEditor(token, input, swatch, themeState, effectsState);

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(swatch);
    list.appendChild(row);
  });

  tokenBody.appendChild(controlRow);
  tokenBody.appendChild(actionsRow);
  tokenBody.appendChild(list);

  const { card: effectsCard, body: effectsBody } = createSectionCard({
    title: "Metallic Preview",
    description: "Effet visuel optionnel (preview/login) sans changer les tokens"
  });

  const metallicRow = document.createElement("div");
  metallicRow.style.cssText = "display:flex; align-items:center; gap:12px;";

  const metallicToggle = document.createElement("input");
  metallicToggle.type = "checkbox";
  metallicToggle.checked = effectsState.metallic.enabled;
  metallicToggle.disabled = readOnly;

  const metallicLabel = document.createElement("span");
  metallicLabel.textContent = "Metallic effect";
  metallicLabel.style.cssText = "font-size:13px;";

  const metallicIntensity = document.createElement("input");
  metallicIntensity.type = "range";
  metallicIntensity.min = "0";
  metallicIntensity.max = "1";
  metallicIntensity.step = "0.05";
  metallicIntensity.value = String(effectsState.metallic.intensity);
  metallicIntensity.disabled = readOnly;

  metallicToggle.onchange = () => {
    effectsState.metallic.enabled = metallicToggle.checked;
  };
  metallicIntensity.oninput = () => {
    effectsState.metallic.intensity = Number(metallicIntensity.value);
  };

  metallicRow.appendChild(metallicToggle);
  metallicRow.appendChild(metallicLabel);
  metallicRow.appendChild(metallicIntensity);
  effectsBody.appendChild(metallicRow);

  content.appendChild(tokenCard);
  content.appendChild(effectsCard);
  root.appendChild(shell);
}

function handleSave(readOnly: boolean, tokens: Partial<CpLoginTheme>, effects: { metallic: { enabled: boolean; intensity: number } }) {
  if (readOnly) return;
  const res = saveLoginThemeOverride({ tokens, effects });
  if (res.ok) {
    showToast({ status: "success", message: "Override sauvegardé" });
  } else {
    showToast({ status: "error", message: `Save failed: ${res.reason || "unknown"}` });
  }
}

function handleReset(readOnly: boolean) {
  if (readOnly) return;
  const res = clearLoginThemeOverride();
  if (res.ok) {
    showToast({ status: "info", message: "Override supprimé" });
  } else {
    showToast({ status: "error", message: `Reset failed: ${res.reason || "unknown"}` });
  }
}

function openExportModal() {
  const payload = exportLoginThemeOverride();
  openModal("Export JSON", payload, false);
}

function openImportModal(readOnly: boolean) {
  if (readOnly) return;
  openModal("Import JSON", "", true, (value) => {
    const res = importLoginThemeOverride(value);
    if (res.ok) {
      showToast({ status: "success", message: "Override importé" });
    } else {
      showToast({ status: "error", message: `Import failed: ${res.reason || "unknown"}` });
    }
  });
}

function openTokenEditor(
  token: { key: string; label: string; type: "color" | "gradient" | "value" },
  input: HTMLInputElement,
  swatch: HTMLButtonElement,
  tokens: Partial<CpLoginTheme>,
  effects: { metallic: { enabled: boolean; intensity: number } }
) {
  const initial = input.value;
  const body = document.createElement("div");
  body.style.cssText = "display:flex; flex-direction:column; gap:12px;";

  const textInput = document.createElement("input");
  textInput.value = initial;
  textInput.style.cssText = "padding:8px 10px; border-radius:8px; border:1px solid #2b3136; background:#11161d; color:#e5e7eb;";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = guessHex(initial);

  const preview = document.createElement("div");
  preview.style.cssText = "height:46px; border-radius:10px; border:1px solid #2b3136;";
  applySwatch(preview, initial, effects.metallic);

  const applyValue = (val: string) => {
    tokens[token.key] = val as any;
    input.value = val;
    swatch.style.background = val;
    applySwatch(preview, val, effects.metallic);
  };

  textInput.oninput = () => applyValue(textInput.value);
  colorInput.oninput = () => applyValue(colorInput.value);

  body.appendChild(textInput);
  body.appendChild(colorInput);
  body.appendChild(preview);

  if (token.type === "gradient") {
    const gradientEditor = createGradientEditor(initial, applyValue);
    body.appendChild(gradientEditor);
  }

  openCustomModal(`Edit ${token.label}`, body);
}

function applySwatch(target: HTMLElement, value: string, metallic: { enabled: boolean; intensity: number }) {
  target.style.background = value;
  if (metallic.enabled) {
    const intensity = Math.max(0, Math.min(1, metallic.intensity));
    target.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,${0.08 * intensity}), 0 0 12px rgba(255,255,255,${0.12 * intensity})`;
  } else {
    target.style.boxShadow = "";
  }
}

function createGradientEditor(value: string, onChange: (val: string) => void): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "display:flex; flex-direction:column; gap:10px;";

  const typeSelect = document.createElement("select");
  ["linear", "radial"].forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });

  const angleInput = document.createElement("input");
  angleInput.type = "number";
  angleInput.value = "135";
  angleInput.style.cssText = "width:100px;";

  const stops = document.createElement("div");
  stops.style.cssText = "display:flex; flex-direction:column; gap:8px;";

  const state = parseGradient(value) || {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#4f46e5", pos: 0 },
      { color: "#7c3aed", pos: 100 }
    ]
  };

  typeSelect.value = state.type;
  angleInput.value = String(state.angle);

  const renderStops = () => {
    stops.innerHTML = "";
    state.stops.forEach((stop, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; gap:8px; align-items:center;";
      const color = document.createElement("input");
      color.type = "color";
      color.value = stop.color;
      const pos = document.createElement("input");
      pos.type = "number";
      pos.min = "0";
      pos.max = "100";
      pos.value = String(stop.pos);
      pos.style.cssText = "width:70px;";
      color.oninput = () => { stop.color = color.value; onChange(buildGradient(state)); };
      pos.oninput = () => { stop.pos = Number(pos.value); onChange(buildGradient(state)); };
      row.appendChild(color);
      row.appendChild(pos);
      stops.appendChild(row);
    });
  };

  const addStop = document.createElement("button");
  addStop.type = "button";
  addStop.textContent = "Add stop";
  addStop.onclick = () => rememberStop(state, renderStops, onChange);

  typeSelect.onchange = () => { state.type = typeSelect.value as "linear" | "radial"; onChange(buildGradient(state)); };
  angleInput.oninput = () => { state.angle = Number(angleInput.value); onChange(buildGradient(state)); };

  renderStops();
  container.appendChild(typeSelect);
  container.appendChild(angleInput);
  container.appendChild(stops);
  container.appendChild(addStop);
  return container;
}

function rememberStop(state: { stops: Array<{ color: string; pos: number }> }, renderStops: () => void, onChange: (val: string) => void) {
  state.stops.push({ color: "#ffffff", pos: 50 });
  renderStops();
  onChange(buildGradient(state as any));
}

function buildGradient(state: { type: "linear" | "radial"; angle: number; stops: Array<{ color: string; pos: number }> }): string {
  const stops = state.stops
    .slice()
    .sort((a, b) => a.pos - b.pos)
    .map((stop) => `${stop.color} ${stop.pos}%`)
    .join(", ");
  if (state.type === "radial") {
    return `radial-gradient(circle at 50% 50%, ${stops})`;
  }
  return `linear-gradient(${state.angle}deg, ${stops})`;
}

function parseGradient(value: string): { type: "linear" | "radial"; angle: number; stops: Array<{ color: string; pos: number }> } | null {
  const match = value.match(/(linear|radial)-gradient\((.*)\)/i);
  if (!match) return null;
  const type = match[1] === "radial" ? "radial" : "linear";
  const raw = match[2];
  const parts = splitGradientArgs(raw);
  let angle = 135;
  let stopsStart = 0;
  if (type === "linear" && parts[0]?.includes("deg")) {
    angle = parseFloat(parts[0]);
    stopsStart = 1;
  }
  const stops = parts.slice(stopsStart).map((item) => {
    const trimmed = item.trim();
    const matchStop = trimmed.match(/(.*)\s+(\d+)%/);
    if (!matchStop) return { color: trimmed, pos: 0 };
    return { color: matchStop[1].trim(), pos: Number(matchStop[2]) };
  });
  return { type, angle, stops };
}

function splitGradientArgs(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const char of value) {
    if (char === "(" ) depth += 1;
    if (char === ")" ) depth -= 1;
    if (char === "," && depth === 0) {
      out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += char;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function guessHex(value: string): string {
  if (value.startsWith("#")) return value.slice(0, 7);
  return "#7c3aed";
}

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.style.cssText = "padding:6px 10px; border-radius:8px; border:1px solid var(--ic-border, #2b3136); background: var(--ic-panel, #1a1d1f); color: var(--ic-text, #e7ecef); font-size:12px; cursor:pointer;";
  btn.onclick = onClick;
  return btn;
}

function openModal(title: string, content: string, editable: boolean, onSave?: (value: string) => void) {
  const body = document.createElement("div");
  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.style.cssText = "width:100%; height:180px; padding:8px; background:#0f141b; color:#e5e7eb; border:1px solid #2b3136; border-radius:8px;";
  textarea.readOnly = !editable;
  body.appendChild(textarea);
  openCustomModal(title, body, editable ? () => onSave?.(textarea.value) : undefined);
}

function openCustomModal(title: string, body: HTMLElement, onSave?: () => void) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed; inset:0; background: rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index: 9999;";
  const modal = document.createElement("div");
  modal.style.cssText = "background:#0f141b; border:1px solid #2b3136; border-radius:12px; padding:16px; width:520px; max-width:90vw; color:#e5e7eb; display:flex; flex-direction:column; gap:12px;";
  const heading = document.createElement("div");
  heading.textContent = title;
  heading.style.cssText = "font-weight:700; font-size:14px;";
  const actions = document.createElement("div");
  actions.style.cssText = "display:flex; justify-content:flex-end; gap:8px;";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.style.cssText = "padding:6px 10px; border-radius:8px; border:1px solid #2b3136; background:#0b0f15; color:#e5e7eb;";
  close.onclick = () => overlay.remove();
  actions.appendChild(close);
  if (onSave) {
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Save";
    save.style.cssText = "padding:6px 10px; border-radius:8px; border:1px solid #2b3136; background:#1f2937; color:#e5e7eb;";
    save.onclick = () => { onSave(); overlay.remove(); };
    actions.appendChild(save);
  }
  modal.appendChild(heading);
  modal.appendChild(body);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
