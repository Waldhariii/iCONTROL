import { getAuditLog, clearAuditLog, recordObs } from "../../_shared/audit";
import { OBS } from "../../_shared/obsCodes";
import { blockKeyValueTable, appendActionRow, bindActions, sectionCard } from "../../_shared/uiBlocks";

export function renderLogsAudit(host: HTMLElement): void {
  const card = sectionCard("Audit log (lecture seule)");
  const entries = getAuditLog().slice(-50).reverse();
  card.appendChild(
    blockKeyValueTable({
      title: "Derniers evenements (max 50)",
      rows: entries.map((e) => ({
        key: `${e.ts} • ${e.code || "INFO"}`,
        value: e.detail || ""
      }))
    })
  );

  const actions = [{ id: "clear_logs", label: "Vider le journal", type: "noop" as const }];
  const row = appendActionRow(card, actions);
  bindActions(row, actions, { allowRoutes: [] });
  row.querySelectorAll("button[data-action-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearAuditLog();
      recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: "clear_logs", detail: "cleared" });
    });
  });

  host.appendChild(card);
}
