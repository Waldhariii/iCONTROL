import type { TenantOverrides, TenantOverridesMeta } from "./types";
import { tenantOverridesPath } from "./paths";
import { validateTenantOverrides } from "./validate";
import type { PolicyContext } from "../policy/types";
import { vfsSet } from "../vfs-write/writeGateway";
import { Vfs, type VfsScope } from "../storage/vfs";

function sha256BrowserSafe(s: string): string | undefined {
  // Avoid Node imports; this is best-effort. Hash is optional metadata.
  try {
    const g: any = globalThis as any;
    if (g.crypto?.subtle) return undefined; // keep optional for now to avoid async
    return undefined;
  } catch {
    return undefined;
  }
}

export async function readTenantOverrides(tenantId: string): Promise<{ overrides: TenantOverrides; meta: TenantOverridesMeta }> {
  // Contract: store is async via VFS + WriteGateway; resolvers stay sync via cache hydrated at bootstrap.
  const scope: VfsScope = { tenantId, namespace: "overrides" };
  const key = "overrides.json";
  void tenantOverridesPath;

  const raw = Vfs.get(scope, key);
  if (!raw) {
    return {
      overrides: { schemaVersion: 1, updatedAt: new Date().toISOString() },
      meta: { tenantId, source: "default" },
    };
  }

  const parsed = validateTenantOverrides(JSON.parse(raw));
  return {
    overrides: parsed,
    meta: { tenantId, source: "vfs", sha256: sha256BrowserSafe(raw) },
  };
}

export async function writeTenantOverrides(input: {
  tenantId: string;
  overrides: TenantOverrides;
  actorId?: string;
}): Promise<void> {
  const scope: VfsScope = { tenantId: input.tenantId, namespace: "overrides" };
  const key = "overrides.json";
  void tenantOverridesPath;

  // Validate before writing
  const validated = validateTenantOverrides(input.overrides);

  // Write through gateway (single write entrypoint)
  const ctx: PolicyContext = {
    appKind: "CP",
    tenantId: input.tenantId,
    userId: input.actorId,
    roles: [],
    entitlements: {},
    safeMode: false,
  };

  await vfsSet(ctx, scope, key, JSON.stringify(validated, null, 2) + "\n");
}
