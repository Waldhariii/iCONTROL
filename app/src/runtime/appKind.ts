/**
 * resolveAppKind — détermine si l'app est CP (Control Plane) ou APP (Client).
 * Aligné avec router et main (VITE_APP_KIND, __ICONTROL_APP_KIND__).
 */
export function resolveAppKind(): "CP" | "APP" {
  let raw = "";
  try {
    raw = String((import.meta as any)?.env?.VITE_APP_KIND || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  const k = String(raw || "").trim().toUpperCase();
  if (k === "CP" || k === "CONTROL_PLANE" || k === "CONTROLPLANE" || k === "ADMIN" || k === "ADMINISTRATION") return "CP";
  if (k === "APP" || k === "CLIENT" || k === "DESKTOP_CLIENT" || k === "CLIENT_APP") return "APP";
  return "CP";
}
