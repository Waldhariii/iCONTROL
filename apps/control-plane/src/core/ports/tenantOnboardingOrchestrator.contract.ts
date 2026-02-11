/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * Phase7 Move4 - Tenant Onboarding Orchestrator (contract-first)
 * - Contract-only: pure types + IDs
 * - Runtime-safe: no window/document access, no import-time side effects
 */

import type { ReasonCodeV1 } from "./reasonCodes.v1";

export const ORCHESTRATOR_CONTRACT_ID = "tenant-onboarding-orchestrator.v1" as const;

export type OrchestratorStep =
  | "init"
  | "validate"
  | "persist"
  | "commit"
  | "rollback"
  | "done";

export type OrchestratorEvent =
  | { type: "START"; tenantId: string }
  | { type: "PERSIST_OK" }
  | { type: "COMMIT_OK" }
  | { type: "ROLLBACK" }
  | { type: "FAIL"; reasonCode: ReasonCodeV1 };

export type OrchestratorState = {
  tenantId: string;
  step: OrchestratorStep;
  lastError?: { reasonCode: ReasonCodeV1 };
};

export type TenantOnboardingOrchestratorPort = {
  contractId: typeof ORCHESTRATOR_CONTRACT_ID;
  start: (tenantId: string) => Promise<OrchestratorState>;
  progress: (ev: OrchestratorEvent) => Promise<OrchestratorState>;
};
