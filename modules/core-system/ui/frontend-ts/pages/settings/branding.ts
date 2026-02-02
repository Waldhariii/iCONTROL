import { getSession } from "../_shared/localAuth";
import type { Role } from "/src/runtime/rbac";
import { navigate } from "/src/router";
import { safeRender } from "../_shared/mainSystem.shared";
import { getBrandResolved, setBrandLocalOverride, clearBrandLocalOverride } from "../../../../../../platform-services/branding/brandService";
import { MAIN_SYSTEM_THEME } from "../_shared/mainSystem.data";
const UI = {
  WRAP: "max-width:980px;margin:20px auto;padding:0 16px",
  TITLE: "font-size:18px;font-weight:900;margin-bottom:8px",
  TABLE: "width:100%;border-collapse:collapse",
  KEY_CELL: "padding:8px;border-bottom:1px solid var(--ic-border);color:var(--ic-mutedText);width:40%",
  VAL_CELL: "padding:8px;border-bottom:1px solid var(--ic-border)",
  LOGOS: "margin-top:12px;color:var(--ic-mutedText)"
} as const;

function getRole(): Role {
  const s = getSession();
  return (s?.role || "USER") as Role;
}

function canEdit(): boolean {
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return map[m] || m;
  });
}

function setTitleFromBrand(): void {
  try {
    const res = getBrandResolved();
    const b = res.brand;
    const suffix = b.TITLE_SUFFIX && b.TITLE_SUFFIX.trim() ? " " + b.TITLE_SUFFIX.trim() : "";
    document.title = (b.APP_DISPLAY_NAME || "iCONTROL") + suffix;
  } catch {
    // no-op
  }
}

export function renderBrandingSettings(root: HTMLElement): void {
  if (!root) return;

  if (!canEdit()) {
    navigate("#/dashboard");
    const html = `
      <div style="max-width:980px;margin:26px auto;padding:0 16px">
        <div style="font-size:22px;font-weight:900">Parametres — Identité & marque</div>
        <div style="color:var(--ic-mutedText);margin-top:8px">Acces refuse (SYSADMIN/DEVELOPER requis).</div>
      </div>
    `;
    safeRender(root, () => {
      root.innerHTML = html;
    });
    return;
  }

  const res = getBrandResolved();
  const currentName = res.brand.APP_DISPLAY_NAME || "iCONTROL";

  const html = `
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:22px;font-weight:900">Parametres — Identité & marque</div>
        <a id="back_settings" href="#/settings" style="color:var(--ic-mutedText);text-decoration:underline">Retour parametres</a>
      </div>
      <div style="color:var(--ic-mutedText);margin-top:8px">Changer le nom affiche sans toucher au code (localStorage).</div>

      <div style="margin-top:16px;max-width:520px;display:flex;flex-direction:column;gap:10px">
        <label style="color:var(--ic-mutedText)">Nom de l'application</label>
        <input id="brand_app_name" value="${escapeHtml(currentName)}" placeholder="Ex: Innovex Control"
          style="padding:10px 12px;border-radius:12px;border:1px solid var(--ic-border);background:var(--ic-panel);color:var(--ic-text)" />

        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
          <button id="brand_save" style="padding:10px 12px;border-radius:12px;border:1px solid var(--ic-border);background:var(--ic-accent2);color:var(--ic-text);font-weight:800;cursor:pointer">Sauvegarder</button>
          <button id="brand_reset" style="padding:10px 12px;border-radius:12px;border:1px solid var(--ic-border);background:var(--ic-panel);color:var(--ic-text);cursor:pointer">Reset</button>
        </div>

        <div id="brand_status" style="color:var(--ic-mutedText);margin-top:8px"></div>
      </div>
    </div>
  `;
  safeRender(root, () => {
    root.innerHTML = html;
  });

  const input = root.querySelector<HTMLInputElement>("#brand_app_name");
  const status = root.querySelector<HTMLDivElement>("#brand_status");
  const save = root.querySelector<HTMLButtonElement>("#brand_save");
  const reset = root.querySelector<HTMLButtonElement>("#brand_reset");

  const setStatus = (msg: string) => {
    if (status) status.textContent = msg;
  };

  if (save) {
    save.addEventListener("click", () => {
      const v = (input?.value || "").trim();
      if (!v) {
        setStatus("Nom invalide.");
        return;
      }
      const resSave = setBrandLocalOverride({
        APP_DISPLAY_NAME: v,
        APP_SHORT_NAME: v
      });
      if (resSave.ok) {
        setTitleFromBrand();
        setStatus("Sauvegarde reussie.");
      } else {
        setStatus("Erreur: " + (resSave.warnings || []).join(", "));
      }
    });
  }

  if (reset) {
    reset.addEventListener("click", () => {
      clearBrandLocalOverride();
      const next = getBrandResolved();
      if (input) input.value = next.brand.APP_DISPLAY_NAME || "iCONTROL";
      setTitleFromBrand();
      setStatus("Reset applique.");
    });
  }

  const back = root.querySelector<HTMLAnchorElement>("#back_settings");
  if (back) back.addEventListener("click", (e) => {
    e.preventDefault();
    navigate("#/settings");
  });

  renderThemePackSection(root);
}

function renderThemePackSection(root: HTMLElement): void {
  const wrap = document.createElement("section");
  wrap.setAttribute("style", UI.WRAP);

  const title = document.createElement("div");
  title.setAttribute("style", UI.TITLE);
  title.textContent = "Theme pack v1 (read-only)";
  wrap.appendChild(title);

  const table = document.createElement("table");
  table.setAttribute("style", UI.TABLE);
  Object.entries(MAIN_SYSTEM_THEME.tokens).forEach(([key, value]) => {
    const tr = document.createElement("tr");
    const tdKey = document.createElement("td");
    tdKey.setAttribute("style", UI.KEY_CELL);
    tdKey.textContent = key;
    const tdVal = document.createElement("td");
    tdVal.setAttribute("style", UI.VAL_CELL);
    tdVal.textContent = String(value);
    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  });

  wrap.appendChild(table);

  const logos = document.createElement("div");
  logos.setAttribute("style", UI.LOGOS);
  logos.textContent = "Logos: light/dark slots (empty in intake).";
  wrap.appendChild(logos);

  root.appendChild(wrap);
}
