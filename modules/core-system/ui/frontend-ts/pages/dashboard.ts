import { coreBaseStyles } from "../shared/coreStyles";
import { logout, requireSession } from "../../../../../platform-services/security/auth/localAuth";
import { mountSections, type SectionSpec } from "./_shared/sections";
import { safeRender } from "./_shared/mainSystem.shared";

export function renderDashboard(root: HTMLElement): void {
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

    const sections: SectionSpec[] = [
      {
        id: "dashboard-header",
        title: "Dashboard",
        render: (host) => {
          const row = document.createElement("div");
          row.className = "cxRow";

          const left = document.createElement("div");
          const title = document.createElement("div");
          title.className = "cxTitle";
          title.textContent = "Dashboard";
          const muted = document.createElement("div");
          muted.className = "cxMuted";
          muted.textContent = "Core System — page socle. Widgets viendront ensuite via registry.";
          left.appendChild(title);
          left.appendChild(muted);

          const btn = document.createElement("button");
          btn.className = "cxBtn";
          btn.setAttribute("style", "width:auto; margin-top:0;");
          btn.id = "cxLogout";
          btn.textContent = "Déconnexion";
          btn.addEventListener("click", () => {
            logout();
            location.hash = "#/login";
          });

          row.appendChild(left);
          row.appendChild(btn);
          host.appendChild(row);
        }
      },
      {
        id: "dashboard-user",
        title: "Utilisateur",
        render: (host) => {
          const s = requireSession();
          const box = document.createElement("div");
          box.setAttribute("style", "margin-top:16px; border:1px solid var(--line); border-radius:14px; padding:14px;");
          const lineUser = document.createElement("div");
          const bUser = document.createElement("b");
          bUser.textContent = "Utilisateur";
          lineUser.appendChild(bUser);
          lineUser.appendChild(document.createTextNode(`: ${s.username}`));

          const lineRole = document.createElement("div");
          const bRole = document.createElement("b");
          bRole.textContent = "Rôle";
          lineRole.appendChild(bRole);
          lineRole.appendChild(document.createTextNode(`: ${s.role}`));

          box.appendChild(lineUser);
          box.appendChild(lineRole);
          host.appendChild(box);
        }
      },
      {
        id: "dashboard-actions",
        title: "Actions",
        render: (host) => {
          const row = document.createElement("div");
          row.setAttribute("style", "margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;");
          const back = document.createElement("button");
          back.className = "cxBtn";
          back.setAttribute("style", "width:auto; margin-top:0;");
          back.id = "cxGoLogin";
          back.textContent = "Retour Login";
          back.addEventListener("click", () => {
            location.hash = "#/login";
          });
          row.appendChild(back);
          host.appendChild(row);
        }
      }
    ];

    mountSections(card, sections, { page: "dashboard" });
  });
}

export const dashboardSections = ["dashboard-header", "dashboard-user", "dashboard-actions"];
