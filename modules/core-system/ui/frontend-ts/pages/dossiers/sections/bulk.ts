import type { Role } from "/src/runtime/rbac";
import { blockActionBar, blockToast } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";
import { isWriteAllowed } from "../../../shared/rolePolicy";
import { recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";
import { canWrite } from "../contract";
import { transitionDossier } from "../model";
import { getSelectedIds } from "./list";

export function renderDossiersBulk(host: HTMLElement, role: Role, onRefresh: () => void): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "Actions bulk",
    actions: [{ id: "bulk_close", label: "Fermer selection", type: "noop" as const, write: true }],
    allowRoutes: ["#/dossiers"],
    role,
    allowedRoles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    safeMode,
    onAction: (action) => {
      if (action.id !== "bulk_close") return;
      const decision = isWriteAllowed(safeMode, "dossier.state");
      if (!decision.allow) {
        recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.state", detail: decision.reason });
        host.appendChild(blockToast("SAFE_MODE strict: ecriture bloquee.", "warn"));
        return;
      }
      if (!canWrite(role)) return;
      const ids = getSelectedIds();
      if (!ids.length) {
        host.appendChild(blockToast("Aucun dossier selectionne.", "warn"));
        return;
      }
      ids.forEach((id) => transitionDossier(role, id, "CLOSED"));
      host.appendChild(blockToast("Fermeture appliquee.", "ok"));
      onRefresh();
    }
  });

  host.appendChild(bar);
}
