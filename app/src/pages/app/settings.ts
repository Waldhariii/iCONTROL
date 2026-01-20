/**
 * ICONTROL_APP_SETTINGS_V1
 * Page Paramètres pour l'application CLIENT (/app)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";

export function renderSettingsPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "align-items:flex-start; padding-top:38px;");
  const card = document.createElement("div");
  card.className = "cxCard";
  card.setAttribute("style", "width:min(920px,92vw);");
  wrap.appendChild(card);
  root.appendChild(wrap);

  const title = document.createElement("div");
  title.className = "cxTitle";
  title.textContent = "Paramètres - Application Client";
  const desc = document.createElement("div");
  desc.className = "cxMuted";
  desc.textContent = "Configurez vos préférences pour l'application client.";
  card.appendChild(title);
  card.appendChild(desc);

  const s = requireSession();
  const settingsBox = document.createElement("div");
  settingsBox.setAttribute("style", "margin-top:16px; padding:14px; border:1px solid var(--ic-border); border-radius:14px;");
  settingsBox.innerHTML = `
    <div><b>Préférences utilisateur</b></div>
    <div style="margin-top:12px;">
      <div><b>Utilisateur</b>: ${s.username}</div>
      <div><b>Rôle</b>: ${s.role}</div>
    </div>
    <div style="margin-top:16px; color:var(--ic-mutedText);">
      Paramètres de l'application client — à venir: préférences d'affichage, notifications, etc.
    </div>
  `;
  card.appendChild(settingsBox);
}
