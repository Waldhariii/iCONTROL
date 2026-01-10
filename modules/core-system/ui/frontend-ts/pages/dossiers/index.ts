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
    { id: "dossiers-list", title: "Dossiers — liste", render: (host) => renderDossiersList(host, role) },
    { id: "dossiers-create", title: "Creer", render: (host) => renderDossiersCreate(host, role, refresh) },
    { id: "dossiers-detail", title: "Detail", render: (host) => renderDossiersDetail(host, dossierId) },
    { id: "dossiers-rules", title: "Regles", render: (host) => renderDossiersRules(host) },
    { id: "dossiers-storage", title: "Storage", render: (host) => renderDossiersStorage(host) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "dossiers", role, safeMode });
  });
}

export const dossiersSections = [
  "dossiers-list",
  "dossiers-create",
  "dossiers-detail",
  "dossiers-rules",
  "dossiers-storage"
];
