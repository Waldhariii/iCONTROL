import type { RegionDecision, RegionInput, RegionPolicy } from "./regionPolicy.contract";

export function createRegionPolicy(): RegionPolicy {
  return {
    decide(input: RegionInput): RegionDecision {
      if (input.userPrefRegion) return { region: input.userPrefRegion, reason: "user_preference" };
      if (input.dataResidency) return { region: input.dataResidency, reason: "data_residency" };
      return { region: "na-east", reason: "default" };
    },
  };
}
