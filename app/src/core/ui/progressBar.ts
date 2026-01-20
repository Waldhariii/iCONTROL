/**
 * ICONTROL_PROGRESS_BAR_V1
 * Barre de progression réutilisable
 */

export interface ProgressBarOptions {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  size?: "small" | "medium" | "large";
  animated?: boolean;
}

export function createProgressBar(options: ProgressBarOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = "width: 100%;";

  if (options.label) {
    const labelDiv = document.createElement("div");
    labelDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;
    const label = document.createElement("span");
    label.textContent = options.label;
    labelDiv.appendChild(label);

    if (options.showPercentage !== false) {
      const percentage = document.createElement("span");
      const percentageValue = Math.min(100, Math.max(0, (options.value / (options.max || 100)) * 100));
      percentage.textContent = `${Math.round(percentageValue)}%`;
      percentage.style.cssText = "font-weight: 600; color: var(--ic-mutedText, #a7b0b7);";
      labelDiv.appendChild(percentage);
    }

    container.appendChild(labelDiv);
  }

  const barContainer = document.createElement("div");
  const height = options.size === "small" ? "4px" : options.size === "large" ? "12px" : "8px";
  barContainer.style.cssText = `
    width: 100%;
    height: ${height};
    background: var(--ic-panel, #252526);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  `;

  const max = options.max || 100;
  const percentage = Math.min(100, Math.max(0, (options.value / max) * 100));

  const colors = {
    primary: { bg: "#3b82f6", gradient: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" },
    success: { bg: "#34d399", gradient: "linear-gradient(90deg, #34d399 0%, #10b981 100%)" },
    warning: { bg: "#fbbf24", gradient: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)" },
    danger: { bg: "#f87171", gradient: "linear-gradient(90deg, #f87171 0%, #ef4444 100%)" },
    info: { bg: "#60a5fa", gradient: "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)" }
  };

  const color = colors[options.color || "primary"];

  const bar = document.createElement("div");
  bar.style.cssText = `
    height: 100%;
    width: ${percentage}%;
    background: ${color.gradient};
    border-radius: 4px;
    transition: width 0.3s ease-out;
    ${options.animated ? "animation: pulse 2s ease-in-out infinite;" : ""}
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  `;

  if (options.animated) {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `;
    if (!document.getElementById("progress-bar-styles")) {
      style.id = "progress-bar-styles";
      document.head.appendChild(style);
    }
  }

  barContainer.appendChild(bar);
  container.appendChild(barContainer);

  // Méthode pour mettre à jour la valeur
  (container as any).updateValue = (newValue: number) => {
    const newPercentage = Math.min(100, Math.max(0, (newValue / max) * 100));
    bar.style.width = `${newPercentage}%`;
    if (options.showPercentage !== false && options.label) {
      const percentageEl = container.querySelector("span:last-child");
      if (percentageEl) {
        percentageEl.textContent = `${Math.round(newPercentage)}%`;
      }
    }
  };

  return container;
}
