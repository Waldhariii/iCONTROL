/**
 * ICONTROL_APP_ACCOUNT_V1
 * Page Compte pour l'application CLIENT (/app)
 * Utilise les modèles et vues APP séparés (aucun lien avec CP)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { renderAccessDenied, safeRender } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/sections";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/account/contract";
import { createAccountModelApp } from "./models/account";
import {
  renderAccountSettingsKeysApp,
  renderAccountStorageAllowApp,
  renderAccountStorageUsageApp,
  renderAccountSummaryApp
} from "./views/account";

export function renderAccount(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createAccountModelApp();

  const sections: SectionSpec[] = [
    {
      id: "account-summary",
      title: model.title,
      render: (host) => renderAccountSummaryApp(host, model)
    },
    {
      id: "account-settings-keys",
      title: "Settings keys",
      render: (host) => renderAccountSettingsKeysApp(host, model)
    },
    {
      id: "account-storage-allow",
      title: "Storage allow list",
      render: (host) => renderAccountStorageAllowApp(host, model)
    },
    {
      id: "account-storage-usage",
      title: "Storage usage",
      render: (host) => renderAccountStorageUsageApp(host, model)
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
      <div class="cxMuted">${model.description}</div>
      <div style="margin-top:12px; padding:10px; border:1px solid var(--ic-border); border-radius:10px; background:rgba(255,255,255,0.02);">
        <div><b>Application</b>: Client (APP)</div>
        <div><b>Utilisateur</b>: ${s.username}</div>
        <div><b>Rôle</b>: ${s.role}</div>
      </div>
    `;
    card.appendChild(header);

    mountSections(card, sections, { page: "account", role, safeMode });
  });
}
