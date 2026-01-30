/**
 * resolveAppKind — détermine si l'app est CP (Control Plane) ou APP (Client).
 * Aligné avec router et main (VITE_APP_KIND, __ICONTROL_APP_KIND__).
 * Fallback: utilise le pathname pour détecter /app vs /cp si VITE_APP_KIND n'est pas disponible.
 */
export function resolveAppKind(): "CP" | "APP" {
  let raw = "";
  try {
    raw = String((import.meta as any)?.env?.VITE_APP_KIND || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  
  // Fallback: détecter depuis le pathname (pour servir les deux apps depuis le même serveur)
  if (!raw && typeof window !== "undefined") {
    try {
      const pathname = window.location.pathname || "";
      if (pathname.startsWith("/app")) return "APP";
      if (pathname.startsWith("/cp")) return "CP";
    } catch {}
  }
  
  const k = String(raw || "").trim().toUpperCase();
  if (k === "CP" || k === "CONTROL_PLANE" || k === "CONTROLPLANE" || k === "ADMIN" || k === "ADMINISTRATION") return "CP";
  if (k === "APP" || k === "CLIENT" || k === "DESKTOP_CLIENT" || k === "CLIENT_APP") return "APP";
  return "CP";
}
