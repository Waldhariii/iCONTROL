import { getSession } from "/src/localAuth";
import { navigate } from "/src/router";

type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

function getRole(): Role {
  const s = getSession();
  return (s?.role || "USER") as Role;
}

function canSeeBranding(): boolean {
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

export function renderSettingsPage(root: HTMLElement): void {
  if (!root) return;

  const showBranding = canSeeBranding();

  root.innerHTML = `
    <div style="max-width:980px;margin:26px auto;padding:0 16px">
      <div style="font-size:22px;font-weight:900">Parametres</div>
      <div style="opacity:.8;margin-top:8px">Configuration du systeme.</div>

      <div style="margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Compte</div>
          <div style="opacity:.8;margin-top:6px">Preferences et securite.</div>
        </div>
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:900">Systeme</div>
          <div style="opacity:.8;margin-top:6px">Diagnostics et maintenance.</div>
        </div>
      </div>

      ${showBranding ? `
      <div style="margin-top:16px;padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
        <div style="font-weight:900">Identite & Marque</div>
        <div style="opacity:.8;margin-top:6px">Nom, logo, et presentation.</div>
        <button id="go_branding" style="margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:inherit;cursor:pointer">Branding</button>
      </div>
      ` : ""}
    </div>
  `;

  if (showBranding) {
    const btn = root.querySelector<HTMLButtonElement>("#go_branding");
    if (btn) btn.onclick = () => navigate("#/settings/branding");
  }
}

// EXPECTED RESULT:
// - Login as sysadmin -> #/settings -> "Identite & Marque" card visible -> Branding opens #/settings/branding.
// - Login as admin -> #/settings -> card not visible. Direct #/settings/branding -> redirect to #/dashboard.
