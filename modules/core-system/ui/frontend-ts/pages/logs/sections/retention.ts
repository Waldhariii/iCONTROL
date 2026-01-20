import type { Role } from "/src/runtime/rbac";
import { clearAuditLog, recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";
import { blockActionBar, blockToast } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";

export function renderLogsRetention(host: HTMLElement, role: Role, onRefresh: () => void): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "Retention",
    actions: [{ id: "clear_logs", label: "Vider le journal", type: "noop", write: true }],
    allowRoutes: ["#/logs"],
    role,
    allowedRoles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    safeMode,
    onAction: (action) => {
      if (action.id !== "clear_logs") return;
      clearAuditLog();
      recordObs({ code: OBS.INFO_WRITE_OK, actionId: action.id, detail: "cleared" });
      host.appendChild(blockToast("Journal vide.", "ok"));
      onRefresh();
    }
  });

  host.appendChild(bar);
}
