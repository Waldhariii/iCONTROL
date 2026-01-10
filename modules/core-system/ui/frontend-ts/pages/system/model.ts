import { getSafeMode } from "../_shared/safeMode";
import { listFlags, setFlag } from "../../shared/featureFlags";
import { MAIN_SYSTEM_LAYOUT } from "../_shared/mainSystem.data";

export type SystemFlagVM = {
  id: string;
  label: string;
  description: string;
  value: boolean;
  disabledBySafeMode: boolean;
};

export type SystemModel = {
  safeMode: "STRICT" | "COMPAT";
  flags: SystemFlagVM[];
  menuOrder: string[];
  layout: {
    topbarHeight: number;
    drawerWidth: number;
    maxWidth: number;
    pagePadding: number;
  };
};

export function createSystemModel(storage: Storage = window.localStorage): SystemModel {
  const safeMode = getSafeMode();
  const flags = listFlags(storage).map((f) => ({
    id: f.def.id,
    label: f.def.label,
    description: f.def.description,
    value: f.effective,
    disabledBySafeMode: f.disabledBySafeMode
  }));
  return {
    safeMode,
    flags,
    menuOrder: MAIN_SYSTEM_LAYOUT.menuOrder.slice(),
    layout: {
      topbarHeight: MAIN_SYSTEM_LAYOUT.topbarHeight,
      drawerWidth: MAIN_SYSTEM_LAYOUT.drawerWidth,
      maxWidth: MAIN_SYSTEM_LAYOUT.maxWidth,
      pagePadding: MAIN_SYSTEM_LAYOUT.pagePadding
    }
  };
}

export function updateFlag(id: string, next: boolean, storage: Storage = window.localStorage): void {
  setFlag(id as any, next, storage);
}
