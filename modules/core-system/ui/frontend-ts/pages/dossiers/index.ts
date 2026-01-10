import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { getSafeMode } from "../_shared/safeMode";
import { canAccess } from "./contract";
import { renderDossiersList } from "./sections/list";
import { renderDossiersCreate } from "./sections/create";
import { renderDossiersDetail } from "./sections/detail";
import { renderDossiersStorage } from "./sections/storage";
import { renderDossiersRules } from "./sections/rules";
import { renderDossiersSafeMode } from "./sections/safe-mode";
import { renderDossiersActions } from "./sections/actions";
import { renderDossiersFilters } from "./sections/filters";
import { renderDossiersHistory } from "./sections/history";
import { renderDossiersBulk } from "./sections/bulk";

function getDossierIdFromHash(): string | null {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const segs = h.split("?")[0].split("/");
  if (segs[0] !== "dossiers") return null;
  return segs[1] || null;
}

export function renderDossiersPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();
  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }
  const dossierId = getDossierIdFromHash();
  const refresh = () => renderDossiersPage(root);

  const sections: SectionSpec[] = [
    { id: "dossiers-safe-mode", title: "SAFE_MODE", render: (host) => renderDossiersSafeMode(host) },
    { id: "dossiers-actions", title: "Actions", render: (host) => renderDossiersActions(host, role, refresh) },
    { id: "dossiers-filters", title: "Filtres", render: (host) => renderDossiersFilters(host, refresh) },
    { id: "dossiers-list", title: "Dossiers — liste", render: (host) => renderDossiersList(host, role) },
    { id: "dossiers-create", title: "Creer", render: (host) => renderDossiersCreate(host, role, refresh) },
    { id: "dossiers-detail", title: "Detail", render: (host) => renderDossiersDetail(host, dossierId) },
    { id: "dossiers-history", title: "Historique", render: (host) => renderDossiersHistory(host, dossierId) },
    { id: "dossiers-bulk", title: "Bulk", render: (host) => renderDossiersBulk(host, role, refresh) },
    { id: "dossiers-rules", title: "Regles", render: (host) => renderDossiersRules(host) },
    { id: "dossiers-storage", title: "Storage", render: (host) => renderDossiersStorage(host) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "dossiers", role, safeMode });
  });
}

export const dossiersSections = [
  "dossiers-safe-mode",
  "dossiers-actions",
  "dossiers-filters",
  "dossiers-list",
  "dossiers-create",
  "dossiers-detail",
  "dossiers-history",
  "dossiers-bulk",
  "dossiers-rules",
  "dossiers-storage"
];
