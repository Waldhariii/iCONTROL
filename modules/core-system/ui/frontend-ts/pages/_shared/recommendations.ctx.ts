// ICONTROL_LOCALAUTH_SHIM_V1
import { getSession } from "./localAuth";
import { getSafeMode as getSafeModeBase, type SafeMode } from "./safeMode";
import { readStorage } from "./storage";

export type Role = "ADMIN" | "DEVELOPER" | "SYSADMIN" | "USER" | string;

export function getSafeMode(): SafeMode {
  return getSafeModeBase();
}

export function getRole(): Role {
  try {
    const s = getSession();
    if (s?.role) return s.role as Role;
  } catch {}
  try {
    const v = (globalThis as any).ICONTROL_ROLE;
    if (v) return v as Role;
  } catch {}
  return "ADMIN";
}

export function getTheme(): "dark" | "light" {
  try {
    const v = readStorage("icontrol_settings_v1.theme");
    if (v === "dark" || v === "light") return v;
  } catch {}
  return "dark";
}
