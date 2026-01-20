/**
 * ICONTROL_APP_DASHBOARD_V1
 * Page Dashboard pour l'application CLIENT (/app)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { logout, requireSession } from "/src/localAuth";
import { navigate } from "/src/router";

const UI = {
  WRAP: "align-items:flex-start; padding-top:38px;",
  CARD: "width:min(920px,92vw);",
  BTN: "width:auto; margin-top:0;",
  USER_BOX: "margin-top:16px; border:1px solid var(--ic-border); border-radius:14px; padding:14px;",
  ACTION_ROW: "margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;"
} as const;

export function renderDashboard(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.className = "cxWrap";
  wrap.setAttribute("style", UI.WRAP);
  const card = document.createElement("div");
  card.className = "cxCard";
  card.setAttribute("style", UI.CARD);
  wrap.appendChild(card);
  root.appendChild(wrap);

  // Header
  const row = document.createElement("div");
  row.className = "cxRow";

  const left = document.createElement("div");
  const title = document.createElement("div");
  title.className = "cxTitle";
  title.textContent = "Tableau de bord - Client";
  const muted = document.createElement("div");
  muted.className = "cxMuted";
  muted.textContent = "Application client iCONTROL — Vue d'ensemble de vos dossiers et activités.";
  left.appendChild(title);
  left.appendChild(muted);

  const btn = document.createElement("button");
  btn.className = "cxBtn";
  btn.setAttribute("style", UI.BTN);
  btn.textContent = "Déconnexion";
  btn.addEventListener("click", () => {
    logout();
    navigate("#/login");
  });

  row.appendChild(left);
  row.appendChild(btn);
  card.appendChild(row);

  // User info
  const s = requireSession();
  const box = document.createElement("div");
  box.setAttribute("style", UI.USER_BOX);
  const lineUser = document.createElement("div");
  lineUser.innerHTML = `<b>Utilisateur</b>: ${s.username}`;
  const lineRole = document.createElement("div");
  lineRole.innerHTML = `<b>Rôle</b>: ${s.role}`;
  box.appendChild(lineUser);
  box.appendChild(lineRole);
  card.appendChild(box);

  // Navigation
  const actionRow = document.createElement("div");
  actionRow.setAttribute("style", UI.ACTION_ROW);
  const btnDossiers = document.createElement("button");
  btnDossiers.className = "cxBtn";
  btnDossiers.setAttribute("style", UI.BTN);
  btnDossiers.textContent = "Mes dossiers";
  btnDossiers.addEventListener("click", () => navigate("#/dossiers"));
  actionRow.appendChild(btnDossiers);
  card.appendChild(actionRow);
}
