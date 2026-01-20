/**
 * ICONTROL_ERROR_TRACKER_V1
 * Error Tracking avancé (Sentry-like avec features complètes)
 */

import { ErrorInfo } from "./errorBoundary";

export interface ErrorContext {
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: "error" | "warning" | "info" | "debug";
  fingerprint?: string[];
  environment?: string;
  release?: string;
}

export interface ErrorEvent extends ErrorInfo {
  context?: ErrorContext;
  breadcrumbs?: Breadcrumb[];
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

export interface Breadcrumb {
  message: string;
  category: string;
  level: "error" | "warning" | "info" | "debug";
  timestamp: Date;
  data?: Record<string, any>;
}

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private errorEvents: ErrorEvent[] = [];
  private maxEvents = 100;
  private currentContext: ErrorContext = {
    environment: import.meta.env.MODE || "development",
    release: "0.2.0"
  };

  init(config?: Partial<ErrorContext>) {
    this.currentContext = { ...this.currentContext, ...config };

    // Capture globale des erreurs
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.captureException(event.error || new Error(event.message), {
          tags: { type: "unhandled-error" },
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.captureException(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          {
            tags: { type: "unhandled-promise-rejection" }
          }
        );
      });
    }

    // Enrichir breadcrumbs avec navigation
    if (typeof window !== "undefined") {
      let lastUrl = window.location.href;
      const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          this.addBreadcrumb({
            message: `Navigation to ${currentUrl}`,
            category: "navigation",
            level: "info"
          });
          lastUrl = currentUrl;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  setUser(user: ErrorContext["user"]) {
    this.currentContext.user = user;
  }

  setContext(context: Partial<ErrorContext>) {
    this.currentContext = { ...this.currentContext, ...context };
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, "timestamp">) {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date()
    };

    this.breadcrumbs.push(fullBreadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Sauvegarder dans localStorage pour persistance
    try {
      const recent = this.breadcrumbs.slice(-20);
      localStorage.setItem("icontrol_error_breadcrumbs", JSON.stringify(recent));
    } catch (e) {
      // Ignore
    }
  }

  captureException(error: Error, context?: Partial<ErrorContext>): ErrorEvent {
    const errorEvent: ErrorEvent = {
      message: error.message || String(error),
      stack: error.stack,
      component: context?.tags?.component || "Global",
      timestamp: new Date(),
      correlationId: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      context: {
        ...this.currentContext,
        ...context,
        tags: { ...this.currentContext.tags, ...context?.tags }
      },
      breadcrumbs: [...this.breadcrumbs]
    };

    // Enrichir avec request info si disponible
    if (typeof window !== "undefined") {
      errorEvent.request = {
        url: window.location.href,
        method: "GET",
        headers: {
          "User-Agent": navigator.userAgent,
          "Referer": document.referrer
        }
      };
    }

    this.errorEvents.push(errorEvent);
    if (this.errorEvents.length > this.maxEvents) {
      this.errorEvents.shift();
    }

    // Sauvegarder pour diagnostic
    this.saveErrorEvent(errorEvent);

    // Logger dans console en dev
    if (import.meta.env.DEV) {
      console.error("[ErrorTracker]", errorEvent);
    }

    // En production, envoyer à Sentry si configuré
    // Voir méthode sendToSentry ci-dessous pour activation
    if (import.meta.env?.PROD) {
      // this.sendToSentry(errorEvent);
    }

    return errorEvent;
  }

  captureMessage(message: string, context?: Partial<ErrorContext>) {
    return this.captureException(new Error(message), context);
  }

  getRecentErrors(limit: number = 10): ErrorEvent[] {
    return this.errorEvents.slice(-limit);
  }

  clearErrors() {
    this.errorEvents = [];
    this.breadcrumbs = [];
    try {
      localStorage.removeItem("icontrol_error_events");
      localStorage.removeItem("icontrol_error_breadcrumbs");
    } catch (e) {
      // Ignore
    }
  }

  private saveErrorEvent(event: ErrorEvent) {
    try {
      const recent = this.errorEvents.slice(-50);
      const serialized = recent.map(e => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
        breadcrumbs: e.breadcrumbs?.map(b => ({
          ...b,
          timestamp: b.timestamp.toISOString()
        }))
      }));
      localStorage.setItem("icontrol_error_events", JSON.stringify(serialized));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Intégration Sentry pour monitoring production
   * 
   * STATUT: ✅ Structure prête - Activez quand Sentry configuré
   * 
   * Pour activer Sentry:
   * 1. Installer: npm install @sentry/browser
   * 2. Configurer Sentry dans main.ts ou bootstrap:
   *    import * as Sentry from "@sentry/browser";
   *    Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
   * 3. Décommenter le code ci-dessous
   * 4. Décommenter l'appel dans captureException()
   */
  // private async sendToSentry(event: ErrorEvent) {
  //   if (!import.meta.env.PROD) return;
  //   
  //   try {
  //     // Envoyer exception à Sentry
  //     if (event.error) {
  //       Sentry.captureException(event.error, {
  //         tags: {
  //           level: event.level,
  //           code: event.code
  //         },
  //         extra: {
  //           context: event.context,
  //           breadcrumbs: event.breadcrumbs
  //         }
  //       });
  //     } else {
  //       // Message sans exception
  //       Sentry.captureMessage(event.message || "Error captured", {
  //         level: event.level === "error" ? "error" : "warning",
  //         tags: { code: event.code },
  //         extra: event.context
  //       });
  //     }
  //   } catch (e) {
  //     // Ignore si Sentry non disponible
  //     console.warn("[ErrorTracker] Sentry not available:", e);
  //   }
  // }
}

export const errorTracker = new ErrorTracker();
errorTracker.init();
