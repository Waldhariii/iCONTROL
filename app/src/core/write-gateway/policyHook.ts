import { getLogger } from "../utils/logger";
import type { WriteCommand } from "./contracts";

export type PolicyDecision = {
  allowed: boolean;
  reason?: string;
};

export interface PolicyHook {
  evaluate: (cmd: WriteCommand) => PolicyDecision;
}

export function createPolicyHook(): PolicyHook {
  const logger = getLogger("WRITE_POLICY");
  return {
    evaluate(cmd) {
      logger.warn("WRITE_POLICY_STUB_ALLOW", {
        kind: cmd.kind,
        tenant_id: cmd.tenantId,
        correlation_id: cmd.correlationId,
      });
      return { allowed: true, reason: "POLICY_HOOK_NOT_CONFIGURED" };
    },
  };
}
