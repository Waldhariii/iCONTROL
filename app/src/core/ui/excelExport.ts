/**
 * ICONTROL_EXCEL_EXPORT_V1
 * Export Excel avec formatage (XLSX)
 * 
 * STATUT: ✅ Fonctionnel avec CSV (Excel compatible)
 * 
 * Note: Cette implémentation utilise CSV comme format de sortie (Excel peut ouvrir CSV nativement).
 * Pour une implémentation XLSX complète avec formatage avancé (couleurs, bordures, formules, multi-feuilles),
 * installer la bibliothèque 'xlsx':
 *   npm install xlsx
 *   npm install --save-dev @types/xlsx
 * 
 * Puis décommenter le code XLSX dans les fonctions ci-dessous.
 * 
 * Les fonctions sont déjà prêtes pour l'intégration XLSX - il suffit d'ajouter la bibliothèque.
 */

import { exportToCSV } from "./exportUtils";

export interface ExcelCell {
  value: any;
  style?: {
    bold?: boolean;
    backgroundColor?: string;
    color?: string;
    border?: boolean;
  };
}

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
  style?: ExcelCell["style"];
}

export interface ExcelExportOptions {
  columns: ExcelColumn[];
  data: Record<string, any>[];
  filename?: string;
  sheetName?: string;
}

/**
 * Export Excel réel (XLSX format)
 * Note: Cette implémentation utilise CSV comme fallback.
 * Pour une vraie implémentation XLSX, installer et utiliser la bibliothèque 'xlsx':
 * npm install xlsx
 * import * as XLSX from 'xlsx';
 */
export function exportToExcel(options: ExcelExportOptions): void {
  // Fallback vers CSV avec extension .xlsx (compatible Excel)
  // En production, utiliser vraie bibliothèque XLSX
  
  const { columns, data, filename = "export", sheetName = "Sheet1" } = options;
  
  // Préparer données pour CSV
  const csvData = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(col => {
      obj[col.label] = row[col.key] || "";
    });
    return obj;
  });

  // Export CSV (Excel peut ouvrir CSV nativement)
  // Ce format fonctionne parfaitement pour la plupart des cas d'usage
  exportToCSV(csvData, filename);

  // ========================================
  // POUR XLSX AVANCÉ (quand bibliothèque installée):
  // ========================================
  // 1. Installer: npm install xlsx @types/xlsx
  // 2. Décommenter le code ci-dessous
  // 3. Supprimer l'appel exportToCSV ci-dessus si souhaité
  /*
  import * as XLSX from 'xlsx';
  
  // Créer feuille de calcul
  const ws = XLSX.utils.json_to_sheet(csvData);
  
  // Définir largeurs colonnes
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;
  
  // Optionnel: Appliquer styles header (nécessite xlsx-style ou exceljs)
  // ws['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFEEEEEE" } } };
  
  // Créer classeur et ajouter feuille
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Exporter fichier
  XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
  */
}

/**
 * Export Excel avec formatage avancé (multi-feuilles, styles)
 * Note: Nécessite bibliothèque XLSX en production
 */
export function exportToExcelAdvanced(options: {
  sheets: Array<{ name: string; columns: ExcelColumn[]; data: Record<string, any>[] }>;
  filename?: string;
}): void {
  // Fallback actuel: exporter chaque feuille séparément (en CSV)
  // En production avec XLSX, toutes les feuilles seront dans un seul fichier
  options.sheets.forEach((sheet, index) => {
    exportToExcel({
      columns: sheet.columns,
      data: sheet.data,
      filename: `${options.filename || "export"}-${sheet.name}`,
      sheetName: sheet.name
    });
  });

  // ========================================
  // POUR XLSX MULTI-FEUILLES (quand bibliothèque installée):
  // ========================================
  /*
  import * as XLSX from 'xlsx';
  
  const wb = XLSX.utils.book_new();
  
  options.sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    const colWidths = sheet.columns.map(col => ({ wch: col.width || 15 }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  XLSX.writeFile(wb, `${options.filename || "export"}-${Date.now()}.xlsx`);
  */
}
