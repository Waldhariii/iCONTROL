/**
 * ICONTROL_CHARTS_V1
 * Composants de graphiques visuels réutilisables pour affichage de données
 */

export interface ChartData {
  labels?: string[];
  values: number[];
  color?: string;
}

export interface LineChartOptions {
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
}

/**
 * Crée un graphique en ligne (line chart)
 */
export function createLineChart(data: ChartData, options: LineChartOptions = {}): HTMLElement {
  const {
    width = 300,
    height = 150,
    color = "#4ec9b0",
    showGrid = true,
    showLabels = true
  } = options;

  const container = document.createElement("div");
  container.style.cssText = `
    padding: 12px;
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  `;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.cssText = "display: block;";

  if (data.values.length > 0) {
    const padding = { top: 20, right: 10, bottom: showLabels ? 25 : 10, left: showLabels ? 40 : 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Grille
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i * chartHeight / 4);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(padding.left));
        line.setAttribute("y1", String(y));
        line.setAttribute("x2", String(width - padding.right));
        line.setAttribute("y2", String(y));
        line.setAttribute("stroke", "rgba(255,255,255,0.05)");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);
      }
    }

    // Calcul des points
    const minVal = Math.min(...data.values);
    const maxVal = Math.max(...data.values);
    const range = maxVal - minVal || 1;
    const stepX = chartWidth / Math.max(1, data.values.length - 1);

    const points: string[] = [];
    data.values.forEach((val, index) => {
      const x = padding.left + (index * stepX);
      const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
      points.push(`${x},${y}`);
    });

    // Ligne
    if (points.length > 1) {
      const path = `M ${points.join(" L ")}`;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", path);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      svg.appendChild(line);

      // Points
      points.forEach((point, index) => {
        const [x, y] = point.split(",").map(Number);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", "3");
        circle.setAttribute("fill", color);
        svg.appendChild(circle);
      });
    }

    // Labels
    if (showLabels && data.labels) {
      data.labels.forEach((label, index) => {
        if (index < data.values.length) {
          const x = padding.left + (index * stepX);
          const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          labelText.setAttribute("x", String(x));
          labelText.setAttribute("y", String(height - 5));
          labelText.setAttribute("fill", "var(--ic-mutedText, #a7b0b7)");
          labelText.setAttribute("font-size", "10");
          labelText.setAttribute("text-anchor", "middle");
          labelText.textContent = label;
          svg.appendChild(labelText);
        }
      });
    }
  }

  container.appendChild(svg);
  return container;
}

/**
 * Crée un graphique en barres (bar chart)
 */
export function createBarChart(data: ChartData, options: LineChartOptions = {}): HTMLElement {
  const {
    width = 300,
    height = 150,
    color = "#3b82f6",
    showGrid = true,
    showLabels = true
  } = options;

  const container = document.createElement("div");
  container.style.cssText = `
    padding: 12px;
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  `;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.cssText = "display: block;";

  if (data.values.length > 0) {
    const padding = { top: 10, right: 10, bottom: showLabels ? 25 : 10, left: showLabels ? 40 : 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Grille
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i * chartHeight / 4);
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", String(padding.left));
        gridLine.setAttribute("y1", String(y));
        gridLine.setAttribute("x2", String(width - padding.right));
        gridLine.setAttribute("y2", String(y));
        gridLine.setAttribute("stroke", "rgba(255,255,255,0.05)");
        gridLine.setAttribute("stroke-width", "1");
        svg.appendChild(gridLine);
      }
    }

    // Calcul des barres
    const minVal = 0;
    const maxVal = Math.max(...data.values);
    const range = maxVal - minVal || 1;
    const barWidth = (chartWidth / data.values.length) * 0.6;
    const barSpacing = (chartWidth / data.values.length) * 0.4;

    data.values.forEach((val, index) => {
      const x = padding.left + (index * (barWidth + barSpacing)) + (barSpacing / 2);
      const barHeight = (val / range) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(barHeight));
      rect.setAttribute("fill", color);
      rect.setAttribute("rx", "2");
      svg.appendChild(rect);

      // Labels
      if (showLabels && data.labels && data.labels[index]) {
        const labelX = x + barWidth / 2;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(labelX));
        text.setAttribute("y", String(height - 5));
        text.setAttribute("fill", "var(--ic-mutedText, #a7b0b7)");
        text.setAttribute("font-size", "9");
        text.setAttribute("text-anchor", "middle");
        text.textContent = data.labels[index];
        svg.appendChild(text);
      }
    });
  }

  container.appendChild(svg);
  return container;
}

/**
 * Crée un mini graphique sparkline (petit graphique pour KPIs)
 */
export function createSparkline(data: number[], color: string = "#4ec9b0"): HTMLElement {
  const width = 80;
  const height = 30;

  const container = document.createElement("div");
  container.style.cssText = "display: inline-block; vertical-align: middle;";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.cssText = "display: block;";

  if (data.length > 1) {
    const padding = 2;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;
    const stepX = chartWidth / Math.max(1, data.length - 1);

    const points: string[] = [];
    data.forEach((val, index) => {
      const x = padding + (index * stepX);
      const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
      points.push(`${x},${y}`);
    });

    const path = `M ${points.join(" L ")}`;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", path);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
  }

  container.appendChild(svg);
  return container;
}

/**
 * Crée un indicateur de progression circulaire (pour pourcentages)
 */
export function createCircularProgress(percentage: number, color: string = "#4ec9b0", size: number = 60): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: ${size}px;
    height: ${size}px;
  `;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Cercle de fond
  const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bgCircle.setAttribute("cx", String(size / 2));
  bgCircle.setAttribute("cy", String(size / 2));
  bgCircle.setAttribute("r", String(radius));
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "rgba(255,255,255,0.1)");
  bgCircle.setAttribute("stroke-width", "4");
  svg.appendChild(bgCircle);

  // Cercle de progression
  const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  progressCircle.setAttribute("cx", String(size / 2));
  progressCircle.setAttribute("cy", String(size / 2));
  progressCircle.setAttribute("r", String(radius));
  progressCircle.setAttribute("fill", "none");
  progressCircle.setAttribute("stroke", color);
  progressCircle.setAttribute("stroke-width", "4");
  progressCircle.setAttribute("stroke-dasharray", String(circumference));
  progressCircle.setAttribute("stroke-dashoffset", String(offset));
  progressCircle.setAttribute("stroke-linecap", "round");
  progressCircle.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
  svg.appendChild(progressCircle);

  // Texte au centre
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", String(size / 2));
  text.setAttribute("y", String(size / 2 + 5));
  text.setAttribute("fill", color);
  text.setAttribute("font-size", "12");
  text.setAttribute("font-weight", "600");
  text.setAttribute("text-anchor", "middle");
  text.textContent = `${Math.round(percentage)}%`;
  svg.appendChild(text);

  container.appendChild(svg);
  return container;
}
