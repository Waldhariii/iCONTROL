import { getAuditLog } from "/src/core/runtime/audit";
import { sectionCard } from "../../../shared/uiBlocks";
import { getLogFilters } from "./filters";

export function renderLogsAudit(host: HTMLElement): void {
  const card = sectionCard("Audit log (lecture seule)");
  const filters = getLogFilters();
  const allEntries = getAuditLog();
  
  // Filtrer par période
  const now = Date.now();
  const periodMs = filters.period === "1H" ? 3600000 :
                   filters.period === "24H" ? 86400000 :
                   filters.period === "7D" ? 604800000 :
                   filters.period === "30D" ? 2592000000 : 0;
  
  let entries = allEntries.slice(-500).reverse().filter((e) => {
    // Filtre période
    if (filters.period && filters.period !== "ALL" && periodMs > 0) {
      const entryTime = e.ts ? new Date(e.ts).getTime() : 0;
      if (entryTime < (now - periodMs)) return false;
    }
    
    // Filtre niveau
    if (filters.level === "WARN" && !String(e.code || "").startsWith("WARN_")) return false;
    if (filters.level === "ERR" && !String(e.code || "").startsWith("ERR_")) return false;
    if (filters.level === "INFO" && (String(e.code || "").startsWith("WARN_") || String(e.code || "").startsWith("ERR_"))) return false;
    
    // Filtre recherche
    const line = `${e.code || ""} ${e.detail || ""} ${e.actionId || ""} ${e.page || ""} ${e.section || ""}`.toLowerCase();
    if (filters.query && !line.includes(filters.query.toLowerCase())) return false;
    
    return true;
  });

  // Statistiques
  const statsDiv = document.createElement("div");
  statsDiv.style.minWidth = "0";
  statsDiv.style.boxSizing = "border-box";
  statsDiv.setAttribute("style", "margin-bottom: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; display: flex; gap: 16px; flex-wrap: wrap;");
  statsDiv.innerHTML = `
    <div>
      <div style="color: #858585; font-size: 12px;">Total</div>
      <div style="font-weight: 600; color: #d4d4d4;">${allEntries.length}</div>
    </div>
    <div>
      <div style="color: #858585; font-size: 12px;">Filtrés</div>
      <div style="font-weight: 600; color: #d4d4d4;">${entries.length}</div>
    </div>
    <div>
      <div style="color: #858585; font-size: 12px;">Erreurs</div>
      <div style="font-weight: 600; color: #f48771;">${entries.filter(e => String(e.code || "").startsWith("ERR_")).length}</div>
    </div>
    <div>
      <div style="color: #858585; font-size: 12px;">Avertissements</div>
      <div style="font-weight: 600; color: #dcdcaa;">${entries.filter(e => String(e.code || "").startsWith("WARN_")).length}</div>
    </div>
  `;
  card.appendChild(statsDiv);

  // Tableau amélioré
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.setAttribute("style", "padding: 40px; text-align: center; color: #858585;");
    empty.textContent = "Aucun événement ne correspond aux filtres.";
    card.appendChild(empty);
  } else {
    const table = document.createElement("table");
    table.setAttribute("style", "width: 100%; border-collapse: collapse; font-size: 13px;");
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="border-bottom: 1px solid var(--ic-border, #2b3136);">
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Date/Heure</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Code</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Détails</th>
        <th style="text-align: left; padding: 12px; color: #858585; font-size: 12px; font-weight: 600;">Contexte</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    entries.slice(0, 200).forEach((e) => {
      const severity = String(e.code || "").startsWith("ERR_") ? "ERR" : 
                      String(e.code || "").startsWith("WARN_") ? "WARN" : "INFO";
      const severityColor = severity === "ERR" ? "#f48771" : severity === "WARN" ? "#dcdcaa" : "#4ec9b0";
      
      const tr = document.createElement("tr");
      tr.setAttribute("style", "border-bottom: 1px solid var(--ic-border, #2b3136);");
      
      const date = e.ts ? new Date(e.ts).toLocaleString('fr-FR') : "-";
      const context = [e.page, e.section, e.actionId].filter(Boolean).join(" • ") || "-";
      
      tr.innerHTML = `
        <td style="padding: 12px; color: #858585; font-size: 12px; font-family: monospace;">${date}</td>
        <td style="padding: 12px;">
          <span style="padding: 4px 8px; background: ${severityColor}20; color: ${severityColor}; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: monospace;">
            ${e.code || "INFO"}
          </span>
        </td>
        <td style="padding: 12px; color: #d4d4d4; font-size: 13px;">${e.detail || "-"}</td>
        <td style="padding: 12px; color: #858585; font-size: 12px;">${context}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    
    if (entries.length > 200) {
      const more = document.createElement("div");
      more.setAttribute("style", "margin-top: 12px; padding: 12px; text-align: center; color: #858585; font-size: 12px;");
      more.textContent = `Affichage de 200 événements sur ${entries.length}. Utilisez les filtres pour affiner.`;
      card.appendChild(more);
    }
  }

  host.appendChild(card);
}
