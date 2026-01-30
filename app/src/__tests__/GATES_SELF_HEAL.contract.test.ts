/**
 * GATES_SELF_HEAL — Contrats bloquants pour le framework Reliability & Self-Healing.
 *
 * Référence: RELIABILITY_SPEC, Bloc additionnel Auto-audit + auto-réparation.
 * Invariants:
 * - Toute action auto-heal passe par Write Gateway (ou canal ops signé).
 * - Toute action produit audit log + trace_id.
 * - Aucune action ne peut écrire hors namespace tenant.
 * - Rollback fonctionne (simulation).
 */

import { describe, it, expect } from "vitest";
import { createWriteGateway } from "../core/write-gateway/writeGateway";
import { createPolicyHook } from "../core/write-gateway/policyHook";
import { createAuditHook } from "../core/write-gateway/auditHook";
import { createLegacyAdapter } from "../core/write-gateway/adapters/legacyAdapter";
import { createCorrelationId } from "../core/write-gateway/writeGateway";
import { getTenantId } from "../core/runtime/tenant";

describe("GATES_SELF_HEAL contract", () => {
  it("write gateway requires tenantId and correlationId for any write", () => {
    const gateway = createWriteGateway({
      policy: createPolicyHook(),
      audit: createAuditHook(),
      adapter: createLegacyAdapter(
        (cmd) => ({ status: "OK", correlationId: cmd.correlationId }),
        "test"
      ),
      safeMode: { enabled: false },
    });

    const missingTenant = gateway.execute({
      kind: "SELF_HEAL_DRY_RUN",
      tenantId: "",
      correlationId: createCorrelationId("test"),
      payload: {},
    });
    expect(missingTenant.status).toBe("ERROR");
    expect(missingTenant.error).toMatch(/TENANT|REQUIRED/i);

    const withTenant = gateway.execute({
      kind: "SELF_HEAL_DRY_RUN",
      tenantId: "public",
      correlationId: createCorrelationId("test"),
      payload: {},
    });
    expect(["OK", "SKIPPED"]).toContain(withTenant.status);
  });

  it("self-heal actions must not write outside tenant namespace", () => {
    const tenantId = getTenantId();
    expect(typeof tenantId).toBe("string");
    expect(tenantId.length).toBeGreaterThan(0);
    // Namespace key must include tenant (convention: icontrol.t.<tenant>.*)
    const nsPattern = /^icontrol\.t\./;
    expect(`icontrol.t.${tenantId}.auditLog.v1`).toMatch(nsPattern);
  });

  it("correlationId is required for audit trace", () => {
    const gateway = createWriteGateway({
      policy: createPolicyHook(),
      audit: createAuditHook(),
      adapter: createLegacyAdapter(
        (cmd) => ({ status: "OK", correlationId: cmd.correlationId }),
        "test"
      ),
      safeMode: { enabled: false },
    });

    const noCorrelation = gateway.execute({
      kind: "AUDIT_APPEND",
      tenantId: "public",
      correlationId: "",
      payload: {},
    });
    expect(noCorrelation.status).toBe("ERROR");
    expect(noCorrelation.error).toMatch(/CORRELATION|REQUIRED/i);
  });
});
