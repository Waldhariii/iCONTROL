/**
 * Region Policy — Contract First
 * Objectif: rendre la plateforme multi-region sans casser le core gratuit.
 */

export type Region = "na-east" | "na-west" | "eu-west" | "ap-south";

export type RegionDecision = {
  region: Region;
  reason?: string;
};

export type RegionInput = {
  tenantId: string;
  ipCountry?: string;
  userPrefRegion?: Region;
  dataResidency?: Region;
};

export interface RegionPolicy {
  decide(input: RegionInput): RegionDecision;
}
