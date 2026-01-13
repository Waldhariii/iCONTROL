export type VersionPolicyStatus = "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";

export type VersionPolicy = {
  status: VersionPolicyStatus;
  min_version: string;
  latest_version: string;
  message: string;
  safe_mode: boolean;
  capabilities: string[];
};

const ALLOWED_STATUSES: readonly VersionPolicyStatus[] = [
  "OK",
  "SOFT_BLOCK",
  "HARD_BLOCK",
  "MAINTENANCE",
] as const;

export function isVersionPolicy(input: unknown): input is VersionPolicy {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;

  if (typeof obj.status !== "string" || !ALLOWED_STATUSES.includes(obj.status as VersionPolicyStatus)) return false;
  if (typeof obj.min_version !== "string" || obj.min_version.trim().length === 0) return false;
  if (typeof obj.latest_version !== "string" || obj.latest_version.trim().length === 0) return false;
  if (typeof obj.message !== "string") return false;
  if (typeof obj.safe_mode !== "boolean") return false;

  if (!Array.isArray(obj.capabilities)) return false;
  if (!obj.capabilities.every((x) => typeof x === "string")) return false;

  return true;
}
