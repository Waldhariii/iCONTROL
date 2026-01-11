import { safeRender } from "../_shared/mainSystem.shared";
import { MAIN_SYSTEM_THEME } from "../_shared/mainSystem.data";
import { renderRecommendations } from "../_shared/recommendations";
import { getRole, getSafeMode } from "../_shared/recommendations.ctx";
import { mountSections, type SectionSpec } from "../_shared/sections";

export function renderSettingsPage(root: HTMLElement): void {
  if (!root) return;

  const sections: SectionSpec[] = [
    {
      id: "settings-recommendations",
      title: "Recommandations",
      render: (host) => {
        renderRecommendations(host, {
          pageId: "settings",
          scopeId: "settings",
          role: getRole(),
          safeMode: getSafeMode()
        });
      }
    },
    {
      id: "settings-header",
      title: "Parametres",
      render: (host) => {
        const wrap = document.createElement("div");
        wrap.setAttribute("style", "max-width:980px;margin:26px auto;padding:0 16px");
        const title = document.createElement("div");
        title.setAttribute("style", "font-size:22px;font-weight:900");
        title.textContent = "Parametres";
        const desc = document.createElement("div");
        desc.setAttribute("style", "opacity:.8;margin-top:8px");
        desc.textContent = "Configuration du systeme.";
        wrap.appendChild(title);
        wrap.appendChild(desc);
        host.appendChild(wrap);
      }
    },
    {
      id: "settings-cards",
      title: "Cartes",
      render: (host) => {
        const grid = document.createElement("div");
        grid.setAttribute("style", "margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px");

        const cardAccount = document.createElement("div");
        cardAccount.setAttribute(
          "style",
          `padding:14px;border-radius:18px;background:${MAIN_SYSTEM_THEME.tokens.card};border:1px solid ${MAIN_SYSTEM_THEME.tokens.border}`
        );
        const accountTitle = document.createElement("div");
        accountTitle.setAttribute("style", "font-weight:900");
        accountTitle.textContent = "Compte";
        const accountText = document.createElement("div");
        accountText.setAttribute("style", "opacity:.8;margin-top:6px");
        accountText.textContent = "Preferences et securite.";
        cardAccount.appendChild(accountTitle);
        cardAccount.appendChild(accountText);

        const cardSystem = document.createElement("div");
        cardSystem.setAttribute(
          "style",
          `padding:14px;border-radius:18px;background:${MAIN_SYSTEM_THEME.tokens.card};border:1px solid ${MAIN_SYSTEM_THEME.tokens.border}`
        );
        const systemTitle = document.createElement("div");
        systemTitle.setAttribute("style", "font-weight:900");
        systemTitle.textContent = "Systeme";
        const systemText = document.createElement("div");
        systemText.setAttribute("style", "opacity:.8;margin-top:6px");
        systemText.textContent = "Diagnostics et maintenance.";
        cardSystem.appendChild(systemTitle);
        cardSystem.appendChild(systemText);

        grid.appendChild(cardAccount);
        grid.appendChild(cardSystem);

        const wrap = document.createElement("div");
        wrap.setAttribute("style", "max-width:980px;margin:0 auto;padding:0 16px");
        wrap.appendChild(grid);
        host.appendChild(wrap);
      }
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "settings" });
  });
}
