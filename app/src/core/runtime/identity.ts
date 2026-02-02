/**
 * Runtime Identity — SSOT v1
 * - Single place to resolve tenantId + actorId for enforcement.
 * - Must remain side-effect free at import time.
 */
export type RuntimeIdentity = Readonly<{
  tenantId: string;
  actorId: string;
  source: "runtime" | "fallback";
}>;

function readGlobal(path: string[]): unknown {
  let cur: any = globalThis as any;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

/**
 * Resolve identity in a deterministic, governance-safe way.
 * Preferred: runtime tenant/session object (if present).
 * Fallback: "default"/"unknown" (safe + explicit).
 */
export function getRuntimeIdentity(): RuntimeIdentity {
  // Preferred sources (ordered):
  // 1) __ICONTROL_RUNTIME__.tenant.id + __ICONTROL_RUNTIME__.actor.id
  const rtTenantId = readGlobal(["__ICONTROL_RUNTIME__", "tenant", "id"]);
  const rtActorId = readGlobal(["__ICONTROL_RUNTIME__", "actor", "id"]);

  if (typeof rtTenantId === "string" && rtTenantId.length > 0
   && typeof rtActorId === "string" && rtActorId.length > 0) {
    return { tenantId: rtTenantId, actorId: rtActorId, source: "runtime" };
  }

  // 2) legacy globals (kept for compatibility; will be deprecated)
  const legacyTenantId = readGlobal(["__ICONTROL_TENANT__", "id"]);
  const legacyActorId = readGlobal(["__ICONTROL_ACTOR__", "id"]);
  if (typeof legacyTenantId === "string" && legacyTenantId.length > 0
   && typeof legacyActorId === "string" && legacyActorId.length > 0) {
    return { tenantId: legacyTenantId, actorId: legacyActorId, source: "runtime" };
  }

  // Fallback (explicit + safe)
  return { tenantId: "default", actorId: "unknown", source: "fallback" };
}
