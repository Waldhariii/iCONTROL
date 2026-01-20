/**
 * ICONTROL_APP_CONTEXT_V1
 * Utilitaire pour déterminer si on est dans l'application CLIENT (/app) ou ADMINISTRATION (/cp)
 */

export type AppKind = "APP" | "CP";

export function getAppKind(): AppKind {
  // 1) .env build-time (si existant)
  const k = (import.meta as any)?.env?.VITE_APP_KIND;
  if (k === "CLIENT_APP" || k === "APP") return "APP";
  if (k === "CONTROL_PLANE" || k === "CP") return "CP";

  // 2) runtime heuristic (path first)
  try {
    const p = window.location.pathname || "/";
    if (p.startsWith("/cp")) return "CP";
    if (p.startsWith("/app")) return "APP";
  } catch {}

  // 3) fallback safe: APP (client) par défaut
  return "APP";
}

export function isApp(): boolean {
  return getAppKind() === "APP";
}

export function isCp(): boolean {
  return getAppKind() === "CP";
}
