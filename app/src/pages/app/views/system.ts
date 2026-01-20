/**
 * ICONTROL_APP_SYSTEM_VIEW_V1
 * Vues système pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */
import type { SystemModelApp } from "../models/system";
import { blockKeyValueTable, blockToggle, sectionCard } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks";

export function renderSystemSafeModeApp(host: HTMLElement, model: SystemModelApp): void {
  const table = blockKeyValueTable({
    title: "SAFE_MODE - Client",
    rows: [
      { key: "safe_mode", value: model.safeMode === "STRICT" ? "ON (strict)" : "OFF" }
    ]
  });
  host.appendChild(table);
}

export function renderSystemFlagsApp(host: HTMLElement, model: SystemModelApp): void {
  model.flags.forEach((flag) => {
    const strictBlocked = model.safeMode === "STRICT";
    host.appendChild(
      blockToggle({
        id: `flag_${flag.id}`,
        label: flag.label,
        description: flag.description,
        checked: flag.value,
        disabled: flag.disabledBySafeMode || strictBlocked,
        onChange: () => {
          // Read-only pour l'application client
          console.log("Flag modification disabled in client app");
        }
      })
    );
  });
}

export function renderSystemLayoutApp(host: HTMLElement, model: SystemModelApp): void {
  host.appendChild(
    blockKeyValueTable({
      title: "Layout - Client",
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

export function renderSystemCacheAuditApp(host: HTMLElement): void {
  const card = document.createElement("div");
  card.style.cssText = "margin:14px 0;padding:14px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,0.03);";
  const title = document.createElement("div");
  title.style.cssText = "font-weight:800;margin-bottom:10px;";
  title.textContent = "Cache Audit - Client";
  card.appendChild(title);
  const info = document.createElement("div");
  info.style.cssText = "opacity:0.8;margin-top:8px;";
  info.textContent = "Cache audit information is read-only in client application.";
  card.appendChild(info);
  host.appendChild(card);
}
