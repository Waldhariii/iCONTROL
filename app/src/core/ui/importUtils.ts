/**
 * ICONTROL_IMPORT_UTILS_V1
 * Utilitaires pour importer des données depuis CSV
 */

export interface ImportOptions {
  onImport: (data: Record<string, any>[]) => void | Promise<void>;
  validateRow?: (row: Record<string, any>, index: number) => { valid: boolean; errors?: string[] };
  previewRows?: number;
}

export function showCSVImportDialog(options: ImportOptions): void {
  const modal = document.createElement("div");
  modal.style.minWidth = "0";
  modal.style.boxSizing = "border-box";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">
        Importer depuis CSV
      </div>
      
      <div style="margin-bottom:20px;">
        <label style="display:block;color:#858585;font-size:13px;margin-bottom:8px;font-weight:600;">
          Fichier CSV
        </label>
        <input 
          id="csvFileInput" 
          type="file" 
          accept=".csv"
          style="width:100%;padding:10px;border:1px solid #3e3e3e;border-radius:6px;background:#121212;color:#d4d4d4;font-size:13px;box-sizing:border-box;"
        />
      </div>
      
      <div id="previewContainer" style="display:none;margin-bottom:20px;">
        <div style="color:#858585;font-size:13px;margin-bottom:8px;font-weight:600;">
          Aperçu (premières lignes)
        </div>
        <div id="previewTable" style="border:1px solid #3e3e3e;border-radius:6px;overflow:hidden;"></div>
      </div>
      
      <div id="errorsContainer" style="display:none;margin-bottom:20px;padding:12px;background:rgba(244,135,113,0.15);border-left:4px solid #f48771;border-radius:6px;">
        <div style="color:#f48771;font-size:13px;font-weight:600;margin-bottom:8px;">Erreurs détectées</div>
        <div id="errorsList" style="color:#f48771;font-size:12px;"></div>
      </div>
      
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button id="cancelBtn" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">
          Annuler
        </button>
        <button id="importBtn" disabled style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;opacity:0.5;">
          Importer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const fileInput = modal.querySelector("#csvFileInput") as HTMLInputElement;
  const previewContainer = modal.querySelector("#previewContainer") as HTMLElement;
  const previewTable = modal.querySelector("#previewTable") as HTMLElement;
  const errorsContainer = modal.querySelector("#errorsContainer") as HTMLElement;
  const errorsList = modal.querySelector("#errorsList") as HTMLElement;
  const cancelBtn = modal.querySelector("#cancelBtn") as HTMLButtonElement;
  const importBtn = modal.querySelector("#importBtn") as HTMLButtonElement;

  let parsedData: Record<string, any>[] = [];
  let validData: Record<string, any>[] = [];

  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, any> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const renderPreview = (data: Record<string, any>[]) => {
    if (data.length === 0) {
      previewTable.innerHTML = '<div style="padding:20px;text-align:center;color:#858585;">Aucune donnée</div>';
      return;
    }

    const previewRows = Math.min(data.length, options.previewRows || 5);
    const headers = Object.keys(data[0]);

    let html = `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#252526;border-bottom:1px solid #3e3e3e;">
    `;
    headers.forEach(h => {
      html += `<th style="padding:8px;text-align:left;color:#a7b0b7;font-weight:600;">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    for (let i = 0; i < previewRows; i++) {
      html += `<tr style="border-bottom:1px solid #3e3e3e;">`;
      headers.forEach(h => {
        html += `<td style="padding:8px;color:#d4d4d4;">${data[i][h] || ""}</td>`;
      });
      html += `</tr>`;
    }

    html += `</tbody></table>`;
    previewTable.innerHTML = html;
    previewContainer.style.display = "block";
  };

  const validateData = (data: Record<string, any>[]): { valid: Record<string, any>[]; errors: string[] } => {
    const valid: Record<string, any>[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      if (options.validateRow) {
        const result = options.validateRow(row, index);
        if (result.valid) {
          valid.push(row);
        } else {
          errors.push(`Ligne ${index + 2}: ${result.errors?.join(", ") || "Validation échouée"}`);
        }
      } else {
        valid.push(row);
      }
    });

    return { valid, errors };
  };

  fileInput.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    parsedData = parseCSV(text);
    renderPreview(parsedData);

    const validation = validateData(parsedData);
    validData = validation.valid;

    if (validation.errors.length > 0) {
      errorsList.innerHTML = validation.errors.map(err => `<div>• ${err}</div>`).join("");
      errorsContainer.style.display = "block";
    } else {
      errorsContainer.style.display = "none";
    }

    importBtn.disabled = validData.length === 0;
    importBtn.style.opacity = validData.length === 0 ? "0.5" : "1";
  };

  importBtn.onclick = async () => {
    if (validData.length === 0) return;

    importBtn.disabled = true;
    importBtn.textContent = "Import en cours...";

    try {
      await options.onImport(validData);
      document.body.removeChild(modal);
    } catch (error) {
      alert(`Erreur lors de l'import: ${error}`);
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = "Importer";
    }
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}
