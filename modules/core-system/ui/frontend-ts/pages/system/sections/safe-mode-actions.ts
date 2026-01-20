import { recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";
import { blockActionBar, blockToast } from "../../../shared/uiBlocks";
import { getSafeMode } from "/src/core/runtime/safe";

export function renderSystemSafeModeActions(host: HTMLElement, role: string): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "SAFE_MODE actions",
    actions: [
      { id: "safe_mode_compat", label: "Passer en COMPAT", type: "noop", write: true },
      { id: "safe_mode_strict", label: "Passer en STRICT", type: "noop", write: true }
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
      if (action.id === "safe_mode_compat") (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
      if (action.id === "safe_mode_strict") (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
      recordObs({ code: OBS.INFO_WRITE_OK, actionId: action.id, detail: "safe_mode_switch" });
      host.appendChild(blockToast("SAFE_MODE mis a jour (non persistant).", "ok"));
    }
  });

  host.appendChild(bar);
}
