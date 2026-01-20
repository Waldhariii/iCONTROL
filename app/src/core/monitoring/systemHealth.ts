/**
 * ICONTROL_SYSTEM_HEALTH_V1
 * Monitoring de l'état du système en temps réel
 */

import { systemMetrics, type SystemMetrics } from "./systemMetrics";

export type SystemHealthStatus = "healthy" | "warning" | "error";

export interface SystemHealth {
  status: SystemHealthStatus;
  message: string;
  details: {
    memory: number; // Pourcentage
    cpu: number; // Pourcentage
    errors: number;
    responseTime: number; // ms
  };
}

class SystemHealthMonitor {
  private errorCount = 0;
  private listeners: ((health: SystemHealth) => void)[] = [];
  
  /**
   * Calcule l'état de santé du système basé sur les métriques
   */
  calculateHealth(metrics: SystemMetrics | null): SystemHealth {
    if (!metrics) {
      return {
        status: "warning",
        message: "Métriques non disponibles",
        details: {
          memory: 0,
          cpu: 0,
          errors: 0,
          responseTime: 0
        }
      };
    }

    const memPercent = metrics.performance.memory.percentage;
    const cpuPercent = metrics.performance.cpu.usage;
    const errors = metrics.requests.errors || this.errorCount;
    const responseTime = metrics.requests.averageResponseTime;

    // Critères d'évaluation
    const memCritical = memPercent > 90;
    const memWarning = memPercent > 75;
    const cpuCritical = cpuPercent > 90;
    const cpuWarning = cpuPercent > 80;
    const responseCritical = responseTime > 5000; // > 5 secondes
    const responseWarning = responseTime > 2000; // > 2 secondes
    const errorCritical = errors > 10;
    const errorWarning = errors > 5;

    // Déterminer le statut global
    let status: SystemHealthStatus = "healthy";
    let message = "Système opérationnel";

    if (memCritical || cpuCritical || responseCritical || errorCritical) {
      status = "error";
      const issues: string[] = [];
      if (memCritical) issues.push("Mémoire critique");
      if (cpuCritical) issues.push("CPU critique");
      if (responseCritical) issues.push("Temps de réponse élevé");
      if (errorCritical) issues.push("Erreurs critiques");
      message = `Problème détecté: ${issues.join(", ")}`;
    } else if (memWarning || cpuWarning || responseWarning || errorWarning) {
      status = "warning";
      const issues: string[] = [];
      if (memWarning) issues.push("Mémoire élevée");
      if (cpuWarning) issues.push("CPU élevé");
      if (responseWarning) issues.push("Temps de réponse élevé");
      if (errorWarning) issues.push("Erreurs détectées");
      message = `Attention: ${issues.join(", ")}`;
    }

    return {
      status,
      message,
      details: {
        memory: Math.round(memPercent),
        cpu: Math.round(cpuPercent),
        errors,
        responseTime: Math.round(responseTime)
      }
    };
  }

  /**
   * Obtient l'état actuel du système
   */
  getCurrentHealth(): SystemHealth {
    const metrics = systemMetrics.getLatestMetrics();
    return this.calculateHealth(metrics);
  }

  /**
   * Enregistre une erreur
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Réinitialise le compteur d'erreurs
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Abonne un listener aux changements d'état
   */
  subscribe(listener: (health: SystemHealth) => void): () => void {
    this.listeners.push(listener);
    // Appeler immédiatement avec l'état actuel
    listener(this.getCurrentHealth());
    // Retourner une fonction pour se désabonner
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Démarre le monitoring avec mise à jour automatique
   */
  startMonitoring(intervalMs: number = 5000): void {
    setInterval(() => {
      const health = this.getCurrentHealth();
      // Notifier tous les listeners
      this.listeners.forEach(listener => listener(health));
    }, intervalMs);
    // Mise à jour immédiate
    const health = this.getCurrentHealth();
    this.listeners.forEach(listener => listener(health));
  }
}

export const systemHealthMonitor = new SystemHealthMonitor();

// Démarrer le monitoring automatique
systemHealthMonitor.startMonitoring(5000);
