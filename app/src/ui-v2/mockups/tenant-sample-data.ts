/**
 * Tenant-specific SAMPLE DATA.
 * Allowed location: app/src/ui-v2/mockups/** only.
 * Do NOT import this from core surfaces/adapters.
 */
export type TenantSampleRow = {
  id: string;
  cells: { ref: string; client: string; ville: string; statut: string; date: string };
};

export const TENANT_SAMPLE_ROWS: TenantSampleRow[] = [
  { id: "r1", cells: { ref: "J-1042", client: "Safari Park", ville: "Montréal", statut: "Scheduled", date: "2026-01-31" } },
  { id: "r2", cells: { ref: "J-1043", client: "Dupont", ville: "Laval", statut: "Open", date: "2026-02-01" } },
  { id: "r3", cells: { ref: "J-1044", client: "Bouchard", ville: "Longueuil", statut: "Done", date: "2026-01-29" } },
];
