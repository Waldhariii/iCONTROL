import type { AppKind } from "./types";
import type { PolicyContext } from "../policy/types";
import type { VfsScope } from "../storage/vfs";
import { vfsGet, vfsSet } from "../vfs-write/writeGateway";

export type GlobalThemeOverrides = {
  schemaVersion: 1;
  updatedAt: string; // ISO
  updatedBy?: string;
  theme?: Partial<Record<AppKind, Record<string, string>>>;
};

const GLOBAL_TENANT_ID = "global";
const GLOBAL_SCOPE: VfsScope = { tenantId: GLOBAL_TENANT_ID, namespace: "theme" };
const GLOBAL_KEY = "global-theme-overrides.json";

const appliedKeysByApp: Record<AppKind, Set<string>> = {
  CP: new Set<string>(),
  APP: new Set<string>(),
};

export function readGlobalThemeOverrides(): GlobalThemeOverrides {
  const raw = vfsGet(GLOBAL_SCOPE, GLOBAL_KEY);
  if (!raw) {
    return { schemaVersion: 1, updatedAt: new Date(0).toISOString(), theme: {} };
  }

  try {
    const parsed = JSON.parse(raw) as GlobalThemeOverrides;
    if (!parsed || parsed.schemaVersion !== 1) {
      return { schemaVersion: 1, updatedAt: new Date(0).toISOString(), theme: {} };
    }
    return parsed;
  } catch {
    return { schemaVersion: 1, updatedAt: new Date(0).toISOString(), theme: {} };
  }
}

export async function writeGlobalThemeOverrides(input: {
  theme: GlobalThemeOverrides["theme"];
  actorId?: string;
}): Promise<void> {
  const payload: GlobalThemeOverrides = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    ...(input.actorId ? { updatedBy: input.actorId } : {}),
    theme: input.theme ?? {},
  };

  const ctx: PolicyContext = {
    appKind: "CP",
    tenantId: GLOBAL_TENANT_ID,
    ...(input.actorId ? { userId: input.actorId } : {}),
    roles: [],
    entitlements: {},
    safeMode: false,
  };

  const res = await vfsSet(ctx, GLOBAL_SCOPE, GLOBAL_KEY, JSON.stringify(payload, null, 2) + "\n");
  if (!res.ok) {
    throw new Error(`${res.code}: ${res.reason}`);
  }
}

export function applyGlobalThemeOverrides(appKind: AppKind, overrides: GlobalThemeOverrides): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const appliedKeys = appliedKeysByApp[appKind];
  const next = overrides.theme?.[appKind] || {};

  for (const key of appliedKeys) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      root.style.removeProperty(key);
    }
  }

  appliedKeys.clear();
  for (const [key, value] of Object.entries(next)) {
    if (!key.startsWith("--")) continue;
    root.style.setProperty(key, String(value));
    appliedKeys.add(key);
  }
}
