import { coreBaseStyles } from "../shared/coreStyles";
import { logout, requireSession } from "../../../../../platform-services/security/auth/localAuth";
import { safeRender } from "./_shared/mainSystem.shared";

export function renderDashboard(root: HTMLElement): void {
  safeRender(root, () => {
    const s = requireSession();
    root.innerHTML = `
      ${coreBaseStyles()}
      <div class="cxWrap" style="align-items:flex-start; padding-top:38px;">
        <div class="cxCard" style="width:min(920px,92vw);">
          <div class="cxRow">
            <div>
              <div class="cxTitle">Dashboard</div>
              <div class="cxMuted">Core System — page socle. Widgets viendront ensuite via registry.</div>
            </div>
            <button class="cxBtn" style="width:auto; margin-top:0;" id="cxLogout">Déconnexion</button>
          </div>

          <div style="margin-top:16px; border:1px solid var(--line); border-radius:14px; padding:14px;">
            <div><b>Utilisateur</b>: ${s.username}</div>
            <div><b>Rôle</b>: ${s.role}</div>
          </div>

          <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="cxBtn" style="width:auto; margin-top:0;" id="cxGoLogin">Retour Login</button>
          </div>
        </div>
      </div>
    `;

    const out = document.getElementById("cxLogout") as HTMLButtonElement | null;
    const back = document.getElementById("cxGoLogin") as HTMLButtonElement | null;
    if (out) out.onclick = () => { logout(); location.hash = "#/login"; };
    if (back) back.onclick = () => { location.hash = "#/login"; };
  });
}
