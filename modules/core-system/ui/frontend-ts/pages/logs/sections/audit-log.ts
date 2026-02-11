// @ts-nocheck
import { getAuditLog } from "../../_shared/audit";
import { blockKeyValueTable, sectionCard } from "../../_shared/uiBlocks";
import { getLogFilters } from "./filters";

export function renderLogsAudit(host: HTMLElement): void {
  const card = sectionCard("Audit log (lecture seule)");
  const filters = getLogFilters();
  const entries = getAuditLog().slice(-200).reverse().filter((e) => {
    const line = `${e.code || ""} ${e.detail || ""} ${e.actionId || ""}`.toLowerCase();
    if (filters.level === "WARN" && !String(e.code || "").startsWith("WARN_")) return false;
    if (filters.level === "ERR" && !String(e.code || "").startsWith("ERR_")) return false;
    if (filters.query && !line.includes(filters.query.toLowerCase())) return false;
    return true;
  });
  card.appendChild(
    blockKeyValueTable({
      title: "Derniers evenements (max 200)",
      rows: entries.map((e) => ({
        key: `${e.ts} • ${e.code || "INFO"}`,
        value: e.detail || ""
      }))
    })
  );

  host.appendChild(card);
}
