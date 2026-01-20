import { coreBaseStyles } from "../shared/coreStyles";
import { logout, requireSession } from "/src/localAuth";
import { MAIN_SYSTEM_ENABLED, MAIN_SYSTEM_LAYOUT, MAIN_SYSTEM_MODULES } from "./shared/mainSystem.data";
import { appendList, appendTable, sectionCard } from "/src/core/ui/uiBlocks";
import { mountSections, type SectionSpec } from "./shared/sections";
import { safeRender } from "/src/core/runtime/safe";
import { requireEntitlement } from "/src/core/access";
import * as EntitlementsFacade from "./shared/entitlements";
import { navigate } from "/src/runtime/navigate";

const UI = {
  WRAP: "align-items:flex-start; padding-top:38px;",
  CARD: "width:100%; max-width:100%;",
  BTN: "width:auto; margin-top:0;",
  USER_BOX: "margin-top:16px; border:1px solid var(--ic-border); border-radius:14px; padding:14px;",
  ACTION_ROW: "margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;"
} as const;

export function renderDashboard(root: HTMLElement): void {
  // ICONTROL_ENTITLEMENTS_WIRING_DASHBOARD_V1
  // Enterprise baseline: read-only entitlements (no subscription write-model in UI).
  const __icEntitlementsDashboard = EntitlementsFacade.getEntitlementsForTenant("t1");
  void __icEntitlementsDashboard;
  // --- Access Guard (non-core) ---
  const __access = requireEntitlement("recommendations.pro", { page: "/dashboard", action: "view", scope: "ui" });
  if (!__access.ok) {
    const q = encodeURIComponent(__access.entitlement);
  navigate(`#/access-denied?entitlement=${q}`);
    return;
  }

  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();

    const wrap = document.createElement("div");
    wrap.className = "cxWrap";
    wrap.setAttribute("style", UI.WRAP);
    const card = document.createElement("div");
    card.className = "cxCard";
    card.setAttribute("style", UI.CARD);
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
          btn.setAttribute("style", UI.BTN);
          btn.id = "cxLogout";
          btn.textContent = "Déconnexion";
          btn.addEventListener("click", () => {
            logout();
  navigate("#/login");
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
          box.setAttribute("style", UI.USER_BOX);
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
        id: "dashboard-modules",
        title: "Modules",
        render: (host) => {
          const card = sectionCard("Modules registry");
          appendTable(
            card,
            ["ID", "Label", "Type", "Routes", "Active"],
            MAIN_SYSTEM_MODULES.map((mod) => ({
              ID: mod.id,
              Label: mod.label,
              Type: mod.type,
              Routes: mod.routes.join(", "),
              Active: mod.activeDefault ? "yes" : "no"
            }))
          );
          appendList(card, [`Enabled: ${MAIN_SYSTEM_ENABLED.join(", ")}`]);
          host.appendChild(card);
        }
      },
      {
        id: "dashboard-layout",
        title: "Layout pack",
        render: (host) => {
          const card = sectionCard("Layout pack v1");
          appendTable(card, ["Key", "Value"], [
            { Key: "topbarHeight", Value: String(MAIN_SYSTEM_LAYOUT.topbarHeight) },
            { Key: "drawerWidth", Value: String(MAIN_SYSTEM_LAYOUT.drawerWidth) },
            { Key: "maxWidth", Value: String(MAIN_SYSTEM_LAYOUT.maxWidth) },
            { Key: "pagePadding", Value: String(MAIN_SYSTEM_LAYOUT.pagePadding) }
          ]);
          appendList(card, [`Menu order: ${MAIN_SYSTEM_LAYOUT.menuOrder.join(" → ")}`]);
          host.appendChild(card);
        }
      },
      {
        id: "dashboard-actions",
        title: "Actions",
        render: (host) => {
          const row = document.createElement("div");
          row.setAttribute("style", UI.ACTION_ROW);
          const back = document.createElement("button");
          back.className = "cxBtn";
          back.setAttribute("style", UI.BTN);
          back.id = "cxGoLogin";
          back.textContent = "Retour Login";
          back.addEventListener("click", () => {
  navigate("#/login");
          });
          row.appendChild(back);
          host.appendChild(row);
        }
      }
    ];

    mountSections(card, sections, { page: "dashboard" });
  });
}

export const dashboardSections = [
  "dashboard-header",
  "dashboard-user",
  "dashboard-modules",
  "dashboard-layout",
  "dashboard-actions"
];
