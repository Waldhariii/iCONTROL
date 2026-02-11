import { webStorage } from "../../../platform/storage/webStorage";
import { listCatalogEntries, type CatalogState, type CatalogSurface } from "./registry";
import { registerDefaultCatalogEntries } from "./defaults";
import { isEnabled } from "../../../policies/feature_flags.enforce";
import { createAuditHook } from "../../write-gateway/auditHook";
import { createLegacyAdapter } from "../../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../write-gateway/writeGateway";
import { getLogger } from "../../utils/logger";
import { getTenantId } from "../../runtime/tenant";

const THEME_TOKENS = {
  dark: {
    bg: "var(--icontrol-color-fallback-fg)",
    panel: "var(--icontrol-color-fallback-fg)",
    card: "var(--icontrol-color-fallback-fg)",
    border: "var(--icontrol-color-fallback-fg)",
    text: "var(--icontrol-color-fallback-fg)",
    mutedText: "var(--icontrol-color-fallback-fg)",
  },
  light: {
    bg: "var(--icontrol-color-fallback-fg)",
    panel: "var(--icontrol-color-fallback-fg)",
    card: "var(--icontrol-color-fallback-fg)",
    border: "var(--icontrol-color-fallback-fg)",
    text: "var(--icontrol-color-fallback-fg)",
    mutedText: "var(--icontrol-color-fallback-fg)",
  },
};

const STATES: CatalogState[] = [
  "default",
  "loading",
  "empty",
  "error",
  "accessDenied",
  "safeMode",
  "readOnly",
];

/** WRITE_GATEWAY_UI_CATALOG — shadow scaffold (legacy-first; NO-OP adapter). */
const __wsLogger = getLogger("WRITE_GATEWAY_UI_CATALOG");
let __wsGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveWsGateway() {
  if (__wsGateway) return __wsGateway;
  __wsGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "uiCatalogShadowNoop"),
    safeMode: { enabled: true },
  });
  return __wsGateway;
}

const __isWsShadowEnabled = (): boolean => {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "ui_catalog_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["ui_catalog_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
};

