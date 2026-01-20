/**
 * Navigation helpers — API stable (bundle-safe).
 * Objectif: satisfaire main.ts (getCurrentHash) + fournir des helpers minimaux.
 * Upgrade path: brancher sur le router canonique + events + guards.
 */

export function getCurrentHash(): string {
  try {
    if (typeof window === "undefined") return "#/";
    return window.location.hash || "#/";
  } catch {
    return "#/";
  }
}

export function navigate(hash: string): void {
  try {
    if (typeof window === "undefined") return;
    window.location.hash = hash.startsWith("#") ? hash : `#${hash}`;
  } catch {
    /* ignore */
  }
}

export default {
  getCurrentHash,
  navigate,
};
