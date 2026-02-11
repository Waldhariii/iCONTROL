import type { TenantOverrides } from "./types";
import { TENANT_OVERRIDES_SCHEMA_VERSION } from "./schema";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!isRecord(v)) return false;
  for (const k of Object.keys(v)) {
    if (typeof (v as any)[k] !== "string") return false;
  }
  return true;
}

function isBooleanRecord(v: unknown): v is Record<string, boolean> {
  if (!isRecord(v)) return false;
  for (const k of Object.keys(v)) {
    if (typeof (v as any)[k] !== "boolean") return false;
  }
  return true;
}

/**
 * Strict validation; throws on invalid input.
 * Upstream decides fail-soft vs fail-closed.
 */
export function validateTenantOverrides(input: unknown): TenantOverrides {
  if (!isRecord(input)) throw new Error("ERR_TENANT_OVERRIDES_INVALID: root not object");

  const sv = (input as any).schemaVersion;
  if (sv !== TENANT_OVERRIDES_SCHEMA_VERSION) {
    throw new Error(`ERR_TENANT_OVERRIDES_INVALID: schemaVersion must be ${TENANT_OVERRIDES_SCHEMA_VERSION}`);
  }

  const updatedAt = (input as any).updatedAt;
  if (typeof updatedAt !== "string" || updatedAt.length < 10) {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID: updatedAt must be string");
  }

  const updatedBy = (input as any).updatedBy;
  if (updatedBy !== undefined && typeof updatedBy !== "string") {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID: updatedBy must be string");
  }

  const theme = (input as any).theme;
  if (theme !== undefined) {
    if (!isRecord(theme)) throw new Error("ERR_TENANT_OVERRIDES_INVALID: theme must be object");
    const app = (theme as any).APP;
    const cp = (theme as any).CP;
    if (app !== undefined && !isStringRecord(app)) throw new Error("ERR_TENANT_OVERRIDES_INVALID: theme.APP must be record<string,string>");
    if (cp !== undefined && !isStringRecord(cp)) throw new Error("ERR_TENANT_OVERRIDES_INVALID: theme.CP must be record<string,string>");
  }

  const features = (input as any).features;
  if (features !== undefined && !isBooleanRecord(features)) {
    throw new Error("ERR_TENANT_OVERRIDES_INVALID: features must be record<string,boolean>");
  }

  return {
    schemaVersion: TENANT_OVERRIDES_SCHEMA_VERSION,
    updatedAt,
    updatedBy,
    theme: theme as any,
    features: features as any,
  };
}
