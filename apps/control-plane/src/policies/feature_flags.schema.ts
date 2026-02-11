export type FeatureFlagState = "ON" | "OFF" | "ROLLOUT" | "FORCE_OFF";

export type FeatureFlag = {
  state: FeatureFlagState;
  rollout?: number; // 0..100 (only meaningful when state==="ROLLOUT")
};

export type FeatureFlagSet = {
  flags: Record<string, FeatureFlag>;
};

const ALLOWED_STATES: readonly FeatureFlagState[] = ["ON", "OFF", "ROLLOUT", "FORCE_OFF"] as const;

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

export function isFeatureFlag(input: unknown): input is FeatureFlag {
  if (!isObj(input)) return false;

  const state = input["state"];
  if (typeof state !== "string" || !ALLOWED_STATES.includes(state as FeatureFlagState)) return false;

  if ("rollout" in input && input["rollout"] !== undefined) {
    if (typeof input["rollout"] !== "number") return false;
    if (!Number.isFinite(input["rollout"])) return false;
    if (input["rollout"] < 0 || input["rollout"] > 100) return false;
  }

  // If rollout present, allow only when state=ROLLOUT (keep contract strict)
  if (typeof (input as any).rollout === "number" && state !== "ROLLOUT") return false;

  return true;
}

export function isFeatureFlagSet(input: unknown): input is FeatureFlagSet {
  if (!isObj(input)) return false;
  if (!("flags" in input)) return false;

  const flags = (input as any).flags;
  if (!isObj(flags)) return false;

  for (const [k, v] of Object.entries(flags)) {
    if (typeof k !== "string" || k.trim().length === 0) return false;
    if (!isFeatureFlag(v)) return false;
  }
  return true;
}
