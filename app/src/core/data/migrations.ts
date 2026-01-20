/**
 * ICONTROL_DATA_MIGRATIONS_V1
 * Système de migrations de données versionnées et réversibles
 */

export interface Migration {
  version: string;
  description: string;
  up: () => Promise<void> | void;
  down: () => Promise<void> | void;
}

class MigrationManager {
  private migrations: Migration[] = [];
  private currentVersion: string = "0.0.0";
  private storageKey = "icontrol_data_version";

  registerMigration(migration: Migration) {
    this.migrations.push(migration);
    // Trier par version
    this.migrations.sort((a, b) => {
      return this.compareVersions(a.version, b.version);
    });
  }

  async migrateTo(targetVersion?: string): Promise<void> {
    const target = targetVersion || this.getLatestVersion();
    const current = this.getCurrentVersion();

    if (current === target) {
      return; // Déjà à jour
    }

    const shouldUpgrade = this.compareVersions(current, target) < 0;

    if (shouldUpgrade) {
      await this.upgrade(current, target);
    } else {
      await this.downgrade(current, target);
    }

    this.setCurrentVersion(target);
  }

  private async upgrade(from: string, to: string) {
    const migrationsToRun = this.migrations.filter(m => 
      this.compareVersions(m.version, from) > 0 &&
      this.compareVersions(m.version, to) <= 0
    );

    for (const migration of migrationsToRun) {
      try {
        await migration.up();
        console.log(`✅ Migration ${migration.version}: ${migration.description}`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  private async downgrade(from: string, to: string) {
    const migrationsToRun = this.migrations
      .filter(m => 
        this.compareVersions(m.version, to) > 0 &&
        this.compareVersions(m.version, from) <= 0
      )
      .reverse(); // Exécuter en ordre inverse

    for (const migration of migrationsToRun) {
      try {
        await migration.down();
        console.log(`✅ Rollback ${migration.version}: ${migration.description}`);
      } catch (error) {
        console.error(`❌ Rollback ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  private getCurrentVersion(): string {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored || "0.0.0";
    } catch (e) {
      return "0.0.0";
    }
  }

  private setCurrentVersion(version: string) {
    try {
      localStorage.setItem(this.storageKey, version);
      this.currentVersion = version;
    } catch (e) {
      console.warn("Failed to save migration version", e);
    }
  }

  private getLatestVersion(): string {
    if (this.migrations.length === 0) return "0.0.0";
    return this.migrations[this.migrations.length - 1].version;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }

    return 0;
  }

  getMigrations(): Migration[] {
    return [...this.migrations];
  }

  getCurrentVersionInfo(): string {
    return this.getCurrentVersion();
  }
}

export const migrationManager = new MigrationManager();

// Migration initiale (exemple)
migrationManager.registerMigration({
  version: "1.0.0",
  description: "Initial migration - Setup base structure",
  up: async () => {
    // Migration logic
  },
  down: async () => {
    // Rollback logic
  }
});
