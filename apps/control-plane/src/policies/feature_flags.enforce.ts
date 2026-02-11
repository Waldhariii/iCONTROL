import type { FeatureFlagSet, FeatureFlag, FeatureFlagState } from "./feature_flags.schema";

export type FlagDecisionKind =
  | "ENABLED"
  | "DISABLED"
  | "ROLLOUT_ACTIVE"
  | "ROLLOUT_INACTIVE"
  | "FORCED_OFF";

export type FlagDecision = {
  key: string;
  state: FeatureFlagState;
  kind: FlagDecisionKind;
  rollout?: number;
  bucket?: number; // 0..99 for rollout, if computed
};

export type FlagContext = {
  tenant: string;
  seed?: string; // optional stable seed, e.g. build id
};

function fnv1a32(input: string): number {
  // FNV-1a 32-bit (deterministic, tiny)
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function bucket100(tenant: string, key: string, seed?: string): number {
  const v = fnv1a32(`${tenant}::${key}::${seed || ""}`);
  return v % 100; // 0..99
}

export function decideFlag(key: string, flag: FeatureFlag, ctx: FlagContext): FlagDecision {
  const state = flag.state;

  if (state === "FORCE_OFF") {
    return { key, state, kind: "FORCED_OFF" };
  }
  if (state === "ON") {
    return { key, state, kind: "ENABLED" };
  }
  if (state === "OFF") {
    return { key, state, kind: "DISABLED" };
  }

  // ROLLOUT
  const rollout = typeof flag.rollout === "number" ? flag.rollout : 0;
  const b = bucket100(ctx.tenant || "unknown", key, ctx.seed);
  const active = b < Math.round(rollout);
  return {
    key,
    state,
    kind: active ? "ROLLOUT_ACTIVE" : "ROLLOUT_INACTIVE",
    rollout,
    bucket: b,
  };
}

export function evaluateFeatureFlags(flags: FeatureFlagSet, ctx: FlagContext): FlagDecision[] {
  const out: FlagDecision[] = [];
  const keys = Object.keys(flags.flags || {}).sort();
  for (const k of keys) {
    const flag = flags.flags[k];
    if (!flag) continue;
    out.push(decideFlag(k, flag, ctx));
  }
  return out;
}

export function isEnabled(decisions: FlagDecision[], key: string): boolean {
  const d = decisions.find((x) => x.key === key);
  if (!d) return false;
  return d.kind === "ENABLED" || d.kind === "ROLLOUT_ACTIVE";
}
