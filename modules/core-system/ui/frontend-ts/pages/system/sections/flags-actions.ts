import { recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";
import { blockActionBar, blockToast } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";
import { resetFlags, setAllFlags } from "../model";

export function renderSystemFlagsActions(host: HTMLElement, role: string, onRefresh: () => void): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "Actions flags",
    actions: [
      { id: "flags_enable_all", label: "Activer tout", type: "noop", write: true },
      { id: "flags_disable_all", label: "Desactiver tout", type: "noop", write: true },
      { id: "flags_reset", label: "Reset par defaut", type: "noop", write: true }
    ],
    allowRoutes: ["#/system"],
    role,
    allowedRoles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    safeMode,
    onAction: (action) => {
      if (safeMode === "STRICT") {
        recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: action.id, detail: "safeModeStrict" });
        host.appendChild(blockToast("SAFE_MODE strict: ecriture bloquee.", "warn"));
        return;
      }
      if (action.id === "flags_enable_all") setAllFlags(true);
      if (action.id === "flags_disable_all") setAllFlags(false);
      if (action.id === "flags_reset") resetFlags();
      host.appendChild(blockToast("Mise a jour appliquee.", "ok"));
      onRefresh();
    }
  });

  host.appendChild(bar);
}
