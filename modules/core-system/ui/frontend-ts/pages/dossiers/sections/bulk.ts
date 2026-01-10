import type { Role } from "/src/runtime/rbac";
import { blockActionBar, blockToast } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
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
