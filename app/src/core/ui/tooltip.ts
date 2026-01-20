/**
 * ICONTROL_TOOLTIP_V1
 * Système de tooltips réutilisable avec accessibilité
 */

export interface TooltipOptions {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  maxWidth?: string;
  arrow?: boolean;
}

export function createTooltip(element: HTMLElement, options: TooltipOptions): () => void {
  const {
    content,
    position = "top",
    delay = 200,
    maxWidth = "300px",
    arrow = true
  } = options;

  let tooltip: HTMLElement | null = null;
  let timeoutId: number | null = null;
  let isVisible = false;

  const showTooltip = () => {
    if (isVisible || !content) return;
    
    timeoutId = window.setTimeout(() => {
      tooltip = document.createElement("div");
      tooltip.setAttribute("role", "tooltip");
      tooltip.setAttribute("aria-hidden", "false");
      tooltip.style.cssText = `
        position: absolute;
        z-index: 10000;
        padding: 8px 12px;
        background: var(--ic-panel, #1a1d1f);
        color: var(--ic-text, #e7ecef);
        border: 1px solid var(--ic-border, #2b3136);
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.4;
        max-width: ${maxWidth};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        pointer-events: none;
        white-space: normal;
        word-wrap: break-word;
      `;
      tooltip.textContent = content;

      // Position
      const rect = element.getBoundingClientRect();
      const tooltipRect = { width: 200, height: 40 }; // Estimation

      switch (position) {
        case "top":
          tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = "translateX(-50%)";
          break;
        case "bottom":
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = "translateX(-50%)";
          break;
        case "left":
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.right = `${window.innerWidth - rect.left + 8}px`;
          tooltip.style.transform = "translateY(-50%)";
          break;
        case "right":
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.left = `${rect.right + 8}px`;
          tooltip.style.transform = "translateY(-50%)";
          break;
      }

      document.body.appendChild(tooltip);
      isVisible = true;
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (tooltip) {
      tooltip.setAttribute("aria-hidden", "true");
      tooltip.remove();
      tooltip = null;
      isVisible = false;
    }
  };

  // Événements
  element.setAttribute("aria-label", content);
  element.setAttribute("tabindex", "0");

  element.addEventListener("mouseenter", showTooltip);
  element.addEventListener("mouseleave", hideTooltip);
  element.addEventListener("focus", showTooltip);
  element.addEventListener("blur", hideTooltip);

  // Retourner fonction de nettoyage
  return () => {
    hideTooltip();
    element.removeEventListener("mouseenter", showTooltip);
    element.removeEventListener("mouseleave", hideTooltip);
    element.removeEventListener("focus", showTooltip);
    element.removeEventListener("blur", hideTooltip);
  };
}

export function addTooltipToElement(
  element: HTMLElement,
  content: string,
  position?: "top" | "bottom" | "left" | "right"
): () => void {
  return createTooltip(element, { content, position });
}
