/**
 * ICONTROL_FEATURE_FLAGS_V1
 * Système de feature flags pour gradual rollout
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout?: {
    percentage: number; // 0-100
    users?: string[]; // User IDs whitelisted
    usersBlacklist?: string[]; // User IDs blacklisted
  };
  metadata?: {
    description?: string;
    created?: string;
    updated?: string;
  };
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  init(flags: FeatureFlag[] = []) {
    flags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
    this.loadFromStorage();
  }

  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      return false; // Par défaut, désactivé si non défini
    }

    if (!flag.enabled) {
      return false;
    }

    // Si pas de rollout, activé pour tous
    if (!flag.rollout) {
      return true;
    }

    // Vérifier blacklist
    if (flag.rollout.usersBlacklist?.includes(userId || "")) {
      return false;
    }

    // Vérifier whitelist
    if (flag.rollout.users?.includes(userId || "")) {
      return true;
    }

    // Rollout par pourcentage
    if (flag.rollout.percentage >= 100) {
      return true;
    }
    if (flag.rollout.percentage <= 0) {
      return false;
    }

    // Hash stable du userId pour pourcentage
    if (userId) {
      const hash = this.hashUserId(userId);
      return (hash % 100) < flag.rollout.percentage;
    }

    // Pas de userId, désactivé par défaut
    return false;
  }

  setFlag(flag: FeatureFlag) {
    this.flags.set(flag.key, flag);
    this.saveToStorage();
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  deleteFlag(key: string) {
    this.flags.delete(key);
    this.saveToStorage();
  }

  private hashUserId(userId: string): number {
    // Hash simple et stable pour userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private saveToStorage() {
    try {
      const flags = Array.from(this.flags.values());
      localStorage.setItem("icontrol_feature_flags", JSON.stringify(flags));
    } catch (e) {
      console.warn("Failed to save feature flags", e);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("icontrol_feature_flags");
      if (stored) {
        const flags: FeatureFlag[] = JSON.parse(stored);
        flags.forEach(flag => {
          this.flags.set(flag.key, flag);
        });
      }
    } catch (e) {
      console.warn("Failed to load feature flags", e);
    }
  }
}

export const featureFlags = new FeatureFlagManager();

// Flags par défaut
featureFlags.init([
  {
    key: "advanced_search",
    enabled: true,
    metadata: { description: "Recherche avancée avec filtres" }
  },
  {
    key: "real_time_notifications",
    enabled: true,
    metadata: { description: "Notifications en temps réel" }
  },
  {
    key: "dark_mode",
    enabled: true,
    metadata: { description: "Mode sombre" }
  }
]);
