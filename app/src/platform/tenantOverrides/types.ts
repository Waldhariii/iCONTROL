import type { AppKind } from "../theme/types";
import type { ThemeOverrides } from "../theme/types";

/**
 * Tenant overrides are written by CP (admin) and consumed by both APP and CP at runtime.
 * Stored under tenant namespace in VFS, and written through WriteGateway.
 */
export type TenantOverrides = {
  schemaVersion: 1;
  updatedAt: string; // ISO
  updatedBy?: string;

  // Theme overrides per appKind (APP/CP)
  theme?: Partial<Record<AppKind, ThemeOverrides>>;

  // Feature flags (capability overrides) by semantic key
  features?: Record<string, boolean>;
};

export type TenantOverridesMeta = {
  tenantId: string;
  source: "vfs" | "default";
  sha256?: string;
};
