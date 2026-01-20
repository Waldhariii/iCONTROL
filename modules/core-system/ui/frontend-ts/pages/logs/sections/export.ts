import type { Role } from "/src/runtime/rbac";
import { getAuditLog } from "/src/core/runtime/audit";
import { blockActionBar } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";

export function renderLogsExport(host: HTMLElement, role: Role): void {
  const rows = getAuditLog().map((e) => ({
    ts: e.ts,
    code: e.code,
    detail: e.detail || "",
    actionId: e.actionId || ""
  }));

  const bar = blockActionBar({
    title: "Export",
    actions: [{ id: "export_logs", label: "Exporter CSV", type: "exportCsv" }],
    allowRoutes: ["#/logs"],
    exportRows: rows,
    safeMode: getSafeMode(),
    allowedRoles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    role
  });

  host.appendChild(bar);
}
