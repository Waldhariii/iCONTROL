/**
 * ICONTROL_CP_USERS_V3
 * Page Utilisateurs pour l'application ADMINISTRATION (/cp)
 * Liste cliquable des utilisateurs pour modifier leurs permissions
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { renderAccessDenied, safeRender } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared";
import { createUsersModelCp } from "./models/users";
import { renderUsersListCp } from "./views/users";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/users/contract";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";

export function renderUsers(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createUsersModelCp();

  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();
    const wrap = document.createElement("div");
    wrap.className = "cxWrap";
    wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");

    const safeModeBadge = safeMode === "STRICT" ? "STRICT" : safeMode === "COMPAT" ? "COMPAT" : "OFF";
    const { shell, content } = createPageShell({
      title: model.title,
      subtitle: "Gestion des utilisateurs et de leurs permissions",
      safeMode: safeModeBadge as "OFF" | "COMPAT" | "STRICT"
    });

    const { card: infoCard, body: infoBody } = createSectionCard({
      title: "Contexte",
      description: "Administration (CP)"
    });

    const s = requireSession();
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText = `
      display: grid;
      gap: 8px;
    `;
    infoDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--ic-mutedText, var(--muted));">Application</span>
        <span style="font-weight:600;color:var(--ic-text, var(--text));">Administration (CP)</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--ic-mutedText, var(--muted));">Administrateur actuel</span>
        <span style="font-weight:600;color:var(--ic-text, var(--text));">${s.username} <span style="color:var(--ic-accent, var(--accent));">(${s.username === "Master" ? "Master" : s.role})</span></span>
      </div>
    `;
    infoBody.appendChild(infoDiv);
    content.appendChild(infoCard);

    // Contenu - Liste des utilisateurs
    renderUsersListCp(content, model);

    wrap.appendChild(shell);
    root.appendChild(wrap);
  });
}
