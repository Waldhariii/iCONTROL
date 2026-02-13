/**
 * ICONTROL_STORAGE_KEYS_V1
 * SSOT des clés LocalStorage (branding stable).
 * Stratégie: écrire uniquement icontrol_*, lecture stricte sans fallback legacy.
 */
export const ICONTROL_KEYS = {
  settings: {
    theme: "icontrol_settings_v1.theme",
    language: "icontrol_settings_v1.language",
    motion: "icontrol_settings_v1.motion",
    notifications: "icontrol_settings_v1.notifications",
    shortcuts: "icontrol_settings_v1.shortcuts",
    home: "icontrol_settings_v1.home",
  },
  iam: {
    role: "icontrol_iam_v1.role",
  },
  logs: {
    core: "icontrol_logs_v1",
  },
} as const;

function safeGet(ls: Storage, k: string): string | null {
  try { return ls.getItem(k); } catch { return null; }
}
function safeSet(ls: Storage, k: string, v: string): void {
  try { ls.setItem(k, v); } catch {}
}

/**
 * Read-through migration:
 * - si newKey absent, lit legacyKey; si trouvé -> écrit newKey (sans effacer legacy)
 * - retourne la valeur (new > legacy)
 */
export function readStrict(ls: Storage, newKey: string): string | null {
  return safeGet(ls, newKey);
}

// FOUNDATION: keep symbol referenced for TS6133 without widening contracts
void safeSet;
