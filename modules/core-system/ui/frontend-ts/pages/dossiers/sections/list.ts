import type { Role } from "/src/runtime/rbac";
import { recordObs } from "../../_shared/audit";
import { OBS } from "../../_shared/obsCodes";
import { sectionCard } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { MAIN_SYSTEM_THEME } from "../../_shared/mainSystem.data";
import { getDossiersFilters } from "./filters";
import { canWrite } from "../contract";
import { listDossiers, transitionDossier, type Dossier } from "../model";

const TOK = MAIN_SYSTEM_THEME.tokens;
const RECO_BADGE_ID = "dossiers.reco";

type Reco = { code: string; text: string };

function buildRecoForList(d: any, safeMode: string): Reco[] {
  const out: Reco[] = [];
  if (safeMode === "STRICT") {
    out.push({ code: "RECO_SAFE_MODE", text: "SAFE_MODE STRICT: actions d’ecriture bloquees." });
  }
  if (d.state === "OPEN") out.push({ code: "RECO_NEXT", text: "Prochaine etape: passer en IN_PROGRESS (si action requise)." });
  if (d.state === "WAITING") out.push({ code: "RECO_WAIT", text: "En attente: verifier blocage externe / planifier suivi." });
  if (d.state === "BLOCKED") out.push({ code: "RECO_BLOCKED", text: "Bloque: ajouter/valider la raison avant reprise." });
  return out;
}

function renderRecoInline(host: HTMLElement, recos: Reco[]): void {
  if (!recos.length) return;
  const box = document.createElement("div");
  box.setAttribute(
    "style",
    [
      "margin-top:6px",
      "font-size:12px",
      "line-height:1.25",
      "color:" + (TOK.mutedText || "inherit"),
    ].join(";")
  );
  box.textContent = "Reco: " + recos.map(r => r.text).join(" | ");
  host.appendChild(box);
  recordObs({ code: OBS.INFO_RECOMMENDATIONS_SHOWN, actionId: RECO_BADGE_ID, detail: String(recos.length) });
}

const HEADER_STYLE =
  `text-align:left;padding:8px;border-bottom:1px solid var(--line);` +
  `font-size:12px;color:${MAIN_SYSTEM_THEME.tokens.mutedText};`;
const EMPTY_STYLE = `color:${MAIN_SYSTEM_THEME.tokens.mutedText};`;
const BLOCKED_BTN_COLOR = MAIN_SYSTEM_THEME.tokens.mutedText;

const selected = new Set<string>();

export function getSelectedIds(): string[] {
  return Array.from(selected);
}

export function clearSelected(): void {
  selected.clear();
}

function setSelected(id: string, next: boolean): void {
  if (next) selected.add(id);
  else selected.delete(id);
}

function buildTable(
  rows: Dossier[],
  role: Role,
  canEdit: boolean,
  safeModeStrict: boolean,
  onAction: () => void
): HTMLElement {
  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["Sel", "ID", "Titre", "Etat", "Owner", "Actions"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText = HEADER_STYLE;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((d) => {
    const tr = document.createElement("tr");

    const tdSel = document.createElement("td");
    tdSel.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selected.has(d.id);
    cb.addEventListener("change", () => setSelected(d.id, cb.checked));
    tdSel.appendChild(cb);
    tr.appendChild(tdSel);

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

    const mkBtn = (label: string, onClick: () => void, blockedReason?: string) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.cssText = "padding:4px 8px;border-radius:8px;border:1px solid var(--line);background:transparent;color:inherit;cursor:pointer;";
      if (blockedReason) {
        btn.style.color = BLOCKED_BTN_COLOR;
        btn.addEventListener("click", () => {
          if (blockedReason === "safeMode") {
            recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.state", detail: "safeModeStrict" });
            return;
          }
          recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.state", detail: blockedReason });
        });
      } else {
        btn.addEventListener("click", onClick);
      }
      return btn;
    };

    actionsWrap.appendChild(
      mkBtn("Ouvrir", () => {
        window.location.hash = `#/dossiers/${d.id}`;
      })
    );

    let blockedReason: string | undefined;
    if (safeModeStrict) blockedReason = "safeMode";
    else if (!canEdit) blockedReason = "rbac";
    else if (d.state === "CLOSED") blockedReason = "closed";
    if (d.state !== "CLOSED") {
      actionsWrap.appendChild(
        mkBtn("En cours", () => {
          transitionDossier(role, d.id, "IN_PROGRESS");
          onAction();
        }, blockedReason)
      );
      actionsWrap.appendChild(
        mkBtn("En attente", () => {
          transitionDossier(role, d.id, "WAITING");
          onAction();
        }, blockedReason)
      );
      actionsWrap.appendChild(
        mkBtn("Fermer", () => {
          transitionDossier(role, d.id, "CLOSED");
          onAction();
        }, blockedReason)
      );
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
  const filters = getDossiersFilters();
  const rows = listDossiers().filter((d) => {
    if (filters.status !== "ALL" && d.state !== filters.status) return false;
    const hay = `${d.id} ${d.title} ${d.owner} ${d.clientName || ""}`.toLowerCase();
    if (filters.query && !hay.includes(filters.query.toLowerCase())) return false;
    return true;
  });
  const refresh = () => renderDossiersList(root, role);

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "Aucun dossier pour le moment.";
    empty.style.cssText = EMPTY_STYLE;
    card.appendChild(empty);
  } else {
    card.appendChild(buildTable(rows, role, canEdit, safeMode === "STRICT", refresh));
  }
  root.appendChild(card);
}
