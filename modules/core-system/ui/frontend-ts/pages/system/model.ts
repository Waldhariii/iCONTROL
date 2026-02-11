// @ts-nocheck
import { asStorage } from "../../../../../../apps/control-plane/src/core/storage/webStorage";
import { getSafeMode } from "../_shared/safeMode";
import { listFlags, setFlag, FLAG_DEFS } from "../../shared/featureFlags";
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

export function createSystemModel(storage: Storage = asStorage()): SystemModel {
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

export function updateFlag(id: string, next: boolean, storage: Storage = asStorage()): void {
  setFlag(id as any, next, storage);
}

export function setAllFlags(next: boolean, storage: Storage = asStorage()): void {
  listFlags(storage).forEach((f) => setFlag(f.def.id, next, storage));
}

export function resetFlags(storage: Storage = asStorage()): void {
  FLAG_DEFS.forEach((f) => setFlag(f.id, f.defaultValue, storage));
}
