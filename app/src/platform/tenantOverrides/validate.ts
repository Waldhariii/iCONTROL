import type { TenantOverrides } from "./types";
import { TenantOverridesSchemaV1 } from "./schema";

/**
 * Fail-closed in prod would typically be enforced at the gateway boundary.
 * Here: strict validation; throw on invalid.
 */
export function validateTenantOverrides(input: unknown): TenantOverrides {
  const parsed = TenantOverridesSchemaV1.safeParse(input);
  if (!parsed.success) {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID");
  }
  return parsed.data as unknown as TenantOverrides;
}
