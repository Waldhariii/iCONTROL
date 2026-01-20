/**
 * ICONTROL_BACKUP_MANAGER_V1
 * Gestionnaire de sauvegarde et restauration de configuration
 */

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    users?: any;
    settings?: any;
    modules?: any;
    permissions?: any;
    [key: string]: any;
  };
}

class BackupManager {
  private backups: BackupData[] = [];
  private maxBackups = 10;

  createBackup(name?: string): BackupData {
    const backup: BackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Sauvegarder données importantes
    try {
      const users = localStorage.getItem("icontrol_users");
      if (users) backup.data.users = JSON.parse(users);

      const settings = localStorage.getItem("icontrol_settings");
      if (settings) backup.data.settings = JSON.parse(settings);

      const modules = localStorage.getItem("icontrol_module_registry");
      if (modules) backup.data.modules = JSON.parse(modules);

      const permissions = localStorage.getItem("icontrol_user_permissions_v1");
      if (permissions) backup.data.permissions = JSON.parse(permissions);

      const sessions = localStorage.getItem("icontrol_sessions");
      if (sessions) backup.data.sessions = JSON.parse(sessions);

      const theme = localStorage.getItem("icontrol_theme");
      if (theme) backup.data.theme = theme;

      if (name) {
        (backup as any).name = name;
      }
    } catch (e) {
      console.warn("Failed to create backup", e);
    }

    this.backups.push(backup);
    if (this.backups.length > this.maxBackups) {
      this.backups.shift();
    }

    this.saveBackupsToStorage();
    return backup;
  }

  restoreBackup(backup: BackupData): boolean {
    try {
      Object.entries(backup.data).forEach(([key, value]) => {
        const storageKey = this.getStorageKey(key);
        if (storageKey && value) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      });
      return true;
    } catch (e) {
      console.error("Failed to restore backup", e);
      return false;
    }
  }

  exportBackup(backup: BackupData, filename?: string): void {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `icontrol-backup-${backup.timestamp.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          this.backups.push(backup);
          this.saveBackupsToStorage();
          resolve(backup);
        } catch (error) {
          reject(new Error("Invalid backup file format"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  listBackups(): BackupData[] {
    return [...this.backups].reverse();
  }

  deleteBackup(timestamp: string): boolean {
    const index = this.backups.findIndex(b => b.timestamp === timestamp);
    if (index !== -1) {
      this.backups.splice(index, 1);
      this.saveBackupsToStorage();
      return true;
    }
    return false;
  }

  private getStorageKey(key: string): string | null {
    const mapping: Record<string, string> = {
      users: "icontrol_users",
      settings: "icontrol_settings",
      modules: "icontrol_module_registry",
      permissions: "icontrol_user_permissions_v1",
      sessions: "icontrol_sessions",
      theme: "icontrol_theme"
    };
    return mapping[key] || null;
  }

  private saveBackupsToStorage() {
    try {
      localStorage.setItem("icontrol_backups", JSON.stringify(this.backups));
    } catch (e) {
      console.warn("Failed to save backups", e);
    }
  }

  loadBackupsFromStorage() {
    try {
      const stored = localStorage.getItem("icontrol_backups");
      if (stored) {
        this.backups = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load backups", e);
    }
  }
}

export const backupManager = new BackupManager();
backupManager.loadBackupsFromStorage();
