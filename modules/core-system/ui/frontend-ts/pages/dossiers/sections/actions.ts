import type { Role } from "/src/runtime/rbac";
import { blockActionBar, blockToast } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { isWriteAllowed } from "../../_shared/rolePolicy";
import { recordObs } from "../../_shared/audit";
import { OBS } from "../../_shared/obsCodes";
import { canWrite } from "../contract";
import { createDossier, listDossiers, transitionDossier, resetDossiers } from "../model";
import { getSelectedIds } from "./list";

export function renderDossiersActions(host: HTMLElement, role: Role, onRefresh: () => void): void {
  const safeMode = getSafeMode();
  const allowedRoles = ["SYSADMIN", "DEVELOPER", "ADMIN"];
  const actions = [
    { id: "create_demo", label: "Nouveau dossier", type: "noop" as const, write: true },
    { id: "to_progress", label: "Passer en cours", type: "noop" as const, write: true },
    { id: "to_waiting", label: "Mettre en attente", type: "noop" as const, write: true },
    { id: "to_closed", label: "Fermer", type: "noop" as const, write: true },
    { id: "export_csv", label: "Exporter CSV", type: "exportCsv" as const },
    { id: "reset_demo", label: "Reset demo", type: "noop" as const, write: true }
  ];

  const rows = listDossiers().map((d) => ({
    id: d.id,
    title: d.title,
    state: d.state,
    owner: d.owner
  }));

  const bar = blockActionBar({
    title: "Actions",
    actions,
    allowRoutes: ["#/dossiers"],
    exportRows: rows,
    role,
    allowedRoles,
    safeMode,
    onAction: (action) => {
      if (action.write) {
        const actionId =
          action.id === "create_demo"
            ? "dossier.create"
            : action.id === "reset_demo"
              ? "dossier.reset"
              : "dossier.state";
        const decision = isWriteAllowed(safeMode, actionId);
        if (!decision.allow) {
          recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId, detail: decision.reason });
          host.appendChild(blockToast("SAFE_MODE strict: ecriture bloquee.", "warn"));
          return;
        }
      }
      if (!canWrite(role)) return;
      if (action.id === "create_demo") {
        const res = createDossier(role, {
          title: "Dossier demo",
          kind: "INTERVENTION",
          state: "OPEN",
          owner: role,
          notes: "Created from action bar"
        });
        if (res.ok) {
          host.appendChild(blockToast("Dossier cree.", "ok"));
          onRefresh();
        }
        return;
      }
      const ids = getSelectedIds();
      if (!ids.length) {
        host.appendChild(blockToast("Aucun dossier selectionne.", "warn"));
        return;
      }
      if (action.id === "to_progress") {
        ids.forEach((id) => transitionDossier(role, id, "IN_PROGRESS"));
        onRefresh();
        return;
      }
      if (action.id === "to_waiting") {
        ids.forEach((id) => transitionDossier(role, id, "WAITING"));
        onRefresh();
        return;
      }
      if (action.id === "to_closed") {
        ids.forEach((id) => transitionDossier(role, id, "CLOSED"));
        onRefresh();
        return;
      }
      if (action.id === "reset_demo") {
        const res = resetDossiers(role);
        if (res.ok) {
          host.appendChild(blockToast("Demo reinitialisee.", "ok"));
          onRefresh();
        }
      }
    }
  });

  host.appendChild(bar);
}
