import { loadFeatureFlags, type AuditEvent as LoaderAudit } from "./feature_flags.loader";
import { evaluateFeatureFlags, type FlagDecision } from "./feature_flags.enforce";
import type { FeatureFlagSet } from "./feature_flags.schema";

export type FeatureFlagsBootOutcome = {
  source: "default" | "override";
  flags: FeatureFlagSet;
  decisions: FlagDecision[];
  audit: LoaderAudit[];
};

export function buildFeatureFlagsBootOutcome(override?: unknown, ctx?: { tenant?: string; seed?: string }): FeatureFlagsBootOutcome {
  const loaded = loadFeatureFlags(override);
  const tenant = (ctx?.tenant || "default").trim() || "default";
  const flagCtx: { tenant: string; seed?: string } = { tenant };
  if (ctx?.seed) flagCtx.seed = ctx.seed;
  const decisions = evaluateFeatureFlags(loaded.flags, flagCtx);
  return { source: loaded.source, flags: loaded.flags, decisions, audit: loaded.audit };
}
