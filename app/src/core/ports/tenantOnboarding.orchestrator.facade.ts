/**
 * Default orchestrator facade (safe by default)
 * - depends only on other ports contracts/facades
 * - no import-time effects
 */

import type { TenantOnboardingOrchestratorContract, OnboardingInput, OnboardingResult } from "./tenantOnboarding.orchestrator.contract";
import type { ReasonCodeV1 } from "./reasonCodes.v1";

// Existing ports from Phase7 Move1/Move2:
import type { TenantOnboardingContract } from "./tenantOnboarding.contract";
import type { DefaultEntitlementsContract } from "./defaultEntitlements.contract";
import type { BillingHookContract } from "./billingHook.contract";

// Persist ports (Phase5/Phase7): best-effort optional
import type { VfsFacade } from "./vfs.facade";
import type { SnapshotFacade } from "./snapshot.facade";

export type OrchestratorDeps = {
  tenantOnboarding: TenantOnboardingContract;
  defaultEntitlements: DefaultEntitlementsContract;
  billingHook: BillingHookContract;
  vfs?: VfsFacade;
  snapshot?: SnapshotFacade;
};

const okStep = (step: string) => ({ step: step as any, ok: true as const });
const koStep = (step: string, reasonCode: ReasonCodeV1, detail?: string) =>
  ({ step: step as any, ok: false as const, reasonCode, detail });

export function makeTenantOnboardingOrchestratorFacade(deps: OrchestratorDeps): TenantOnboardingOrchestratorContract {
  return {
    async run(input: OnboardingInput): Promise<OnboardingResult> {
      const steps: OnboardingResult["steps"] = [];

      // Step 1: validate
      if (!input?.tenantId || typeof input.tenantId !== "string") {
        steps.push(koStep("validate-input", "ERR_TENANT_ONBOARDING_INVALID_INPUT", "tenantId missing/invalid"));
        return { ok: false, tenantId: String(input?.tenantId ?? ""), steps, reasonCode: "ERR_TENANT_ONBOARDING_INVALID_INPUT" };
      }
      steps.push(okStep("validate-input"));

      // Optional snapshot begin
      let snapId: string | undefined;
      try {
        if (!input.dryRun && deps.snapshot?.begin) {
          snapId = await deps.snapshot.begin({ scope: "tenant-onboarding", tenantId: input.tenantId });
        }
      } catch {
        // Non-fatal: keep going (but record)
        steps.push(koStep("persist", "WARN_SNAPSHOT_BEGIN_FAILED", "snapshot begin failed; continuing"));
      }

      // Step 2: onboarding ensure
      try {
        if (!input.dryRun) {
          await deps.tenantOnboarding.ensureTenant({ tenantId: input.tenantId, actorId: input.actorId });
        }
        steps.push(okStep("validate-input")); // already ok; keep deterministic "progress"
      } catch (e: any) {
        const rc: ReasonCodeV1 = "ERR_TENANT_ONBOARDING_FAILED";
        steps.push(koStep("validate-input", rc, String(e?.message ?? e)));
        // rollback snapshot if possible
        if (snapId && deps.snapshot?.rollback) {
          try { await deps.snapshot.rollback({ snapshotId: snapId }); } catch {}
        }
        return { ok: false, tenantId: input.tenantId, steps, reasonCode: rc };
      }

      // Step 3: default entitlements
      try {
        if (!input.dryRun) {
          await deps.defaultEntitlements.applyDefaults({ tenantId: input.tenantId, actorId: input.actorId });
        }
        steps.push(okStep("default-entitlements"));
      } catch (e: any) {
        const rc: ReasonCodeV1 = "ERR_DEFAULT_ENTITLEMENTS_FAILED";
        steps.push(koStep("default-entitlements", rc, String(e?.message ?? e)));
        if (snapId && deps.snapshot?.rollback) {
          try { await deps.snapshot.rollback({ snapshotId: snapId }); } catch {}
        }
        return { ok: false, tenantId: input.tenantId, steps, reasonCode: rc };
      }

      // Step 4: billing hook (safe no-op default)
      try {
        if (!input.dryRun) {
          await deps.billingHook.onTenantProvisioned({ tenantId: input.tenantId, actorId: input.actorId });
        }
        steps.push(okStep("billing-hook"));
      } catch (e: any) {
        const rc: ReasonCodeV1 = "ERR_BILLING_HOOK_FAILED";
        steps.push(koStep("billing-hook", rc, String(e?.message ?? e)));
        if (snapId && deps.snapshot?.rollback) {
          try { await deps.snapshot.rollback({ snapshotId: snapId }); } catch {}
        }
        return { ok: false, tenantId: input.tenantId, steps, reasonCode: rc };
      }

      // Step 5: persist/commit snapshot
      try {
        if (!input.dryRun && snapId && deps.snapshot?.commit) {
          await deps.snapshot.commit({ snapshotId: snapId });
        }
        steps.push(okStep("persist"));
      } catch {
        steps.push(koStep("persist", "WARN_SNAPSHOT_COMMIT_FAILED", "snapshot commit failed; state may still be consistent"));
      }

      steps.push(okStep("done"));
      return { ok: true, tenantId: input.tenantId, steps };
    }
  };
}
