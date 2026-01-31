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
    <h2 class="ic-cp-c6a3149db1">Bienvenue</h2>
    <p class="ic-cp-f06124b730">
      Vous êtes sur le Control Plane iCONTROL.
    </p>
    <div class="ic-cp-283d51b208">
      <button id="btn-dashboard" class="ic-cp-c52af2f4f5">
        Dashboard
      </button>
      <button id="btn-pages" class="ic-cp-c52af2f4f5">
        Pages Registry
      </button>
      <button id="btn-audit" class="ic-cp-c52af2f4f5">
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
