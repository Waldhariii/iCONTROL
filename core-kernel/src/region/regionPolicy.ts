export type Region = string;

export type RegionPolicy = {
  defaultRegion: Region;
  allowedRegions: Region[];
};

export function pickRegion(policy: RegionPolicy, requested?: Region): Region {
  if (requested && policy.allowedRegions.includes(requested)) return requested;
  return policy.defaultRegion;
}
