import { navigate } from "/src/runtime/navigate";
/**
 * ICONTROL_ERROR_BOUNDARY_V1
 * Gestion robuste des erreurs avec fallback UI
 */

export interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: Date;
  userActions?: string[];
  correlationId?: string;
}

class ErrorBoundaryManager {
  private errors: ErrorInfo[] = [];
  private listeners: Array<(error: ErrorInfo) => void> = [];

  captureError(error: Error, component?: string, context?: Record<string, any>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: error.message || String(error),
      stack: error.stack,
      component: component || "Unknown",
      timestamp: new Date(),
      correlationId: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userActions: context?.userActions || []
    };

    this.errors.push(errorInfo);
    
    // Limiter à 50 erreurs
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Notifier les listeners
    this.listeners.forEach(listener => listener(errorInfo));

    // Logger dans console en dev
    if (typeof console !== "undefined" && console.error) {
      console.error(`[ErrorBoundary] ${errorInfo.component}:`, error);
    }

    // Sauvegarder dans localStorage pour diagnostic
    try {
      const recentErrors = this.errors.slice(-10);
      localStorage.setItem("icontrol_recent_errors", JSON.stringify(recentErrors));
    } catch (e) {
      // Ignore storage errors
    }

    return errorInfo;
  }

  subscribe(listener: (error: ErrorInfo) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem("icontrol_recent_errors");
    } catch (e) {
      // Ignore
    }
  }
}

export const errorBoundary = new ErrorBoundaryManager();

// Capture globale des erreurs non gérées
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    errorBoundary.captureError(
      event.error || new Error(event.message),
      "Global",
      { userActions: ["Unhandled error"] }
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    errorBoundary.captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      "Promise Rejection",
      { userActions: ["Unhandled promise rejection"] }
    );
  });
}

export function createErrorFallbackUI(error: ErrorInfo, onRetry?: () => void): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    padding: 40px;
    max-width: 800px;
    margin: 40px auto;
    background: var(--ic-card, #1e1e1e);
    border: 1px solid var(--ic-border, #2b3136);
    border-left: 4px solid #f48771;
    border-radius: 8px;
  `;

  const title = document.createElement("h2");
  title.style.cssText = "color: #f48771; font-size: 20px; font-weight: 700; margin-bottom: 16px;";
  title.textContent = "⚠️ Une erreur est survenue";
  container.appendChild(title);

  const message = document.createElement("p");
  message.style.cssText = "color: var(--ic-text, #e7ecef); font-size: 14px; margin-bottom: 24px; line-height: 1.6;";
  message.textContent = error.message || "Une erreur inattendue s'est produite.";
  container.appendChild(message);

  // Solutions suggérées
  const solutions = document.createElement("div");
  solutions.style.cssText = "margin-bottom: 24px; padding: 16px; background: rgba(244,135,113,0.1); border-radius: 6px;";
  
  const solutionsTitle = document.createElement("div");
  solutionsTitle.style.cssText = "color: #f48771; font-weight: 600; margin-bottom: 8px;";
  solutionsTitle.textContent = "Que pouvez-vous faire ?";
  solutions.appendChild(solutionsTitle);

  const solutionsList = document.createElement("ul");
  solutionsList.style.cssText = "color: var(--ic-text, #e7ecef); font-size: 13px; margin: 8px 0 0 20px; line-height: 1.8;";
  
  const suggestedSolutions = [
    "Rafraîchir la page pour réessayer",
    "Vérifier votre connexion internet",
    "Vider le cache du navigateur si le problème persiste",
    "Contacter le support si l'erreur se reproduit"
  ];

  suggestedSolutions.forEach(sol => {
    const li = document.createElement("li");
    li.textContent = sol;
    solutionsList.appendChild(li);
  });
  
  solutions.appendChild(solutionsList);
  container.appendChild(solutions);

  // Actions
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 12px; flex-wrap: wrap;";

  if (onRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "🔄 Réessayer";
    retryBtn.style.cssText = `
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
    retryBtn.onmouseenter = () => { retryBtn.style.background = "rgba(255,255,255,0.05)"; };
    retryBtn.onmouseleave = () => { retryBtn.style.background = "var(--ic-panel, #37373d)"; };
    retryBtn.onclick = onRetry;
    actions.appendChild(retryBtn);
  }

  const reloadBtn = document.createElement("button");
  reloadBtn.textContent = "🔄 Recharger la page";
  reloadBtn.style.cssText = `
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
  reloadBtn.onmouseenter = () => { reloadBtn.style.background = "rgba(255,255,255,0.05)"; };
  reloadBtn.onmouseleave = () => { reloadBtn.style.background = "var(--ic-panel, #37373d)"; };
  reloadBtn.onclick = () => location.reload();
  actions.appendChild(reloadBtn);

  const homeBtn = document.createElement("button");
  homeBtn.textContent = "🏠 Retour à l'accueil";
  homeBtn.style.cssText = `
    padding: 10px 20px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  homeBtn.onmouseenter = () => { homeBtn.style.background = "rgba(255,255,255,0.05)"; };
  homeBtn.onmouseleave = () => { homeBtn.style.background = "transparent"; };
  homeBtn.onclick = () => { navigate("#/dashboard"); };
  actions.appendChild(homeBtn);

  container.appendChild(actions);

  // Détails techniques (dépliables)
  if (error.stack || error.component) {
    const detailsBtn = document.createElement("button");
    detailsBtn.textContent = "🔍 Détails techniques";
    detailsBtn.style.cssText = `
      margin-top: 16px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--ic-mutedText, #a7b0b7);
      cursor: pointer;
      font-size: 12px;
      text-decoration: underline;
    `;
    
    const detailsDiv = document.createElement("div");
    detailsDiv.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
      display: none;
    `;
    
    if (error.component) {
      const compDiv = document.createElement("div");
      compDiv.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px; margin-bottom: 8px;";
      compDiv.textContent = `Composant: ${error.component}`;
      detailsDiv.appendChild(compDiv);
    }

    if (error.correlationId) {
      const idDiv = document.createElement("div");
      idDiv.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px; margin-bottom: 8px;";
      idDiv.textContent = `ID: ${error.correlationId}`;
      detailsDiv.appendChild(idDiv);
    }

    if (error.stack) {
      const stackPre = document.createElement("pre");
      stackPre.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 11px; overflow-x: auto; white-space: pre-wrap;";
      stackPre.textContent = error.stack;
      detailsDiv.appendChild(stackPre);
    }

    detailsBtn.onclick = () => {
      const isVisible = detailsDiv.style.display !== "none";
      detailsDiv.style.display = isVisible ? "none" : "block";
      detailsBtn.textContent = isVisible ? "🔍 Détails techniques" : "🔍 Masquer détails";
    };

    container.appendChild(detailsBtn);
    container.appendChild(detailsDiv);
  }

  return container;
}

export function safeRenderWithErrorBoundary(
  root: HTMLElement,
  renderFn: () => void,
  componentName: string = "Component"
): void {
  try {
    renderFn();
  } catch (error) {
    const errorInfo = errorBoundary.captureError(
      error instanceof Error ? error : new Error(String(error)),
      componentName
    );
    root.innerHTML = "";
    root.appendChild(createErrorFallbackUI(errorInfo, () => {
      safeRenderWithErrorBoundary(root, renderFn, componentName);
    }));
  }
}
