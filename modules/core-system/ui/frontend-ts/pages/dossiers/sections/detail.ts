import { blockKeyValueTable } from "../../_shared/uiBlocks";
import { getDossier } from "../model";
import { MAIN_SYSTEM_THEME } from "../../_shared/mainSystem.data";
import { recordObs } from "../../_shared/audit";
import { OBS } from "../../_shared/obsCodes";

const TOK = MAIN_SYSTEM_THEME.tokens;
const RECO_DETAIL_ID = "dossiers.reco.detail";

type Reco = { code: string; text: string };

function buildRecoForDetail(d: any, safeMode: string): Reco[] {
  const out: Reco[] = [];
  if (safeMode === "STRICT") out.push({ code: "RECO_SAFE_MODE", text: "SAFE_MODE STRICT: ecriture bloquee (lecture OK)." });
  if (d.state === "OPEN") out.push({ code: "RECO_STATE", text: "Passer en IN_PROGRESS si travail demarre." });
  if (d.state === "IN_PROGRESS") out.push({ code: "RECO_STATE", text: "Mettre en WAITING si dependance externe." });
  if (d.state === "WAITING") out.push({ code: "RECO_STATE", text: "Planifier relance / date de suivi." });
  if (d.state === "BLOCKED") out.push({ code: "RECO_BLOCKED", text: "Confirmer la raison de blocage et lever le blocage." });
  if (d.state === "CLOSED") out.push({ code: "RECO_CLOSED", text: "Cloture: verifier historique + archivage." });
  return out;
}

function renderRecoPanel(host: HTMLElement, recos: Reco[]): void {
  if (!recos.length) return;
  const wrap = document.createElement("div");
  wrap.setAttribute(
    "style",
    [
      "margin:10px 0 0 0",
      "padding:10px 12px",
      "border-radius:12px",
      "border:1px solid " + (TOK.border || "rgba(255,255,255,0.12)"),
      "background:" + (TOK.panel || TOK.card || "transparent"),
      "color:" + (TOK.mutedText || "inherit"),
      "font-size:12px",
      "line-height:1.3",
    ].join(";")
  );
  wrap.textContent = "Recommandations: " + recos.map(r => r.text).join(" | ");
  host.appendChild(wrap);
  recordObs({ code: OBS.INFO_RECOMMENDATIONS_SHOWN, actionId: RECO_DETAIL_ID, detail: String(recos.length) });
}

export function renderDossiersDetail(root: HTMLElement, dossierId: string | null): void {
  if (!dossierId) {
    const card = blockKeyValueTable({
      title: "Detail",
      rows: [{ key: "Selection", value: "Aucun dossier selectionne." }]
    });
    root.appendChild(card);
    return;
  }
  const dossier = getDossier(dossierId);
  if (!dossier) {
    const card = blockKeyValueTable({
      title: "Detail",
      rows: [{ key: "Dossier", value: "Introuvable" }]
    });
    root.appendChild(card);
    return;
  }
  const rows = [
    { key: "ID", value: dossier.id },
    { key: "Titre", value: dossier.title },
    { key: "Etat", value: dossier.state },
    { key: "Kind", value: dossier.kind },
    { key: "Owner", value: dossier.owner },
    { key: "Client", value: dossier.clientName || "-" },
    { key: "Adresse", value: dossier.address || "-" },
    { key: "Notes", value: dossier.notes || "-" },
    { key: "Cree", value: dossier.createdAt },
    { key: "Maj", value: dossier.updatedAt }
  ];
  root.appendChild(blockKeyValueTable({ title: "Detail dossier", rows }));
}