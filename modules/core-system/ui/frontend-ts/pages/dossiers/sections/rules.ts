import { blockKeyValueTable } from "../../_shared/uiBlocks";

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
}
