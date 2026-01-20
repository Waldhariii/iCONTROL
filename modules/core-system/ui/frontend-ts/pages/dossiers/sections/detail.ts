import { blockKeyValueTable } from "../../../shared/uiBlocks";
import { renderRecommendations } from "../../../shared/recommendations";
import { getRole, getSafeMode } from "../../../shared/recommendations.ctx";
import { getDossier } from "../model";

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
  renderRecommendations(root, {
    pageId: "dossiers",
    scopeId: "dossiers.detail",
    role: getRole(),
    safeMode: getSafeMode(),
    entityType: "dossier",
    entityState: dossier.state,
    blockedReason: (dossier as any).blockedReason
  });
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
