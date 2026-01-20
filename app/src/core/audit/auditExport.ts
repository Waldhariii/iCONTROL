/**
 * ICONTROL_AUDIT_EXPORT_V1
 * Export avancé des logs d'audit avec filtres
 */

import { readAuditLog, type AuditEvent } from "./auditLog";
import { exportToCSV, exportToJSON } from "../ui/exportUtils";

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  level?: "INFO" | "WARN" | "ERROR";
  code?: string;
  message?: string;
  userId?: string;
}

export function filterAuditLog(filter: AuditFilter): AuditEvent[] {
  let events = readAuditLog();

  // Filtre par date
  if (filter.startDate) {
    const start = filter.startDate.getTime();
    events = events.filter(e => {
      const ts = e.ts ? new Date(e.ts).getTime() : 0;
      return ts >= start;
    });
  }

  if (filter.endDate) {
    const end = filter.endDate.getTime();
    events = events.filter(e => {
      const ts = e.ts ? new Date(e.ts).getTime() : 0;
      return ts <= end;
    });
  }

  // Filtre par niveau
  if (filter.level) {
    events = events.filter(e => {
      const code = String(e.code || "").toUpperCase();
      if (filter.level === "ERROR") return code.startsWith("ERR_") || code.startsWith("ERROR");
      if (filter.level === "WARN") return code.startsWith("WARN_") || code.startsWith("WARNING");
      if (filter.level === "INFO") return !code.startsWith("ERR_") && !code.startsWith("WARN_");
      return true;
    });
  }

  // Filtre par code
  if (filter.code) {
    const codeLower = filter.code.toLowerCase();
    events = events.filter(e => 
      String(e.code || "").toLowerCase().includes(codeLower)
    );
  }

  // Filtre par message
  if (filter.message) {
    const msgLower = filter.message.toLowerCase();
    events = events.filter(e => 
      String(e.message || "").toLowerCase().includes(msgLower)
    );
  }

  // Filtre par utilisateur (si disponible dans les métadonnées)
  if (filter.userId) {
    events = events.filter(e => {
      const meta = e as any;
      return meta.userId === filter.userId || meta.actorId === filter.userId;
    });
  }

  return events;
}

export function exportAuditLogCSV(filter: AuditFilter = {}, filename: string = "audit-log"): void {
  const events = filterAuditLog(filter);
  const csvData = events.map(e => ({
    "Timestamp": e.ts || "",
    "Code": e.code || "",
    "Niveau": String(e.code || "").startsWith("ERR_") ? "ERROR" : 
              String(e.code || "").startsWith("WARN_") ? "WARNING" : "INFO",
    "Message": e.message || "",
    "Détails": JSON.stringify((e as any).detail || {}),
  }));
  exportToCSV(csvData, filename);
}

export function exportAuditLogJSON(filter: AuditFilter = {}, filename: string = "audit-log"): void {
  const events = filterAuditLog(filter);
  exportToJSON(events, filename);
}

export function getAuditStatistics(): {
  total: number;
  byLevel: { INFO: number; WARN: number; ERROR: number };
  byDay: Array<{ date: string; count: number }>;
  recentErrors: number;
} {
  const events = readAuditLog();
  const now = new Date();
  const last24h = now.getTime() - (24 * 60 * 60 * 1000);

  const stats = {
    total: events.length,
    byLevel: {
      INFO: 0,
      WARN: 0,
      ERROR: 0
    },
    byDay: [] as Array<{ date: string; count: number }>,
    recentErrors: 0
  };

  // Comptage par niveau
  events.forEach(e => {
    const code = String(e.code || "").toUpperCase();
    if (code.startsWith("ERR_") || code.startsWith("ERROR")) {
      stats.byLevel.ERROR++;
      const ts = e.ts ? new Date(e.ts).getTime() : 0;
      if (ts >= last24h) stats.recentErrors++;
    } else if (code.startsWith("WARN_") || code.startsWith("WARNING")) {
      stats.byLevel.WARN++;
    } else {
      stats.byLevel.INFO++;
    }
  });

  // Comptage par jour (7 derniers jours)
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dayMap.set(dateStr, 0);
  }

  events.forEach(e => {
    if (e.ts) {
      const dateStr = new Date(e.ts).toISOString().split('T')[0];
      const count = dayMap.get(dateStr) || 0;
      dayMap.set(dateStr, count + 1);
    }
  });

  stats.byDay = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  return stats;
}
