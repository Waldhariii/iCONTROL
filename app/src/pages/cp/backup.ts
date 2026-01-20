/**
 * ICONTROL_CP_BACKUP_V1
 * Page de sauvegarde et restauration
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { backupManager, type BackupData } from "/src/core/backup/backupManager";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showConfirmDialog } from "/src/core/ui/confirmDialog";
import { notificationManager } from "/src/core/ui/notificationCenter";
import { exportToJSON } from "/src/core/ui/exportUtils";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

export function renderBackupPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "Sauvegarde et Restauration",
    "Gérer les sauvegardes de configuration du système"
  );
  
  const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
  if (headerTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "💾";
    iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
    headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
  }
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();

  // Actions
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;";

  const createBackupBtn = document.createElement("button");
  createBackupBtn.textContent = "💾 Créer une sauvegarde";
  createBackupBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  createBackupBtn.onmouseenter = () => { createBackupBtn.style.background = "rgba(255,255,255,0.05)"; };
  createBackupBtn.onmouseleave = () => { createBackupBtn.style.background = "var(--ic-panel, #37373d)"; };
  createBackupBtn.onclick = () => {
    const name = prompt("Nom de la sauvegarde (optionnel):");
    const backup = backupManager.createBackup(name || undefined);
    notificationManager.add({
      type: "success",
      title: "Sauvegarde créée",
      message: `Sauvegarde créée avec succès le ${new Date(backup.timestamp).toLocaleString('fr-FR')}.`
    });
    location.reload();
  };
  actionsDiv.appendChild(createBackupBtn);

  const importBackupBtn = document.createElement("button");
  importBackupBtn.textContent = "📥 Importer une sauvegarde";
  importBackupBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  importBackupBtn.onmouseenter = () => { importBackupBtn.style.background = "rgba(255,255,255,0.05)"; };
  importBackupBtn.onmouseleave = () => { importBackupBtn.style.background = "var(--ic-panel, #37373d)"; };
  importBackupBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const backup = await backupManager.importBackup(file);
        notificationManager.add({
          type: "success",
          title: "Sauvegarde importée",
          message: "La sauvegarde a été importée avec succès. Vous pouvez maintenant la restaurer."
        });
        location.reload();
      } catch (error) {
        notificationManager.add({
          type: "error",
          title: "Erreur d'import",
          message: `Impossible d'importer la sauvegarde: ${error}`
        });
      }
    };
    input.click();
  };
  actionsDiv.appendChild(importBackupBtn);

  cardContent.appendChild(actionsDiv);

  // Liste des sauvegardes
  const backups = backupManager.listBackups();
  const backupsData = backups.map(backup => ({
    id: backup.timestamp,
    name: (backup as any).name || "Sauvegarde automatique",
    timestamp: backup.timestamp,
    date: new Date(backup.timestamp).toLocaleString('fr-FR'),
    version: backup.version,
    dataKeys: Object.keys(backup.data).join(", ")
  }));

  const columns: TableColumn<typeof backupsData[0]>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true
    },
    {
      key: "date",
      label: "Date",
      sortable: true
    },
    {
      key: "dataKeys",
      label: "Données sauvegardées",
      sortable: false
    }
  ];

  const tableContainer = document.createElement("div");
  const table = createDataTable({
    columns,
    data: backupsData,
    searchable: true,
    sortable: true,
    pagination: true,
    pageSize: 10,
    actions: (row) => {
      const actions = [];
      actions.push({
        label: "Restaurer",
        onClick: () => {
          const backup = backups.find(b => b.timestamp === row.id);
          if (backup) {
            showConfirmDialog({
              title: "Restaurer la sauvegarde",
              message: `Voulez-vous restaurer la sauvegarde du ${row.date} ? Cela remplacera toutes les données actuelles.`,
              confirmText: "Restaurer",
              confirmColor: "warning",
              onConfirm: () => {
                if (backupManager.restoreBackup(backup)) {
                  notificationManager.add({
                    type: "success",
                    title: "Sauvegarde restaurée",
                    message: "La sauvegarde a été restaurée avec succès. La page va se recharger."
                  });
                  setTimeout(() => location.reload(), 1000);
                } else {
                  notificationManager.add({
                    type: "error",
                    title: "Erreur de restauration",
                    message: "Impossible de restaurer la sauvegarde."
                  });
                }
              }
            });
          }
        },
        style: "primary" as const
      });
      actions.push({
        label: "Exporter",
        onClick: () => {
          const backup = backups.find(b => b.timestamp === row.id);
          if (backup) {
            backupManager.exportBackup(backup, `backup-${row.date.replace(/[^0-9]/g, "-")}.json`);
          }
        },
        style: "primary" as const
      });
      actions.push({
        label: "Supprimer",
        onClick: () => {
          showConfirmDialog({
            title: "Supprimer la sauvegarde",
            message: `Voulez-vous supprimer la sauvegarde du ${row.date} ?`,
            confirmText: "Supprimer",
            confirmColor: "danger",
            onConfirm: () => {
              if (backupManager.deleteBackup(row.id)) {
                notificationManager.add({
                  type: "success",
                  title: "Sauvegarde supprimée",
                  message: "La sauvegarde a été supprimée avec succès."
                });
                location.reload();
              }
            }
          });
        },
        style: "danger" as const
      });
      return actions;
    }
  });
  tableContainer.appendChild(table);
  cardContent.appendChild(tableContainer);

  if (backupsData.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.style.cssText = "padding: 40px; text-align: center; color: var(--ic-mutedText, #a7b0b7);";
    emptyDiv.textContent = "Aucune sauvegarde disponible. Créez-en une pour commencer.";
    cardContent.insertBefore(emptyDiv, tableContainer);
  }
}