function applyTheme(mode: "light" | "dark"): void {
  const tokens = THEME_TOKENS[mode];
  const root = document.documentElement;
  root.style.setProperty("--ic-bg", tokens.bg);
  root.style.setProperty("--ic-panel", tokens.panel);
  root.style.setProperty("--ic-card", tokens.card);
  root.style.setProperty("--ic-border", tokens.border);
  root.style.setProperty("--ic-text", tokens.text);
  root.style.setProperty("--ic-mutedText", tokens.mutedText);

  let wrote = false;
  try {
    webStorage.set("icontrol_settings_v1.theme", mode);
    wrote = true;
  } catch {}

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  if (!wrote || !__isWsShadowEnabled()) return;

  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  const correlationId = createCorrelationId("uiCatalog");
  const cmd = {
    kind: "UI_CATALOG_WRITE_SHADOW",
    tenantId,
    correlationId,
    payload: { key: "icontrol_settings_v1.theme", bytes: mode.length },
    meta: { shadow: true, source: "ui/catalog" },
  };

  try {
    const res = __resolveWsGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      __wsLogger.warn("WRITE_GATEWAY_UI_CATALOG_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    __wsLogger.warn("WRITE_GATEWAY_UI_CATALOG_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

function buildSelect(options: string[], value: string): HTMLSelectElement {
  const select = document.createElement("select");
  select.style.cssText = `
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
    background: var(--ic-card, var(--icontrol-color-fallback-fg));
    color: var(--ic-text, var(--icontrol-color-fallback-fg));
    font-size: 12px;
  `;
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    if (opt === value) option.selected = true;
    select.appendChild(option);
  });
  return select;
}

export function renderCatalog(root: HTMLElement, surface: CatalogSurface): void {
  registerDefaultCatalogEntries();
  root.innerHTML = "";

  const entries = listCatalogEntries(surface);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: var(--ic-text, var(--icontrol-color-fallback-fg));
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
    background: var(--ic-card, var(--icontrol-color-fallback-fg));
    border-radius: 12px;
  `;

  const title = document.createElement("div");
  title.textContent = `${surface.toUpperCase()} UI Catalog`;
  title.style.cssText = "font-size: 20px; font-weight: 700;";
  header.appendChild(title);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; flex-wrap:wrap; gap:12px; align-items:center;";

  const themeSelect = buildSelect(["dark", "light"], "dark");
  themeSelect.id = "ui-catalog-theme";
  const stateSelect = buildSelect(STATES, "default");
  stateSelect.id = "ui-catalog-state";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Filter components";
  searchInput.style.cssText = `
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
    background: var(--ic-card, var(--icontrol-color-fallback-fg));
    color: var(--ic-text, var(--icontrol-color-fallback-fg));
    font-size: 12px;
    min-width: 200px;
  `;

  const themeLabel = document.createElement("label");
  themeLabel.textContent = "Theme";
  themeLabel.style.cssText = "display:flex; gap:6px; align-items:center; font-size:12px;";
  themeLabel.appendChild(themeSelect);

  const stateLabel = document.createElement("label");
  stateLabel.textContent = "State";
  stateLabel.style.cssText = "display:flex; gap:6px; align-items:center; font-size:12px;";
  stateLabel.appendChild(stateSelect);

  controls.appendChild(themeLabel);
  controls.appendChild(stateLabel);
  controls.appendChild(searchInput);
  header.appendChild(controls);

  const catalog = document.createElement("div");
  catalog.style.cssText = "display:flex; flex-direction:column; gap:16px;";

  function renderEntries(): void {
    const filter = searchInput.value.trim().toLowerCase();
    catalog.innerHTML = "";
    const grouped = new Map<string, typeof entries>();

    entries.forEach((entry) => {
      if (filter && !entry.name.toLowerCase().includes(filter) && !entry.kind.includes(filter)) return;
      const bucket = grouped.get(entry.kind) || [];
      bucket.push(entry);
      grouped.set(entry.kind, bucket);
    });

    for (const [kind, items] of grouped.entries()) {
      const section = document.createElement("section");
      section.dataset["catalogSection"] = kind;
      section.style.cssText = "display:flex; flex-direction:column; gap:12px;";

      const heading = document.createElement("div");
      heading.textContent = kind.toUpperCase();
      heading.style.cssText = "font-size: 14px; font-weight: 700; letter-spacing: 0.4px;";
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
      `;

      items.forEach((entry) => {
        const card = document.createElement("div");
        card.dataset["catalogCard"] = entry.id;
        card.style.cssText = `
          border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
          background: var(--ic-card, var(--icontrol-color-fallback-fg));
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        `;

        const meta = document.createElement("div");
        meta.style.cssText = "display:flex; justify-content:space-between; gap:8px; align-items:center;";
        const name = document.createElement("div");
        name.textContent = entry.name;
        name.style.cssText = "font-size: 13px; font-weight: 600;";
        const badge = document.createElement("div");
        badge.textContent = entry.kind;
        badge.style.cssText = `
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid var(--ic-border, var(--icontrol-color-fallback-fg));
          color: var(--ic-mutedText, var(--icontrol-color-fallback-fg));
        `;
        meta.appendChild(name);
        meta.appendChild(badge);
        card.appendChild(meta);

        const preview = document.createElement("div");
        preview.style.cssText = "min-height: 60px;";
        const selectedState = stateSelect.value as CatalogState;
        const stateToUse = entry.supports?.includes(selectedState) ? selectedState : "default";
        entry.render(preview, { state: stateToUse });
        card.appendChild(preview);

        grid.appendChild(card);
      });

      section.appendChild(grid);
      catalog.appendChild(section);
    }
  }

  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value as "light" | "dark");
  });
  stateSelect.addEventListener("change", renderEntries);
  searchInput.addEventListener("input", renderEntries);

  applyTheme("dark");
  renderEntries();

  wrapper.appendChild(header);
  wrapper.appendChild(catalog);
  root.appendChild(wrapper);
}
