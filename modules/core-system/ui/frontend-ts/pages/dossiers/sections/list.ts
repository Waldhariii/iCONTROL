import type { Role } from "/src/runtime/rbac";
import { appendActionRow, bindActions, sectionCard } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { listDossiers, setDossierState, type Dossier } from "../model";
import { canWrite } from "../contract";

function buildTable(rows: Dossier[], role: Role, canEdit: boolean, safeModeStrict: boolean, onAction: () => void): HTMLElement {
  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["ID", "Titre", "Etat", "Owner", "Actions"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText = "text-align:left;padding:8px;border-bottom:1px solid var(--line);font-size:12px;opacity:.85";
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((d) => {
    const tr = document.createElement("tr");
    [d.id, d.title, d.state, d.owner].forEach((v) => {
      const td = document.createElement("td");
      td.textContent = String(v);
      td.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
      tr.appendChild(td);
    });

    const tdActions = document.createElement("td");
    tdActions.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
    const actionsWrap = document.createElement("div");
    actionsWrap.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";

    const mkBtn = (label: string, onClick: () => void, disabled: boolean) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.cssText = "padding:4px 8px;border-radius:8px;border:1px solid var(--line);background:transparent;color:inherit;cursor:pointer;";
      if (disabled) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
      } else {
        btn.addEventListener("click", onClick);
      }
      return btn;
    };

    actionsWrap.appendChild(mkBtn("Ouvrir", () => {
      window.location.hash = `#/dossiers/${d.id}`;
    }, false));

    const writeBlocked = !canEdit || safeModeStrict || d.state === "CLOSED";
    if (d.state !== "CLOSED") {
      actionsWrap.appendChild(mkBtn(d.state === "LOCKED" ? "Delocker" : "Locker", () => {
        setDossierState(role, d.id, d.state === "LOCKED" ? "OPEN" : "LOCKED");
        onAction();
      }, writeBlocked));

      actionsWrap.appendChild(mkBtn("Fermer", () => {
        setDossierState(role, d.id, "CLOSED");
        onAction();
      }, writeBlocked));
    }

    tdActions.appendChild(actionsWrap);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

export function renderDossiersList(root: HTMLElement, role: Role): void {
  const card = sectionCard("Dossiers — liste");
  const safeMode = getSafeMode();
  const canEdit = canWrite(role);
  const rows = listDossiers();
  const refresh = () => renderDossiersList(root, role);

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "Aucun dossier pour le moment.";
    empty.style.cssText = "opacity:.8";
    card.appendChild(empty);
  } else {
    card.appendChild(buildTable(rows, role, canEdit, safeMode === "STRICT", refresh));
  }

  // Export CSV (read-only, still blocked in SAFE_MODE strict by uiBlocks)
  const actions = [
    { id: "export_csv", label: "Exporter CSV", type: "exportCsv" as const }
  ];
  const row = appendActionRow(card, actions);
  bindActions(row, actions, {
    allowRoutes: ["#/dossiers"],
    exportRows: rows.map((d) => ({
      id: d.id,
      title: d.title,
      state: d.state,
      owner: d.owner
    }))
  });
  root.appendChild(card);
}
