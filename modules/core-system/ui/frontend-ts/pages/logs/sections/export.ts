// @ts-nocheck
import type { Role } from "/src/runtime/rbac";
import { getAuditLog } from "../../_shared/audit";
import { blockActionBar } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";

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
