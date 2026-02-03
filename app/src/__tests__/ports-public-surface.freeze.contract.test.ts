import { describe, it, expect } from "vitest";
import * as Ports from "../core/ports";

const EXPECTED = [
  '__resetForTests',
  'Action',
  'ActivationDecision',
  'ActivationRegistryFacade',
  'ActivationWrite',
  'ActorId',
  'bindActivationRegistry',
  'bindPolicyEngine',
  'bindSnapshot',
  'bindSnapshotPort',
  'bindVfs',
  'bindVfsPort',
  'bootstrapCpEnforcement',
  'createActivationRegistryFacade',
  'createPolicyEngineFacade',
  'EnforcementDeps',
  'getSnapshotPort',
  'getVfsPort',
  'makeTenantOnboardingPersistedFacade',
  'ModuleId',
  'PolicyContext',
  'PolicyDecision',
  'PolicyEngineFacade',
  'REASON_CODES_V1',
  'ReasonCode',
  'ReasonCodeV1',
  'registerCpEnforcementDeps',
  'requireCpEnforcementDeps',
  'Resource',
  'RuntimeIdentity',
  'RuntimeIdentityPort',
  'Subject',
  'TenantId',
] as const;

describe("ports public surface freeze (contract)", () => {
  it("exports list is stable + sorted", () => {
    const actual = Object.keys(Ports).sort((a, b) => a.localeCompare(b));
    expect(actual).toEqual([...EXPECTED]);
    expect([...EXPECTED]).toEqual([...new Set([...EXPECTED])].sort((a, b) => a.localeCompare(b)));
  });
});
