import { readAuditLog, exportAuditLogJson, clearAuditLog } from "/src/core/audit/auditLog";
import { blockKeyValueTable, sectionCard } from "../../_shared/uiBlocks";

export function renderLogsLocalAudit(host: HTMLElement): void {
  const card = sectionCard("Audit log (local)");
  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px";

  const btnExport = document.createElement("button");
  btnExport.textContent = "Exporter JSON";
  btnExport.addEventListener("click", () => {
    const blob = new Blob([exportAuditLogJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icontrol_auditlog.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  const btnClear = document.createElement("button");
  btnClear.textContent = "Effacer";
  btnClear.addEventListener("click", () => {
    clearAuditLog();
    renderTable();
  });

  actions.appendChild(btnExport);
  actions.appendChild(btnClear);

  const count = document.createElement("div");
  count.style.cssText = "opacity:.7;margin-bottom:8px";

  const tableHost = document.createElement("div");

  const renderTable = () => {
    const events = readAuditLog().slice(-200).reverse();
    count.textContent = `Événements: ${events.length}`;
    tableHost.innerHTML = "";
    tableHost.appendChild(
      blockKeyValueTable({
        title: "Derniers événements (max 200)",
        rows: events.map((e) => ({
          key: `${e.ts} • ${e.code || "INFO"}`,
          value: e.message || ""
        }))
      })
    );
  };

  card.appendChild(actions);
  card.appendChild(count);
  card.appendChild(tableHost);
  host.appendChild(card);

  renderTable();
}
