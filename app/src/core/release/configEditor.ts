/**
 * ICONTROL_CONFIG_EDITOR_V1
 * Config Editor - Édition des configurations en DRAFT
 * 
 * Ce module permet :
 * - Charger la config DRAFT
 * - Sauvegarder les modifications en DRAFT
 * - Preview (copie DRAFT → PREVIEW)
 * - Publication atomique (snapshot DRAFT → PUBLISHED)
 */

import {
  type ConfigSnapshot,
  type ConfigVersion,
  loadDraftConfig,
  loadPreviewConfig,
  loadPublishedConfig,
  saveConfigVersion,
  createConfigSnapshot,
  loadConfigRegistry,
} from "./configRegistry";
import {
  updateDraftVersion,
  updatePublishedVersion,
  loadReleaseRegistry,
} from "./registry";

export class ConfigEditor {
  /**
   * Charge la configuration DRAFT
   */
  async loadDraft(): Promise<ConfigSnapshot | null> {
    return loadDraftConfig();
  }

  /**
   * Sauvegarde une configuration en DRAFT (invisible aux clients)
   */
  async saveDraft(config: Partial<ConfigSnapshot>): Promise<void> {
    const registry = loadReleaseRegistry();
    const version = registry.draft_config_version;
    const snapshot = createConfigSnapshot(config, version);

    const configVersion: ConfigVersion = {
      version,
      channel: "draft",
      createdAt: new Date().toISOString(),
      snapshot,
    };

    saveConfigVersion("draft", configVersion);
    console.log("Draft config saved:", version);
  }

  /**
   * Copie DRAFT → PREVIEW (pour validation QA)
   */
  async previewDraft(): Promise<void> {
    const draft = loadDraftConfig();
    if (!draft) {
      throw new Error("No draft config to preview");
    }

    const registry = loadReleaseRegistry();
    const version = registry.draft_config_version;

    const previewVersion: ConfigVersion = {
      version,
      channel: "preview",
      createdAt: new Date().toISOString(),
      snapshot: { ...draft }, // Copie du snapshot
    };

    saveConfigVersion("preview", previewVersion);
    console.log("Draft config copied to preview:", version);
  }

  /**
   * Publication atomique : snapshot DRAFT → PUBLISHED
   * 
   * Étapes :
   * 1) Snapshot DRAFT → PUBLISHED (immutable)
   * 2) Bump published_config_version
   * 3) Optionnel: bump latest_version
   * 4) Audit event (à implémenter)
   */
  async publishDraft(options?: {
    bumpLatestVersion?: boolean;
    setMinSupportedVersion?: string;
  }): Promise<void> {
    const draft = loadDraftConfig();
    if (!draft) {
      throw new Error("No draft config to publish");
    }

    const registry = loadReleaseRegistry();
    const draftVersion = registry.draft_config_version;

    // 1) Créer un snapshot immuable
    const publishedSnapshot = createConfigSnapshot(draft, draftVersion);

    // 2) Créer la version publiée
    const publishedVersion: ConfigVersion = {
      version: draftVersion,
      channel: "published",
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      snapshot: publishedSnapshot,
    };

    saveConfigVersion("published", publishedVersion);

    // 3) Mettre à jour le Release Registry
    const newLatestVersion = options?.bumpLatestVersion
      ? this.bumpVersion(registry.latest_version)
      : registry.latest_version;

    updatePublishedVersion(
      draftVersion,
      newLatestVersion,
      options?.setMinSupportedVersion
    );

    // 4) Audit event (à implémenter avec le système d'audit existant)
    console.log("Config published:", {
      configVersion: draftVersion,
      latestVersion: newLatestVersion,
      minSupportedVersion: options?.setMinSupportedVersion,
    });

    // Émettre un événement pour notifier les autres parties du système
    window.dispatchEvent(
      new CustomEvent("icontrol-config-published", {
        detail: {
          configVersion: draftVersion,
          latestVersion: newLatestVersion,
        },
      })
    );
  }

  /**
   * Bump version (simple increment patch)
   */
  private bumpVersion(version: string): string {
    const parts = version.split(".");
    if (parts.length >= 3) {
      const patch = parseInt(parts[2], 10) + 1;
      return `${parts[0]}.${parts[1]}.${patch}`;
    }
    return version;
  }

  /**
   * Charge la configuration actuelle (published pour clients, draft pour admin)
   */
  getCurrentConfig(isAdmin: boolean = false): ConfigSnapshot | null {
    if (isAdmin) {
      // Admin peut voir le draft
      return loadDraftConfig() || loadPublishedConfig();
    }
    // Client voit seulement published
    return loadPublishedConfig();
  }

  /**
   * Charge la configuration preview (pour validation QA)
   */
  getPreviewConfig(): ConfigSnapshot | null {
    return loadPreviewConfig();
  }
}

// Instance singleton
export const configEditor = new ConfigEditor();
