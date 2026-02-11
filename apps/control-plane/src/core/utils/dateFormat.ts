/**
 * ICONTROL_DATE_FORMAT — formatage dates centralisé (SSOT)
 */

export type DateInput = Date | string | number;

function toDate(d: DateInput): Date {
  if (d instanceof Date) return d;
  if (typeof d === "number") return new Date(d);
  const parsed = new Date(String(d));
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Date + heure au format court (ex: "24/01/2025 14:30")
 * Locale: fr-CA ou fr-FR selon dispo.
 */
export function formatDateTime(d: DateInput): string {
  const dt = toDate(d);
  try {
    return dt.toLocaleString("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(",", " ");
  } catch {
    return dt.toISOString().slice(0, 16).replace("T", " ");
  }
}

/**
 * Date seule (ex: "24/01/2025")
 */
export function formatDate(d: DateInput): string {
  const dt = toDate(d);
  try {
    return dt.toLocaleDateString("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return dt.toISOString().slice(0, 10);
  }
}

/**
 * Relatif pour les dernières 24–48 h : "il y a 5 min", "aujourd'hui à 14h", "hier à 09h", sinon formatDateTime.
 */
export function formatRelative(d: DateInput): string {
  const dt = toDate(d);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
void diffDay;

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH} h`;

  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dtDay = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const dayDiff = Math.floor((nowDay - dtDay) / 86400000);

  const timeStr = (() => {
    try { return dt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return ""; }
  })();

  if (dayDiff === 0) return timeStr ? "aujourd'hui à " + timeStr : formatDateTime(d);
  if (dayDiff === 1) return timeStr ? "hier à " + timeStr : formatDateTime(d);
  if (dayDiff < 7) return `il y a ${dayDiff} j`;
  return formatDateTime(d);
}