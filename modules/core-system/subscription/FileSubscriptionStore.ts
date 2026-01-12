import fs from "node:fs";
import path from "node:path";
import type { SubscriptionRecord } from "./SubscriptionRecord";
import type { SubscriptionStore } from "./SubscriptionStore";

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

  constructor(opts?: { baseDir?: string }) {
    const cwd = process.cwd();
    const repoRoot = cwd.endsWith(path.sep + "app") ? path.resolve(cwd, "..") : cwd;
    // ICONTROL_SUB_STORE_ROOT_V1
    this.baseDir = opts?.baseDir ?? path.resolve(repoRoot, "_DATA/subscriptions");
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  private fileForTenant(tenantId: string): string {
    // 1 fichier par tenant => isolation simple
    return path.join(this.baseDir, `${tenantId}.json`);
  }

  async getByTenantId(tenantId: string): Promise<SubscriptionRecord | null> {
    const fp = this.fileForTenant(tenantId);
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
    fs.writeFileSync(fp, JSON.stringify(rec, null, 2) + "\n");
  }
}
