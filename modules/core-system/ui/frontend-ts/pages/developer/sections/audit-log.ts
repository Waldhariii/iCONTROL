import { getAuditLog } from "../../_shared/audit";
import { appendParagraph, appendTable, sectionCard } from "../../_shared/uiBlocks";

export function render_audit_log(host: HTMLElement): void {
  const card = sectionCard("Audit log (UI)");
  appendParagraph(card, "Journal read-only des actions UI permises. Aucun contenu sensible.");

  const entries = getAuditLog().slice(-50).reverse();
  appendTable(
    card,
    ["Time", "Code", "Detail"],
    entries.map((e) => ({
      Time: e.ts,
      Code: e.code,
      Detail: e.detail ?? ""
    }))
  );

  host.appendChild(card);
}
