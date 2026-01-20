/**
 * ICONTROL_ONBOARDING_V1
 * Système d'onboarding et guided tours pour nouveaux utilisateurs
 */

import { addTooltipToElement } from "./tooltip";

export interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string; // Selector CSS
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: () => void;
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
}

class OnboardingManager {
  private tours: Map<string, OnboardingTour> = new Map();
  private currentTour: OnboardingTour | null = null;
  private currentStepIndex = 0;
  private overlay: HTMLElement | null = null;
  private spotlight: HTMLElement | null = null;

  registerTour(tour: OnboardingTour) {
    this.tours.set(tour.id, tour);
  }

  async startTour(tourId: string): Promise<void> {
    const tour = this.tours.get(tourId);
    if (!tour) {
      console.warn(`Tour ${tourId} not found`);
      return;
    }

    this.currentTour = tour;
    this.currentStepIndex = 0;
    await this.showStep(0);
  }

  private async showStep(index: number) {
    if (!this.currentTour || index >= this.currentTour.steps.length) {
      this.completeTour();
      return;
    }

    const step = this.currentTour.steps[index];
    this.currentStepIndex = index;

    // Créer overlay
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.id = "onboarding-overlay";
      this.overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.overlay);
    }

    // Créer spotlight
    const targetElement = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      if (!this.spotlight) {
        this.spotlight = document.createElement("div");
        this.spotlight.id = "onboarding-spotlight";
        this.overlay.appendChild(this.spotlight);
      }

      // Créer un "trou" dans l'overlay pour l'élément
      this.spotlight.style.cssText = `
        position: absolute;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #3b82f6;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.7);
        pointer-events: none;
        animation: pulse 2s infinite;
      `;

      // Ajouter animation CSS si pas déjà présente
      if (!document.getElementById("onboarding-styles")) {
        const style = document.createElement("style");
        style.id = "onboarding-styles";
        style.textContent = `
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 0 rgba(59,130,246,0.7); }
            50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 10px rgba(59,130,246,0.3); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      if (this.spotlight) {
        this.spotlight.remove();
        this.spotlight = null;
      }
    }

    // Créer tooltip/step indicator
    const existingTooltip = document.getElementById("onboarding-tooltip");
    if (existingTooltip) existingTooltip.remove();

    const tooltip = document.createElement("div");
    tooltip.id = "onboarding-tooltip";
    tooltip.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: var(--ic-card, #1e1e1e);
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    // Position
    if (targetElement && step.position !== "center") {
      const rect = targetElement.getBoundingClientRect();
      switch (step.position || "bottom") {
        case "top":
          tooltip.style.bottom = `${window.innerHeight - rect.top + 16}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = "translateX(-50%)";
          break;
        case "bottom":
          tooltip.style.top = `${rect.bottom + 16}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = "translateX(-50%)";
          break;
        case "left":
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.right = `${window.innerWidth - rect.left + 16}px`;
          tooltip.style.transform = "translateY(-50%)";
          break;
        case "right":
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.left = `${rect.right + 16}px`;
          tooltip.style.transform = "translateY(-50%)";
          break;
      }
    } else {
      // Centré si pas de target ou position center
      tooltip.style.top = "50%";
      tooltip.style.left = "50%";
      tooltip.style.transform = "translate(-50%, -50%)";
    }

    tooltip.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-size:18px;font-weight:700;color:var(--ic-text, #e7ecef);margin:0;">${step.title}</h3>
        <button id="skip-tour" style="background:transparent;border:none;color:#858585;font-size:20px;cursor:pointer;padding:0;">×</button>
      </div>
      <div style="color:var(--ic-mutedText, #a7b0b7);font-size:14px;line-height:1.6;margin-bottom:20px;">
        ${step.content}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="color:var(--ic-mutedText, #a7b0b7);font-size:12px;">
          Étape ${index + 1} / ${this.currentTour.steps.length}
        </div>
        <div style="display:flex;gap:8px;">
          ${index > 0 ? `<button id="prev-step" style="padding:8px 16px;background:transparent;color:var(--ic-text, #e7ecef);border:1px solid var(--ic-border, #2b3136);border-radius:6px;cursor:pointer;font-weight:600;">Précédent</button>` : ""}
          <button id="next-step" style="padding:8px 16px;background:var(--ic-panel, #37373d);color:white;border:1px solid var(--ic-border, #2b3136);border-radius:6px;cursor:pointer;font-weight:700;">
            ${index === this.currentTour.steps.length - 1 ? "Terminer" : "Suivant"}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Event listeners
    const nextBtn = tooltip.querySelector("#next-step");
    const prevBtn = tooltip.querySelector("#prev-step");
    const skipBtn = tooltip.querySelector("#skip-tour");

    nextBtn?.addEventListener("click", () => {
      if (step.action) step.action();
      this.showStep(index + 1);
    });

    prevBtn?.addEventListener("click", () => {
      this.showStep(index - 1);
    });

    skipBtn?.addEventListener("click", () => {
      this.completeTour();
    });
  }

  private completeTour() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.spotlight) {
      this.spotlight.remove();
      this.spotlight = null;
    }
    const tooltip = document.getElementById("onboarding-tooltip");
    if (tooltip) tooltip.remove();

    if (this.currentTour) {
      // Marquer le tour comme complété
      try {
        const completedTours = JSON.parse(localStorage.getItem("icontrol_completed_tours") || "[]");
        if (!completedTours.includes(this.currentTour.id)) {
          completedTours.push(this.currentTour.id);
          localStorage.setItem("icontrol_completed_tours", JSON.stringify(completedTours));
        }
      } catch (e) {
        // Ignore
      }
    }

    this.currentTour = null;
    this.currentStepIndex = 0;
  }

  isTourCompleted(tourId: string): boolean {
    try {
      const completedTours = JSON.parse(localStorage.getItem("icontrol_completed_tours") || "[]");
      return completedTours.includes(tourId);
    } catch (e) {
      return false;
    }
  }
}

export const onboardingManager = new OnboardingManager();

// Tour par défaut pour nouveaux utilisateurs
onboardingManager.registerTour({
  id: "welcome",
  name: "Bienvenue sur iCONTROL",
  description: "Découvrez les fonctionnalités principales",
  steps: [
    {
      id: "welcome-1",
      title: "Bienvenue ! 👋",
      content: "Bienvenue sur iCONTROL, votre application de contrôle et d'administration. Ce petit tour vous guidera à travers les fonctionnalités principales.",
      position: "center"
    },
    {
      id: "welcome-2",
      title: "Tableau de bord",
      content: "Le tableau de bord affiche vos métriques et informations clés. Vous pouvez voir les performances, logs, et activité réseau en temps réel.",
      target: "[data-tour='dashboard']",
      position: "bottom"
    },
    {
      id: "welcome-3",
      title: "Navigation",
      content: "Utilisez le menu latéral pour naviguer entre les différentes sections : Utilisateurs, Management, Système, et plus.",
      target: "[data-tour='sidebar']",
      position: "right"
    }
  ]
});
