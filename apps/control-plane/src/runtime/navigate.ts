/**
 * Canonical navigation entrypoint.
 * Governance: do not mutate location.hash outside this module.
 */
import { warn } from "../platform/observability/logger";

let lastRedirectHash: string | null = null;
let lastRedirectTs: number = 0;
let redirectCount = 0;

export function navigate(hashRoute: string): void {
  // Normalize: always use "#/..." shape when provided as "/..."
  const h = hashRoute.startsWith("#") ? hashRoute : `#${hashRoute.startsWith("/") ? "" : "/"}${hashRoute}`;
  
  // Idempotence: if already on target hash, NOOP
  const currentHash = globalThis.location.hash || "";
  if (currentHash === h) {
    return;
  }
  
  // Anti-loop guard: prevent rapid redirects to same hash
  const now = Date.now();
  if (lastRedirectHash === h && (now - lastRedirectTs) < 1000) {
    redirectCount++;
    if (redirectCount >= 2) {
      void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
        payload: { target: h, count: redirectCount },
      });
      return; // NOOP to break loop
    }
  } else {
    redirectCount = 0;
  }
  
  lastRedirectHash = h;
  lastRedirectTs = now;
  globalThis.location.hash = h;
}
