/**
 * ICONTROL_CP_HOME_V1
 * Landing page for CP (Control Plane)
 * Distinct from APP home - no shared components
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { navigate } from "/src/router";
import { mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function renderHomeCp(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Control Plane",
    subtitle: "Panneau d'administration iCONTROL",
    safeMode: safeModeValue,
    statusBadge: { label: "CP", tone: "info" }
  });

  const { card, body } = createSectionCard({
    title: "Accueil",
    description: "Page d'accueil du Control Plane"
  });

  const welcome = document.createElement("div");
  welcome.style.padding = "24px";
  welcome.innerHTML = `
    <h2 style="margin:0 0 16px 0;font-size:24px;font-weight:600;">Bienvenue</h2>
    <p style="margin:0 0 24px 0;opacity:0.9;line-height:1.6;">
      Vous êtes sur le Control Plane iCONTROL.
    </p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <button id="btn-dashboard" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
        Dashboard
      </button>
      <button id="btn-pages" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
        Pages Registry
      </button>
      <button id="btn-audit" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
        Audit
      </button>
    </div>
  `;
  body.appendChild(welcome);

  const btnDashboard = welcome.querySelector("#btn-dashboard");
  if (btnDashboard) {
    btnDashboard.addEventListener("click", () => navigate("#/dashboard"));
  }

  const btnPages = welcome.querySelector("#btn-pages");
  if (btnPages) {
    btnPages.addEventListener("click", () => navigate("#/pages"));
  }

  const btnAudit = welcome.querySelector("#btn-audit");
  if (btnAudit) {
    btnAudit.addEventListener("click", () => navigate("#/audit"));
  }

  content.appendChild(card);
  root.appendChild(shell);
}
