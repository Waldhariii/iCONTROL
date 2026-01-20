/**
 * ICONTROL_VERSION_GATE_V1
 * Version Gating - Force update des clients obsolètes
 * 
 * Ce module :
 * - Vérifie la version du client au boot
 * - Vérifie périodiquement la version
 * - Bloque l'utilisation si upgrade requis
 */

import { getClientVersion, loadReleaseRegistry } from "./registry";

export interface VersionGateResult {
  requiresUpdate: boolean;
  message?: string;
  url?: string;
  latestVersion?: string;
  minSupportedVersion?: string;
}

/**
 * Vérifie si le client doit être mis à jour
 */
export async function checkVersionGate(): Promise<VersionGateResult> {
  const clientVersion = getClientVersion();
  const registry = loadReleaseRegistry();

  // En production, cela devrait faire un appel API à /meta/release
  // Pour l'instant, on utilise le registry local
  if (compareVersions(clientVersion, registry.min_supported_version) < 0) {
    return {
      requiresUpdate: true,
      message: `Une nouvelle version est disponible (${registry.latest_version}). Veuillez mettre à jour pour continuer.`,
      url: window.location.origin + window.location.pathname,
      latestVersion: registry.latest_version,
      minSupportedVersion: registry.min_supported_version,
    };
  }

  return {
    requiresUpdate: false,
    latestVersion: registry.latest_version,
    minSupportedVersion: registry.min_supported_version,
  };
}

/**
 * Compare deux versions (retourne -1 si v1 < v2, 0 si égal, 1 si v1 > v2)
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Vérifie la version via l'API /meta/release (pour production)
 */
export async function checkVersionGateAPI(): Promise<VersionGateResult> {
  const clientVersion = getClientVersion();

  try {
    const response = await fetch("/meta/release", {
      headers: {
        "X-Client-Version": clientVersion,
      },
    });

    if (response.status === 426) {
      // Upgrade Required
      const data = await response.json();
      return {
        requiresUpdate: true,
        message: data.message || "Une mise à jour est requise.",
        url: data.url || window.location.origin,
        latestVersion: data.latest,
        minSupportedVersion: data.minSupported,
      };
    }

    if (response.ok) {
      const data = await response.json();
      return {
        requiresUpdate: false,
        latestVersion: data.latest,
        minSupportedVersion: data.minSupported,
      };
    }
  } catch (e) {
    console.warn("Failed to check version gate via API, using local registry", e);
    // Fallback sur le registry local
    return checkVersionGate();
  }

  // Fallback
  return checkVersionGate();
}

/**
 * Force reload avec cache busting
 */
export function forceUpdate(url?: string): void {
  const targetUrl = url || window.location.href;

  // Purge caches
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Service worker unregister (si présent)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  // Force reload avec cache bust
  const separator = targetUrl.includes("?") ? "&" : "?";
  window.location.href = `${targetUrl}${separator}_v=${Date.now()}`;
}
