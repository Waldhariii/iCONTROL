import type { TenantOverrides } from "./types";
import { TENANT_OVERRIDES_SCHEMA_VERSION } from "./schema";

/**
 * Fail-closed in prod would typically be enforced at the gateway boundary.
 * Here: strict validation; throw on invalid.
 */
export function validateTenantOverrides(input: unknown): TenantOverrides {
  if (!isRecord(input)) throw new Error("ERR_TENANT_OVERRIDES_INVALID");

  const schemaVersion = (input as any).schemaVersion;
  if (schemaVersion !== TENANT_OVERRIDES_SCHEMA_VERSION) {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID");
  }

  const updatedAt = (input as any).updatedAt;
  if (typeof updatedAt !== "string" || updatedAt.length < 10) {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID");
  }

  const updatedBy = (input as any).updatedBy;
  if (updatedBy !== undefined && typeof updatedBy !== "string") {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID");
  }

  const theme = (input as any).theme;
  if (theme !== undefined) {
    if (!isRecord(theme)) throw new Error("ERR_TENANT_OVERRIDES_INVALID");
    for (const v of Object.values(theme)) {
      if (!isRecord(v)) throw new Error("ERR_TENANT_OVERRIDES_INVALID");
    }
  }

  const features = (input as any).features;
  if (features !== undefined) {
    if (!isRecord(features)) throw new Error("ERR_TENANT_OVERRIDES_INVALID");
    for (const v of Object.values(features)) {
      if (typeof v !== "boolean") throw new Error("ERR_TENANT_OVERRIDES_INVALID");
    }
  }

  return input as TenantOverrides;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
