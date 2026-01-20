/**
 * ICONTROL_GRACEFUL_DEGRADATION_V1
 * Mode dégradé gracieux et circuit breakers
 */

export type DegradationLevel = "normal" | "degraded" | "minimal" | "offline";

export interface DegradationConfig {
  level: DegradationLevel;
  features: {
    [feature: string]: boolean; // false = désactivé en mode dégradé
  };
}

class GracefulDegradationManager {
  private currentLevel: DegradationLevel = "normal";
  private configs: Map<DegradationLevel, DegradationConfig> = new Map();

  init() {
    // Configuration mode normal
    this.configs.set("normal", {
      level: "normal",
      features: {
        realTimeUpdates: true,
        advancedSearch: true,
        analytics: true,
        caching: true,
        backgroundSync: true
      }
    });

    // Configuration mode dégradé
    this.configs.set("degraded", {
      level: "degraded",
      features: {
        realTimeUpdates: false,
        advancedSearch: false,
        analytics: true,
        caching: true,
        backgroundSync: false
      }
    });

    // Configuration mode minimal
    this.configs.set("minimal", {
      level: "minimal",
      features: {
        realTimeUpdates: false,
        advancedSearch: false,
        analytics: false,
        caching: true,
        backgroundSync: false
      }
    });

    // Configuration mode offline
    this.configs.set("offline", {
      level: "offline",
      features: {
        realTimeUpdates: false,
        advancedSearch: false,
        analytics: false,
        caching: true,
        backgroundSync: false
      }
    });

    // Détecter mode offline
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.setLevel("normal");
      });

      window.addEventListener("offline", () => {
        this.setLevel("offline");
      });

      if (!navigator.onLine) {
        this.setLevel("offline");
      }
    }
  }

  setLevel(level: DegradationLevel) {
    this.currentLevel = level;
    const config = this.configs.get(level);
    
    if (config && typeof window !== "undefined") {
      // Émettre événement pour que les composants s'adaptent
      window.dispatchEvent(new CustomEvent("degradation-level-changed", {
        detail: { level, config }
      }));

      // Sauvegarder dans localStorage
      try {
        localStorage.setItem("icontrol_degradation_level", level);
      } catch (e) {
        // Ignore
      }
    }
  }

  getLevel(): DegradationLevel {
    return this.currentLevel;
  }

  isFeatureEnabled(feature: string): boolean {
    const config = this.configs.get(this.currentLevel);
    if (!config) return true; // Par défaut activé

    return config.features[feature] !== false;
  }

  getConfig(): DegradationConfig | undefined {
    return this.configs.get(this.currentLevel);
  }

  // Détecter problèmes et basculer automatiquement
  detectIssues() {
    // Détecter erreurs répétées (circuit breakers ouverts)
    // Détecter latence élevée
    // Détecter mémoire faible
    // etc.

    // Pour l'instant, simple détection basée sur online/offline
    // Peut être étendu avec monitoring des erreurs
  }
}

export const gracefulDegradation = new GracefulDegradationManager();
gracefulDegradation.init();
