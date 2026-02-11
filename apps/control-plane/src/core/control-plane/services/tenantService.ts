import type { LocalStorageProvider } from "../storage";
import type { AuditService } from "./auditService";
import type { Tenant } from "../types";

/** TenantService — stub pour résolution de build. listTenants retourne [] ; la page tenants utilise des demos si vide. */
export class TenantService {
  constructor(_storage: LocalStorageProvider, _audit: AuditService) {}
  async listTenants(): Promise<Tenant[]> {
    return [];
  }
}
