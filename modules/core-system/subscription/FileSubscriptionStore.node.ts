import fs from "node:fs";
import path from "node:path";
import type { SubscriptionRecord } from "./SubscriptionRecord";
import type { SubscriptionStore } from "./SubscriptionStore";
import { isEnabled } from "../../../app/src/policies/feature_flags.enforce";
import { createAuditHook } from "../../../app/src/core/write-gateway/auditHook";
import { createLegacyAdapter } from "../../../app/src/core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../../app/src/core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../../app/src/core/write-gateway/writeGateway";
import { getLogger } from "../../../app/src/core/utils/logger";

/**
 * File-backed SubscriptionStore (SSOT persistence) — enterprise baseline.
 * - Simple JSON file per tenant (ou un fichier unique), pour démarrer sans DB.
 * - Garantit: read/write déterministes, compatible audit trail.
 *
 * NOTE: ceci est un "minimum viable persistence".
 * L’étape suivante pourra brancher Storage Provider/VFS officiel.
 */
export class FileSubscriptionStore implements SubscriptionStore {
  private readonly baseDir: string;
  private static readonly TENANT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;

  constructor(opts?: { baseDir?: string }) {
    const cwd = process.cwd();
    const repoRoot = cwd.endsWith(path.sep + "app") ? path.resolve(cwd, "..") : cwd;
    // ICONTROL_SUB_STORE_ROOT_V1
    this.baseDir = opts?.baseDir ?? path.resolve(repoRoot, "_DATA/subscriptions");
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  private safeTenantId(tenantId: string): string {
    const t = String(tenantId || "").trim();
    if (!t || !FileSubscriptionStore.TENANT_ID_RE.test(t)) {
      throw new Error("ERR_TENANT_ID_INVALID");
    }
    return t;
  }

  private fileForTenant(tenantId: string): string {
    // 1 fichier par tenant => isolation simple
    const safeId = this.safeTenantId(tenantId);
    return path.join(this.baseDir, `${safeId}.json`);
  }

  /** WRITE_GATEWAY_FS — shadow scaffold (legacy-first; NO-OP adapter). */
  private static readonly __logger = getLogger("WRITE_GATEWAY_FS");
  private static __gateway: ReturnType<typeof createWriteGateway> | null = null;

  private static resolveGateway() {
    if (FileSubscriptionStore.__gateway) return FileSubscriptionStore.__gateway;
    FileSubscriptionStore.__gateway = createWriteGateway({
      policy: createPolicyHook(),
      audit: createAuditHook(),
      adapter: createLegacyAdapter((cmd) => {
        void cmd;
        return { status: "SKIPPED", correlationId: cmd.correlationId };
      }, "fileSubscriptionStoreFsShadowNoop"),
      safeMode: { enabled: true },
    });
    return FileSubscriptionStore.__gateway;
  }

  private static isShadowEnabled(): boolean {
    try {
      const rt: any = globalThis as any;
      const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
      if (Array.isArray(decisions)) return isEnabled(decisions, "file_subscription_store_node_fs_shadow");
      const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
      const state = flags?.["file_subscription_store_node_fs_shadow"]?.state;
      return state === "ON" || state === "ROLLOUT";
    } catch {
      return false;
    }
  }

  async getByTenantId(tenantId: string): Promise<SubscriptionRecord | null> {
    let fp = "";
    try {
      fp = this.fileForTenant(tenantId);
    } catch {
      return null;
    }
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, "utf8");
    try {
      return JSON.parse(raw) as SubscriptionRecord;
    } catch {
      // si corruption => safe fallback à null (enterprise_free)
      return null;
    }
  }

  async upsert(rec: SubscriptionRecord): Promise<void> {
    const fp = this.fileForTenant(rec.tenantId);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const serialized = JSON.stringify(rec, null, 2) + "\n";
    fs.writeFileSync(fp, serialized);

    // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
    if (!FileSubscriptionStore.isShadowEnabled()) return;

    const correlationId = createCorrelationId("fs");
    const cmd = {
      kind: "FILESUBSCRIPTIONSTORE_NODE_FS_WRITE_SHADOW",
      tenantId: rec.tenantId,
      correlationId,
      payload: { path: fp, bytes: serialized.length },
      meta: { shadow: true, source: "FileSubscriptionStore.node" },
    };

    try {
      const res = FileSubscriptionStore.resolveGateway().execute(cmd as any);
      if (res.status !== "OK" && res.status !== "SKIPPED") {
        FileSubscriptionStore.__logger.warn("WRITE_GATEWAY_FS_FALLBACK", {
          kind: cmd.kind,
          tenant_id: rec.tenantId,
          correlation_id: correlationId,
          status: res.status,
        });
      }
    } catch (err) {
      FileSubscriptionStore.__logger.warn("WRITE_GATEWAY_FS_ERROR", {
        kind: cmd.kind,
        tenant_id: rec.tenantId,
        correlation_id: correlationId,
        error: String(err),
      });
    }
  }
}
