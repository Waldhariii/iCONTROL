/**
 * Governed Redirect — SSOT v1
 * Centralizes redirect behavior so we can later swap implementation
 * (router push, safe render, telemetry) without touching surfaces.
 */
export type RedirectTarget =
  | { kind: "blocked"; reason?: string }
  | { kind: "dashboard"; appKind: "CP" | "APP"; reason?: string };

function toHash(target: RedirectTarget): string {
  switch (target.kind) {
    case "blocked":
      return "#/blocked";
    case "dashboard":
      return target.appKind === "CP" ? "/cp/#/dashboard" : "/app/#/dashboard";
  }
}

export function governedRedirect(target: RedirectTarget): void {
  // Minimal v1: use location.href assignment only here (single choke-point).
  // Future: integrate router + SafeRender + audit event.
  const h = toHash(target);

  try {
    // If the hash already matches, no-op.
    const cur = String(window.location.href || "");
    if (cur.includes(h)) return;

    if (h.startsWith("/cp/") || h.startsWith("/app/")) {
      // Cross-app kind redirect (absolute-ish within same origin)
      window.location.assign(h);
      return;
    }

    // Same-surface hash redirect via assign to satisfy no-raw-location-hash governance.
    window.location.assign(h);
  } catch {
    // fail-soft: do nothing
  }
}
