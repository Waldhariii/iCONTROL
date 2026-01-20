/**
 * ICONTROL_APP_SYSTEM_V1
 * Page Système pour l'application CLIENT (/app)
 * Utilise les modèles et vues APP séparés (aucun lien avec CP)
 */
import { getRole } from "/src/runtime/rbac";
import { safeRender } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/sections";
import { recordObs } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/audit";
import { OBS } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/obsCodes";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { renderAccessDenied } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/renderAccessDenied";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/system/contract";
import { createSystemModelApp } from "./models/system";
import { renderSystemFlagsApp } from "./views/system";
import { renderSystemLayoutApp } from "./views/system";
import { renderSystemSafeModeApp } from "./views/system";
import { renderSystemCacheAuditApp } from "./views/system";

export function renderSystemPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "system", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  const model = createSystemModelApp();
  const sections: SectionSpec[] = [
    { id: "system-header", title: "Système - Application Client", render: (host) => {
      const header = document.createElement("div");
      header.innerHTML = `
        <div style="margin-bottom:12px;">
          <div style="font-size:18px;font-weight:900;">Système - Application Client</div>
          <div style="color:var(--ic-mutedText);margin-top:4px;">Informations système pour l'application client iCONTROL.</div>
          <div style="margin-top:12px; padding:10px; border:1px solid var(--ic-border); border-radius:10px; background:rgba(255,255,255,0.02);">
            <div><b>Application</b>: Client (APP)</div>
            <div><b>SAFE_MODE</b>: ${model.safeMode}</div>
          </div>
        </div>
      `;
      host.appendChild(header);
    }},
    { id: "system-safe-mode", title: "SAFE_MODE", render: (host) => renderSystemSafeModeApp(host, model) },
    { id: "system-cache-audit", title: "Cache Audit", render: (host) => renderSystemCacheAuditApp(host) },
    { id: "system-flags", title: "Flags", render: (host) => renderSystemFlagsApp(host, model) },
    { id: "system-layout", title: "Layout", render: (host) => renderSystemLayoutApp(host, model) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "system", role, safeMode });
  });
}
