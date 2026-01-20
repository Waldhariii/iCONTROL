/**
 * ICONTROL_PERFORMANCE_BUDGET_V1
 * Performance budgets et monitoring automatique
 */

export interface PerformanceBudget {
  name: string;
  metric: "bundle-size" | "load-time" | "ttfb" | "lcp" | "fid" | "cls";
  threshold: number;
  unit: "kb" | "ms" | "s" | "score";
  severity: "error" | "warning";
}

export interface PerformanceMetrics {
  bundleSize?: number; // KB
  loadTime?: number; // ms
  ttfb?: number; // ms (Time to First Byte)
  lcp?: number; // ms (Largest Contentful Paint)
  fid?: number; // ms (First Input Delay)
  cls?: number; // score (Cumulative Layout Shift)
}

const DEFAULT_BUDGETS: PerformanceBudget[] = [
  { name: "Bundle JS Gzipped", metric: "bundle-size", threshold: 200, unit: "kb", severity: "error" },
  { name: "Time to First Byte", metric: "ttfb", threshold: 600, unit: "ms", severity: "warning" },
  { name: "Load Time", metric: "load-time", threshold: 2000, unit: "ms", severity: "warning" },
  { name: "LCP", metric: "lcp", threshold: 2500, unit: "ms", severity: "warning" },
  { name: "FID", metric: "fid", threshold: 100, unit: "ms", severity: "warning" },
  { name: "CLS", metric: "cls", threshold: 0.1, unit: "score", severity: "warning" }
];

class PerformanceBudgetManager {
  private budgets: PerformanceBudget[] = DEFAULT_BUDGETS;
  private metrics: PerformanceMetrics = {};

  setBudget(budget: PerformanceBudget) {
    const index = this.budgets.findIndex(b => b.name === budget.name);
    if (index !== -1) {
      this.budgets[index] = budget;
    } else {
      this.budgets.push(budget);
    }
  }

  collectMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {};

    // Bundle size (depuis build stats)
    if (typeof window !== "undefined" && (window as any).__BUILD_STATS__) {
      const stats = (window as any).__BUILD_STATS__;
      if (stats.totalSize) {
        metrics.bundleSize = stats.totalSize / 1024; // Convert bytes to KB
      }
    }

    // Navigation Timing API
    if (typeof window !== "undefined" && window.performance) {
      const perf = window.performance;
      const navTiming = perf.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      
      if (navTiming) {
        metrics.loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
        metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
      }
    }

    // Core Web Vitals (si disponibles)
    if (typeof window !== "undefined") {
      // LCP, FID, CLS nécessitent Web Vitals library ou implementation custom
      // Pour l'instant, on les marque comme optionnels
    }

    this.metrics = metrics;
    return metrics;
  }

  checkBudgets(metrics?: PerformanceMetrics): Array<{ budget: PerformanceBudget; actual: number; exceeded: boolean }> {
    const m = metrics || this.metrics;
    const results: Array<{ budget: PerformanceBudget; actual: number; exceeded: boolean }> = [];

    this.budgets.forEach(budget => {
      let actual: number | undefined;

      switch (budget.metric) {
        case "bundle-size":
          actual = m.bundleSize;
          break;
        case "load-time":
          actual = m.loadTime;
          break;
        case "ttfb":
          actual = m.ttfb;
          break;
        case "lcp":
          actual = m.lcp;
          break;
        case "fid":
          actual = m.fid;
          break;
        case "cls":
          actual = m.cls;
          break;
      }

      if (actual !== undefined) {
        const exceeded = actual > budget.threshold;
        results.push({ budget, actual, exceeded });
      }
    });

    return results;
  }

  reportViolations(): void {
    const metrics = this.collectMetrics();
    const violations = this.checkBudgets(metrics).filter(r => r.exceeded);

    if (violations.length > 0) {
      const errorViolations = violations.filter(v => v.budget.severity === "error");
      const warningViolations = violations.filter(v => v.budget.severity === "warning");

      if (errorViolations.length > 0) {
        console.error("[Performance Budget] ❌ Violations critiques:", errorViolations);
      }

      if (warningViolations.length > 0) {
        console.warn("[Performance Budget] ⚠️ Violations warnings:", warningViolations);
      }

      // Émettre événement pour tracking
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("performance-budget-violation", {
          detail: { violations, metrics }
        }));
      }
    }
  }
}

export const performanceBudgetManager = new PerformanceBudgetManager();

// Auto-check au chargement
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      performanceBudgetManager.reportViolations();
    }, 2000); // Attendre 2s après load pour métriques stables
  });
}
