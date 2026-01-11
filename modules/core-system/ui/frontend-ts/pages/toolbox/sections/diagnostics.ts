import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const diagnosticsSection: ToolboxSection = {
  id: "diagnostics",
  title: "Diagnostics",
  render: (root, ctx) => {
    const card = createSectionCard("Diagnostics");
    card.setAttribute("data-toolbox-section", "diagnostics");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const table = document.createElement("table");
    table.style.cssText = "width:100%;border-collapse:collapse;";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Signal", "Value"].forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.cssText = "text-align:left;padding:6px;border-bottom:1px solid rgba(255,255,255,0.08);opacity:.8;";
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    [
      { Signal: "SAFE_MODE", Value: ctx.safeMode ? "ON" : "OFF" },
      { Signal: "Role", Value: ctx.role },
      { Signal: "User", Value: ctx.username },
      { Signal: "Contract", Value: "RenderPlan SSOT" }
    ].forEach((row) => {
      const tr = document.createElement("tr");
      Object.values(row).forEach((v) => {
        const td = document.createElement("td");
        td.textContent = String(v);
        td.style.cssText = "padding:6px;border-bottom:1px solid rgba(255,255,255,0.06);";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.innerHTML = "";
    body.appendChild(table);

    appendAction(body, "Refresh", () => {
      body.innerHTML = "";
      body.appendChild(table);
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
