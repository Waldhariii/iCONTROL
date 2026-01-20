/**
 * ICONTROL_CP_SYSTEM_VIEW_V1
 * Vues système pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */
import type { SystemModelCp } from "../models/system";
import { blockKeyValueTable, blockToggle, sectionCard, blockActionBar, blockToast } from "/src/core/ui/uiBlocks";
import { updateFlagCp, setAllFlagsCp, resetFlagsCp } from "../models/system";
import { getSafeMode } from "/src/core/runtime/safe";
import { recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";

export function renderSystemSafeModeCp(host: HTMLElement, model: SystemModelCp): void {
  const table = blockKeyValueTable({
    title: "SAFE_MODE - Administration",
    rows: [
      { key: "safe_mode", value: model.safeMode === "STRICT" ? "ON (strict)" : "OFF" }
    ]
  });
  host.appendChild(table);
}

function renderSystemFlagsCp(host: HTMLElement, model: SystemModelCp): void {
  model.flags.forEach((flag) => {
    const strictBlocked = model.safeMode === "STRICT";
    host.appendChild(
      blockToggle({
        id: `flag_${flag.id}`,
        label: flag.label,
        description: flag.description,
        checked: flag.value,
        disabled: flag.disabledBySafeMode || strictBlocked,
        onChange: (next) => updateFlagCp(flag.id, next)
      })
    );
  });
}

function renderSystemLayoutCp(host: HTMLElement, model: SystemModelCp): void {
  host.appendChild(
    blockKeyValueTable({
      title: "Layout - Administration",
      rows: [
        { key: "topbarHeight", value: String(model.layout.topbarHeight) },
        { key: "drawerWidth", value: String(model.layout.drawerWidth) },
        { key: "maxWidth", value: String(model.layout.maxWidth) },
        { key: "pagePadding", value: String(model.layout.pagePadding) },
        { key: "menuOrder", value: model.menuOrder.join(" > ") }
      ]
    })
  );
}

function renderSystemCacheAuditCp(host: HTMLElement): void {
  // CP peut avoir une vraie implémentation de cache audit
  const card = sectionCard("Cache Audit - Administration");
  const info = document.createElement("div");
  info.style.cssText = "opacity:0.8;margin-top:8px;";
  info.textContent = "Cache audit functionality available for administrators.";
  card.appendChild(info);
  host.appendChild(card);
}

function renderSystemFlagsActionsCp(host: HTMLElement, role: string, onRefresh: () => void): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "Actions flags - Administration",
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
      if (action.id === "flags_enable_all") setAllFlagsCp(true);
      if (action.id === "flags_disable_all") setAllFlagsCp(false);
      if (action.id === "flags_reset") resetFlagsCp();
      host.appendChild(blockToast("Mise a jour appliquee.", "ok"));
      onRefresh();
    }
  });

  host.appendChild(bar);
}

function renderSystemSafeModeActionsCp(host: HTMLElement, role: string): void {
  const safeMode = getSafeMode();
  const bar = blockActionBar({
    title: "SAFE_MODE actions - Administration",
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
