/**
 * ICONTROL_REPORT_GENERATOR_V1
 * Générateur de rapports prédéfinis avec export PDF/Excel
 */

import { exportToCSV, exportToJSON } from "../ui/exportUtils";
import { exportToExcel } from "../ui/excelExport";

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  dataSource: () => any[];
  columns: Array<{ key: string; label: string }>;
  format?: "csv" | "json" | "pdf" | "excel";
}

class ReportGenerator {
  private reports: Map<string, ReportDefinition> = new Map();

  registerReport(report: ReportDefinition) {
    this.reports.set(report.id, report);
  }

  generateReport(reportId: string, format: "csv" | "json" | "pdf" | "excel" = "csv"): void {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const data = report.dataSource();
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case "csv":
        const csvData = data.map(row => {
          const obj: Record<string, any> = {};
          report.columns.forEach(col => {
            obj[col.label] = row[col.key] || "";
          });
          return obj;
        });
        exportToCSV(csvData, `${report.id}-${timestamp}`);
        break;

      case "json":
        exportToJSON(data, `${report.id}-${timestamp}`);
        break;

      case "excel":
        // Export Excel réel (avec fallback CSV si bibliothèque non disponible)
        const excelData = data.map(row => {
          const obj: Record<string, any> = {};
          report.columns.forEach(col => {
            obj[col.label] = row[col.key] || "";
          });
          return obj;
        });
        exportToExcel({
          columns: report.columns.map(col => ({ key: col.key, label: col.label })),
          data: excelData,
          filename: `${report.id}-${timestamp}`,
          sheetName: report.title
        });
        break;

      case "pdf":
        // Pour PDF, générer HTML et utiliser print() ou une librairie
        this.generatePDFReport(report, data, timestamp);
        break;
    }
  }

  private generatePDFReport(report: ReportDefinition, data: any[], timestamp: string) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p>${report.description}</p>
  <p class="footer">Généré le ${timestamp}</p>
  <table>
    <thead>
      <tr>
        ${report.columns.map(col => `<th>${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${report.columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  listReports(): ReportDefinition[] {
    return Array.from(this.reports.values());
  }

  getReport(id: string): ReportDefinition | undefined {
    return this.reports.get(id);
  }
}

export const reportGenerator = new ReportGenerator();

// Enregistrer des rapports prédéfinis
import { readAuditLog } from "../audit/auditLog";
import { sessionManager } from "../session/sessionManager";

reportGenerator.registerReport({
  id: "audit-log",
  title: "Rapport d'audit",
  description: "Tous les événements d'audit du système",
  columns: [
    { key: "ts", label: "Date/Heure" },
    { key: "code", label: "Code" },
    { key: "level", label: "Niveau" },
    { key: "message", label: "Message" }
  ],
  dataSource: () => readAuditLog().map(e => ({
    ts: e.ts,
    code: e.code || "",
    level: e.level || "INFO",
    message: e.message || ""
  }))
});

reportGenerator.registerReport({
  id: "active-sessions",
  title: "Sessions actives",
  description: "Liste de toutes les sessions actives",
  columns: [
    { key: "username", label: "Utilisateur" },
    { key: "startTime", label: "Début" },
    { key: "lastActivity", label: "Dernière activité" },
    { key: "ipAddress", label: "IP" }
  ],
  dataSource: () => sessionManager.getAllSessions().map(s => ({
    username: s.username,
    startTime: s.startTime.toISOString(),
    lastActivity: s.lastActivity.toISOString(),
    ipAddress: s.ipAddress || "N/A"
  }))
});
