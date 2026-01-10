import { appendTable, sectionCard } from "../../_shared/uiBlocks";
import { listDossiers, type DossierHistoryEntry } from "../model";

export function renderDossiersHistory(host: HTMLElement, dossierId?: string | null): void {
  const card = sectionCard("Historique");
  const rows: Array<Record<string, string>> = [];

  listDossiers().forEach((d) => {
    if (dossierId && d.id !== dossierId) return;
    (d.history || []).forEach((h: DossierHistoryEntry) => {
      rows.push({
        dossier: d.id,
        ts: h.ts,
        actor: h.actorRole,
        action: h.actionId,
        meta: h.meta || ""
      });
    });
  });

  appendTable(card, ["dossier", "ts", "actor", "action", "meta"], rows);
  host.appendChild(card);
}
