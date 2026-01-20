import { getAuditLog } from "/src/core/runtime/audit";
import { appendParagraph, appendTable } from "../../../shared/uiBlocks";
import { createToolboxCard } from "../../../shared/toolboxCard";

export function render_audit_log(host: HTMLElement): void {
  const card = createToolboxCard("Audit log (UI)", "Journal read-only des actions UI permises");
  const content = (card as any).content;
  
  const infoDiv = document.createElement("div");
  infoDiv.style.cssText = `
    padding: 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--ic-text, var(--text));
  `;
  infoDiv.textContent = "Journal read-only des actions UI permises. Aucun contenu sensible.";
  content.appendChild(infoDiv);

  const entries = getAuditLog().slice(-50).reverse();
  appendTable(
    content,
    ["Time", "Code", "Detail"],
    entries.map((e) => ({
      Time: e.ts,
      Code: e.code,
      Detail: e.detail ?? ""
    }))
  );

  host.appendChild(card);
}
