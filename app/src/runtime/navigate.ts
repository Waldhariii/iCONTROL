/**
 * Canonical navigation entrypoint.
 * Governance: do not mutate location.hash outside this module.
 */
export function navigate(hashRoute: string): void {
  // Normalize: always use "#/..." shape when provided as "/..."
  const h = hashRoute.startsWith("#") ? hashRoute : `#${hashRoute.startsWith("/") ? "" : "/"}${hashRoute}`;
  globalThis.location.hash = h;
}

export function getCurrentHash(): string {
  return globalThis.location.hash || "";
}
