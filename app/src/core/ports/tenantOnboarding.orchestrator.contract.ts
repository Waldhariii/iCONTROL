/**
 * Tenant Onboarding Orchestrator (contract-first)
 * Purpose: orchestrate a deterministic onboarding flow:
 *  - create/ensure tenant identity (already in runtime identity SSOT)
 *  - apply default entitlements
 *  - call billing hook (safe no-op unless paid modules override)
 *  - persist through VFS/Snapshot if enabled (Phase7 Move2)
 *
 * Design: ports-only, node-safe, deterministic, no side effects at import.
 */

import type { ReasonCodeV1 } from "./reasonCodes.v1";

export type TenantId = string;

export type OnboardingInput = {
  tenantId: TenantId;
  actorId?: string; // optional system actor
  dryRun?: boolean; // if true: no writes (for previews)
};

export type OnboardingStep =
  | "validate-input"
  | "default-entitlements"
  | "billing-hook"
  | "persist"
  | "done";

export type OnboardingResult = {
  ok: boolean;
  tenantId: TenantId;
  steps: Array<{ step: OnboardingStep; ok: boolean; reasonCode?: ReasonCodeV1; detail?: string }>;
  reasonCode?: ReasonCodeV1;
};

export type TenantOnboardingOrchestratorContract = {
  run(input: OnboardingInput): Promise<OnboardingResult>;
};

export const ORCHESTRATOR_CONTRACT_ID = "ports.tenantOnboarding.orchestrator.v1";
