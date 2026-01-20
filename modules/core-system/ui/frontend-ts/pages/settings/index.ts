import { safeRender } from "/src/core/runtime/safe";
import { renderRecommendations } from "../../shared/recommendations";
import { getRole, getSafeMode } from "../../shared/recommendations.ctx";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { canAccessPage, type Role } from "../../shared/rolePolicy";
import { mountSections, type SectionSpec } from "../../shared/sections";

const UI = {
  WRAP: "width:100%;max-width:100%;margin:26px 0;padding:0 clamp(16px,2vw,24px)",
  TITLE: "font-size:22px;font-weight:900",
  DESC: "color:var(--ic-mutedText);margin-top:8px",
  GRID: "margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px",
  CARD: "padding:14px;border-radius:18px;background:var(--ic-card);border:1px solid var(--ic-border);color:var(--ic-text)",
  CARD_TITLE: "font-weight:900",
  CARD_TEXT: "color:var(--ic-mutedText);margin-top:6px",
  WRAP_GRID: "width:100%;max-width:100%;margin:0;padding:0 clamp(16px,2vw,24px)"
} as const;

export function renderSettingsPage(root: HTMLElement): void {
  if (!root) return;
  const role = getRole() as Role;
  const pageDecision = canAccessPage(role, "parametres");
  if (!pageDecision.allow) {
    renderAccessDenied(root, pageDecision.reason);
    return;
  }

  const sections: SectionSpec[] = [
    {
      id: "settings-recommendations",
      title: "Recommandations",
      render: (host) => {
        renderRecommendations(host, {
          pageId: "settings",
          scopeId: "settings",
          role,
          safeMode: getSafeMode()
        });
      }
    },
    {
      id: "settings-header",
      title: "Parametres",
      render: (host) => {
        const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
        wrap.setAttribute("style", UI.WRAP);
        const title = document.createElement("div");
        title.setAttribute("style", UI.TITLE);
        title.textContent = "Parametres";
        const desc = document.createElement("div");
        desc.setAttribute("style", UI.DESC);
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
        grid.setAttribute("style", UI.GRID);

        const cardAccount = document.createElement("div");
        cardAccount.setAttribute("style", UI.CARD);
        const accountTitle = document.createElement("div");
        accountTitle.setAttribute("style", UI.CARD_TITLE);
        accountTitle.textContent = "Compte";
        const accountText = document.createElement("div");
        accountText.setAttribute("style", UI.CARD_TEXT);
        accountText.textContent = "Preferences et securite.";
        cardAccount.appendChild(accountTitle);
        cardAccount.appendChild(accountText);

        const cardSystem = document.createElement("div");
        cardSystem.setAttribute("style", UI.CARD);
        const systemTitle = document.createElement("div");
        systemTitle.setAttribute("style", UI.CARD_TITLE);
        systemTitle.textContent = "Systeme";
        const systemText = document.createElement("div");
        systemText.setAttribute("style", UI.CARD_TEXT);
        systemText.textContent = "Diagnostics et maintenance.";
        cardSystem.appendChild(systemTitle);
        cardSystem.appendChild(systemText);

        grid.appendChild(cardAccount);
        grid.appendChild(cardSystem);

        const wrap = document.createElement("div");
        wrap.setAttribute("style", UI.WRAP_GRID);
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
