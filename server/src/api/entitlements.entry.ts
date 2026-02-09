import { Router } from "express";
import { writeAudit } from "../db/auditRepo";
import type { DB } from "../db/types";

/**
 * Canonical entry for entitlements.
 * - Guarantees audit write-through (ENTITLEMENTS_READ)
 * - Does NOT depend on legacy entitlements.ts export shape.
 * - Can be upgraded later to delegate to a real resolver/service.
 */
export function entitlementsEntry(db: DB) {
  const r = Router();

  r.get("/", (req, res) => {
    writeAudit(db, {
      tenantId: req.tenant?.tenantId ?? null,
      userId: (req as any).userId ?? null,
      action: "ENTITLEMENTS_READ",
      resourceType: "entitlements",
      metadata: {
        plan: req.tenant?.tenantPlan ?? null
      }
    });

    res.json({
      tenantId: req.tenant?.tenantId ?? null,
      plan: req.tenant?.tenantPlan ?? null,
      entitlements: { demo: true }
    });
  });

  return r;
}
