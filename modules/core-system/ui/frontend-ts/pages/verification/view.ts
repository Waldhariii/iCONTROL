import type { VerificationModel } from "./model";
import { appendParagraph, appendTable, sectionCard } from "/src/core/ui/uiBlocks";

export function renderVerificationSummary(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  
  // Afficher les résultats des checks
  if (model.checks && model.checks.length > 0) {
    const checksTable = document.createElement("div");
    checksTable.setAttribute("style", "margin-top: 20px;");
    
    const table = document.createElement("table");
    table.setAttribute("style", "width: 100%; border-collapse: collapse;");
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Statut</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Vérification</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Détails</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Action</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    model.checks.forEach(check => {
      const severityColor = 
        check.severity === "OK" ? "#4ec9b0" :
        check.severity === "WARN" ? "#dcdcaa" : "#f48771";
      
      const tr = document.createElement("tr");
      tr.setAttribute("style", "border-bottom: 1px solid var(--ic-border, #2b3136);");
      tr.innerHTML = `
        <td style="padding: 12px;">
          <span style="padding: 4px 8px; background: ${severityColor}20; color: ${severityColor}; border-radius: 4px; font-size: 11px; font-weight: 600;">
            ${check.severity}
          </span>
        </td>
        <td style="padding: 12px; color: #d4d4d4; font-size: 14px; font-weight: 600;">${check.title}</td>
        <td style="padding: 12px; color: #858585; font-size: 13px;">
          ${check.details}
          ${check.evidence ? `<div style="margin-top: 4px; font-size: 11px; color: #6a6a6a; font-family: monospace;">${check.evidence}</div>` : ""}
        </td>
        <td style="padding: 12px;">
          ${check.remediation ? `<div style="color: #858585; font-size: 12px;">${check.remediation}</div>` : "-"}
        </td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    checksTable.appendChild(table);
    
    // Bouton d'export
    const exportBtn = document.createElement("button");
    exportBtn.setAttribute("style", "margin-top: 16px; padding: 10px 20px; background: #37373d; color: white; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer; font-weight: 600;");
    exportBtn.textContent = "Exporter en CSV";
    exportBtn.onclick = () => {
      const csv = [
        ["ID", "Titre", "Sévérité", "Détails", "Remédiation", "Preuve"].join(","),
        ...model.checks.map(c => [
          c.id,
          `"${c.title}"`,
          c.severity,
          `"${c.details}"`,
          c.remediation ? `"${c.remediation}"` : "",
          c.evidence ? `"${c.evidence}"` : ""
        ].join(","))
      ].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icontrol-selfcheck-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    card.appendChild(checksTable);
    card.appendChild(exportBtn);
  }
  
  root.appendChild(card);
}

function renderVerificationSafeMode(root: HTMLElement, model: VerificationModel, safeMode: string): void {
  const card = sectionCard("SAFE_MODE self-check");
  appendTable(card, ["Key", "Value"], [
    { Key: "safe_mode", Value: safeMode },
    { Key: "selfcheck_route", Value: model.selfcheckRoute },
    { Key: "source", Value: "modules.registry.json" }
  ]);
  root.appendChild(card);
}

function renderVerificationRulesTable(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard("Rules engine inventory");
  appendTable(card, ["Category", "Items"], [
    { Category: "conditions", Items: model.ruleConditions.join(", ") },
    { Category: "effects", Items: model.ruleEffects.join(", ") },
    { Category: "value_refs", Items: model.ruleValueRefs.join(", ") }
  ]);
  root.appendChild(card);
}
