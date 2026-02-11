/** Types partagés Control Plane (stub pour résolution de build). */
export interface Tenant {
  tenantId: string;
  planId: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  createdAt: number | string;
  updatedAt: number | string;
  limits: { maxUsers: number; maxStorageGb: number; apiRateLimit: number };
  region: string;
  safeModePolicy: string;
  retentionPolicy: string;
}
