/**
 * Manifest publié (SSOT)
 * - published: thème actif pour tous (sauf override)
 * - rollbacks: liste historique
 * - experiences: mapping "cp.login" -> presetId, etc.
 */
export type ThemeManifest = {
  published: {
    presetId: string;
    version: string;
    updatedAtISO: string;
    updatedBy?: string;
    note?: string;
  };

  rollbacks?: Array<{
    presetId: string;
    version: string;
    updatedAtISO: string;
    updatedBy?: string;
    note?: string;
  }>;

  experiences?: Record<string, string>; // ex: { "cp.login": "cp-dashboard-charcoal" }
};
