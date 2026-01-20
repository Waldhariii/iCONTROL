/**
 * ICONTROL_APP_USERS_V1
 * Page Utilisateurs pour l'application CLIENT (/app)
 * Utilise les modèles et vues APP séparés (aucun lien avec CP)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { renderAccessDenied, safeRender } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/sections";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/users/contract";
import { createUsersModelApp } from "./models/users";
import {
  renderUsersMenuAccessApp,
  renderUsersOverviewApp,
  renderUsersPermissionsApp,
  renderUsersRolesApp
} from "./views/users";

export function renderUsers(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createUsersModelApp();

  const sections: SectionSpec[] = [
    {
      id: "users-overview",
      title: model.title,
      render: (host) => renderUsersOverviewApp(host, model)
    },
    {
      id: "users-roles",
      title: "Roles catalog",
      render: (host) => renderUsersRolesApp(host, model)
    },
    {
      id: "users-permissions",
      title: "Role permissions",
      render: (host) => renderUsersPermissionsApp(host, model)
    },
    {
      id: "users-menu-access",
      title: "Menu access",
      render: (host) => renderUsersMenuAccessApp(host, model)
    }
  ];

  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();
    const wrap = document.createElement("div");
    wrap.className = "cxWrap";
    wrap.setAttribute("style", "align-items:flex-start; padding-top:38px;");
    const card = document.createElement("div");
    card.className = "cxCard";
    card.setAttribute("style", "width:min(920px,92vw);");
    wrap.appendChild(card);
    root.appendChild(wrap);

    const s = requireSession();
    const header = document.createElement("div");
    header.innerHTML = `
      <div class="cxTitle">${model.title}</div>
      <div class="cxMuted">Gestion des utilisateurs de l'application client.</div>
      <div style="margin-top:12px; padding:10px; border:1px solid var(--ic-border); border-radius:10px; background:rgba(255,255,255,0.02);">
        <div><b>Application</b>: Client (APP)</div>
        <div><b>Utilisateur actuel</b>: ${s.username} (${s.role})</div>
      </div>
    `;
    card.appendChild(header);

    mountSections(card, sections, { page: "users", role, safeMode });
  });
}
