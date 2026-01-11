import { getRole } from "/src/runtime/rbac";
import { blockKeyValueTable } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { renderRecommendations } from "../../_shared/recommendations";

export function renderDossiersRules(root: HTMLElement): void {
  root.appendChild(
    blockKeyValueTable({
      title: "Regles (RBAC/SAFE_MODE)",
      rows: [
        { key: "Roles", value: "SYSADMIN / DEVELOPER / ADMIN / USER" },
        { key: "Ecriture", value: "SYSADMIN/DEVELOPER/ADMIN seulement" },
        { key: "SAFE_MODE STRICT", value: "actions d'ecriture bloquees" },
        { key: "CLOSED", value: "edits bloques, actions masquees" },
        { key: "Workflow", value: "OPEN → IN_PROGRESS → WAITING → CLOSED" }
      ]
    })
  );
  renderRecommendations(root, {
    pageId: "dossiers",
    scopeId: "dossiers.rules",
    role: getRole(),
    safeMode: getSafeMode()
  });
}
