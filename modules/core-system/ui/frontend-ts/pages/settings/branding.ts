import { getSession } from "../../../../../../app/src/localAuth";
import { navigate } from "../../../../../../app/src/router";
import { getBrandResolved, setBrandLocalOverride, clearBrandLocalOverride } from "../../../../../../platform-services/branding/brandService";

type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

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
    root.innerHTML = `
      <div style="max-width:980px;margin:26px auto;padding:0 16px">
        <div style="font-size:22px;font-weight:900">Parametres — Branding</div>
        <div style="opacity:.8;margin-top:8px">Acces refuse (SYSADMIN/DEVELOPER requis).</div>
      </div>
    `;
    return;
  }

  const res = getBrandResolved();
  const currentName = res.brand.APP_DISPLAY_NAME || "iCONTROL";

  root.innerHTML = `
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:22px;font-weight:900">Parametres — Branding</div>
        <a id="back_settings" href="#/settings" style="opacity:.8;text-decoration:underline">Retour parametres</a>
      </div>
      <div style="opacity:.8;margin-top:8px">Changer le nom affiche sans toucher au code (localStorage).</div>

      <div style="margin-top:16px;max-width:520px;display:flex;flex-direction:column;gap:10px">
        <label style="opacity:.8">Nom de l'application</label>
        <input id="brand_app_name" value="${escapeHtml(currentName)}" placeholder="Ex: Innovex Control"
          style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />

        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
          <button id="brand_save" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(183,217,75,0.15);color:inherit;font-weight:800;cursor:pointer">Sauvegarder</button>
          <button id="brand_reset" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:inherit;cursor:pointer">Reset</button>
        </div>

        <div id="brand_status" style="opacity:.8;margin-top:8px"></div>
      </div>
    </div>
  `;

  const input = root.querySelector<HTMLInputElement>("#brand_app_name");
  const status = root.querySelector<HTMLDivElement>("#brand_status");
  const save = root.querySelector<HTMLButtonElement>("#brand_save");
  const reset = root.querySelector<HTMLButtonElement>("#brand_reset");

  const setStatus = (msg: string) => {
    if (status) status.textContent = msg;
  };

  if (save) {
    save.onclick = () => {
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
    };
  }

  if (reset) {
    reset.onclick = () => {
      clearBrandLocalOverride();
      const next = getBrandResolved();
      if (input) input.value = next.brand.APP_DISPLAY_NAME || "iCONTROL";
      setTitleFromBrand();
      setStatus("Reset applique.");
    };
  }

  const back = root.querySelector<HTMLAnchorElement>("#back_settings");
  if (back) back.onclick = (e) => {
    e.preventDefault();
    navigate("#/settings");
  };
}
