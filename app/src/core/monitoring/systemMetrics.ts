/**
 * ICONTROL_SYSTEM_METRICS_V1
 * Collecte de métriques système en temps réel
 */

export interface SystemMetrics {
  timestamp: Date;
  performance: {
    memory: {
      used: number; // MB
      total: number; // MB
      percentage: number;
    };
    cpu: {
      usage: number; // Pourcentage (0-100)
    };
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number; // ms
  };
  storage: {
    used: number; // MB
    quota: number; // MB
    percentage: number;
  };
}

class SystemMetricsCollector {
  private metrics: SystemMetrics[] = [];
  private maxMetrics = 100;
  private requestTimes: number[] = [];

  collectMetrics(): SystemMetrics {
    // Performance Memory (Performance API)
    const memory = (performance as any).memory;
    const memUsed = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;
    const memTotal = memory ? memory.totalJSHeapSize / (1024 * 1024) : 0;
    const memPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;

    // Storage estimation (localStorage)
    let storageUsed = 0;
    let storageQuota = 5 * 1024 * 1024; // 5MB par défaut
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          storageUsed += localStorage[key].length + key.length;
        }
      }
      storageUsed = storageUsed / (1024 * 1024); // MB
    } catch (e) {
      // Ignore
    }

    // Request metrics (depuis fetch intercept)
    const avgResponseTime = this.requestTimes.length > 0
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
      : 0;

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      performance: {
        memory: {
          used: Math.round(memUsed * 100) / 100,
          total: Math.round(memTotal * 100) / 100,
          percentage: Math.round(memPercentage * 100) / 100
        },
        cpu: {
          usage: this.estimateCPUUsage()
        }
      },
      requests: {
        total: this.requestTimes.length,
        errors: 0, // À implémenter avec un compteur d'erreurs
        averageResponseTime: Math.round(avgResponseTime)
      },
      storage: {
        used: Math.round(storageUsed * 100) / 100,
        quota: storageQuota / (1024 * 1024),
        percentage: storageQuota > 0 ? Math.round((storageUsed / (storageQuota / (1024 * 1024))) * 100) : 0
      }
    };

    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return metrics;
  }

  private estimateCPUUsage(): number {
    // Estimation basique basée sur les métriques de performance
    // En production, utiliser Performance Observer ou Web Workers
    return Math.random() * 30 + 10; // Simulation 10-40%
  }

  recordRequestTime(ms: number) {
    this.requestTimes.push(ms);
    if (this.requestTimes.length > 50) {
      this.requestTimes.shift();
    }
  }

  getMetrics(limit: number = 10): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  startCollection(intervalMs: number = 5000) {
    setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    // Collecter immédiatement
    this.collectMetrics();
  }
}

export const systemMetrics = new SystemMetricsCollector();

// Démarrer la collecte automatique
systemMetrics.startCollection(5000);
