/**
 * Default orchestrator facade (safe by default)
 * - depends only on other ports contracts/facades
 * - no import-time effects
 */

import type { TenantOnboardingOrchestratorContract, OnboardingInput, OnboardingResult } from "./tenantOnboarding.orchestrator.contract";
import type { ReasonCodeV1 } from "./reasonCodes.v1";

// Existing ports from Phase7 Move1/Move2:
import type { TenantOnboardingPort } from "./tenantOnboarding.contract";
import type { DefaultEntitlementsPort } from "./defaultEntitlements.contract";
import type { BillingHookPort } from "./billingHook.contract";

// Persist ports (Phase5/Phase7): best-effort optional
import { bindVfsPort, getVfsPort } from "./vfs.facade";
import { bindSnapshotPort, getSnapshotPort } from "./snapshot.facade";


// FOUNDATION: keep imports referenced (no runtime effect)
void bindVfsPort; void getVfsPort; void bindSnapshotPort; void getSnapshotPort;
// FOUNDATION_SHIM_ORCH_METHODS_V2 (caller-only)
type _MaybeEnsureTenant = { ensureTenant?: (input: any) => any };
type _MaybeApplyDefaults = { applyDefaults?: (input: any) => any };
type _MaybeOnTenantProvisioned = { onTenantProvisioned?: (input: any) => any };

// Optional persistence shapes (local-only)
type _SnapshotLike = {
  begin?: (input: any) => Promise<string>;
  rollback?: (input: any) => Promise<void>;
  commit?: (input: any) => Promise<void>;
};
type _VfsLike = Record<string, unknown>;

// FOUNDATION_SHIM_ORCH_METHODS (caller-only)


export type OrchestratorDeps = {
  tenantOnboarding: TenantOnboardingPort;
  defaultEntitlements: DefaultEntitlementsPort;
  billingHook: BillingHookPort;
  vfs?: _VfsLike;
  snapshot?: _SnapshotLike;
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
          const __fn_ensureTenant = (deps.tenantOnboarding as unknown as _MaybeEnsureTenant).ensureTenant;
          if (__fn_ensureTenant) await __fn_ensureTenant({ tenantId: input.tenantId, actorId: input.actorId });
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
          const __fn_applyDefaults = (deps.defaultEntitlements as unknown as _MaybeApplyDefaults).applyDefaults;
          if (__fn_applyDefaults) await __fn_applyDefaults({ tenantId: input.tenantId, actorId: input.actorId });
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
          const __fn_onTenantProvisioned = (deps.billingHook as unknown as _MaybeOnTenantProvisioned).onTenantProvisioned;
          if (__fn_onTenantProvisioned) await __fn_onTenantProvisioned({ tenantId: input.tenantId, actorId: input.actorId });
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
