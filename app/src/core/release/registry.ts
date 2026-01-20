/**
 * ICONTROL_RELEASE_REGISTRY_V1
 * Release Registry - Gestion centralisée des versions publiées
 * 
 * Ce module gère :
 * - latest_version : dernière version disponible
 * - min_supported_version : version minimale supportée (force update si <)
 * - published_config_version : version de config publiée
 * - draft_config_version : version de config en draft (admin only)
 */

export interface ReleaseRegistry {
  latest_version: string;
  min_supported_version: string;
  published_config_version: string;
  draft_config_version: string;
  updated_at: string; // ISO date
  published_at?: string; // ISO date (dernière publication)
}

const LS_KEY_RELEASE_REGISTRY = "icontrol_release_registry";

const DEFAULT_REGISTRY: ReleaseRegistry = {
  latest_version: "0.2.0",
  min_supported_version: "0.2.0",
  published_config_version: "0.2.0",
  draft_config_version: "0.2.0",
  updated_at: new Date().toISOString(),
};

/**
 * Charge le Release Registry depuis localStorage (ou retourne le défaut)
 */
export function loadReleaseRegistry(): ReleaseRegistry {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_REGISTRY;
  }

  try {
    const raw = localStorage.getItem(LS_KEY_RELEASE_REGISTRY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validation basique
      if (
        typeof parsed.latest_version === "string" &&
        typeof parsed.min_supported_version === "string" &&
        typeof parsed.published_config_version === "string" &&
        typeof parsed.draft_config_version === "string"
      ) {
        return parsed as ReleaseRegistry;
      }
    }
  } catch (e) {
    console.warn("Failed to load release registry from localStorage", e);
  }

  return DEFAULT_REGISTRY;
}

/**
 * Sauvegarde le Release Registry dans localStorage
 */
export function saveReleaseRegistry(registry: ReleaseRegistry): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const updated: ReleaseRegistry = {
      ...registry,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LS_KEY_RELEASE_REGISTRY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save release registry to localStorage", e);
  }
}

/**
 * Met à jour la version publiée (appelé lors de la publication atomique)
 */
export function updatePublishedVersion(
  publishedConfigVersion: string,
  latestVersion?: string,
  minSupportedVersion?: string
): void {
  const registry = loadReleaseRegistry();
  const updated: ReleaseRegistry = {
    ...registry,
    published_config_version: publishedConfigVersion,
    published_at: new Date().toISOString(),
  };

  if (latestVersion) {
    updated.latest_version = latestVersion;
  }

  if (minSupportedVersion) {
    updated.min_supported_version = minSupportedVersion;
  }

  saveReleaseRegistry(updated);
}

/**
 * Met à jour la version draft (admin only)
 */
export function updateDraftVersion(draftConfigVersion: string): void {
  const registry = loadReleaseRegistry();
  const updated: ReleaseRegistry = {
    ...registry,
    draft_config_version: draftConfigVersion,
  };
  saveReleaseRegistry(updated);
}

/**
 * Récupère la version du client (depuis package.json ou build)
 */
export function getClientVersion(): string {
  // En production, cela devrait venir de package.json ou d'une variable d'environnement
  // Pour l'instant, on utilise la version du registry
  const registry = loadReleaseRegistry();
  return registry.latest_version;
}
