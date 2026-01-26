/**
 * Galerie de tous les types de graphiques — visuel Enterprise (line, bar, stackedBar, area, donut, gauge).
 * Données de démo pour prévisualisation.
 */
import { createChartCard } from "/src/core/ui/charts";

const DEMO_LINE = [22, 45, 38, 62, 55, 78, 70, 85, 92, 88, 95, 82, 90, 75];
const DEMO_BAR = [12, 19, 8, 22, 15, 28, 18, 24, 31, 20];
const DEMO_STACKED = [
  [10, 18, 14, 22, 16, 25, 20],
  [5, 8, 12, 6, 10, 14, 9],
  [3, 6, 4, 8, 5, 7, 11]
];
const DEMO_AREA = [30, 48, 42, 65, 58, 72, 68, 80, 88, 82, 90, 85, 92, 78];
const DEMO_DONUT = [
  { label: "OK", value: 62, color: "var(--ic-success)" },
  { label: "WARN", value: 28, color: "var(--ic-warn)" },
  { label: "ERR", value: 10, color: "var(--ic-error)" }
];
const DEMO_GAUGE_VALUE = 68;
const DEMO_GAUGE_SEGMENTS = [
  { to: 70, color: "var(--ic-success)" },
  { to: 85, color: "var(--ic-warn)" },
  { to: 100, color: "var(--ic-error)" }
];

export function renderChartGallery(host: HTMLElement): void {
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
  `;

  grid.appendChild(createChartCard({
    type: "line",
    title: "Courbe (line)",
    description: "Courbe avec surface remplie — tendances",
    data: DEMO_LINE,
    width: 320,
    height: 140
  }));

  grid.appendChild(createChartCard({
    type: "area",
    title: "Surface (area)",
    description: "Même rendu que line — volumes, cumuls",
    data: DEMO_AREA,
    width: 320,
    height: 140
  }));

  grid.appendChild(createChartCard({
    type: "bar",
    title: "Barres (bar)",
    description: "Volume par catégorie",
    data: DEMO_BAR,
    width: 320,
    height: 140
  }));

  grid.appendChild(createChartCard({
    type: "stackedBar",
    title: "Barres empilées (stackedBar)",
    description: "Plusieurs séries par catégorie",
    data: DEMO_STACKED,
    width: 320,
    height: 140
  }));

  grid.appendChild(createChartCard({
    type: "donut",
    title: "Donut",
    description: "Répartition OK / WARN / ERR",
    series: DEMO_DONUT,
    size: 160
  }));

  grid.appendChild(createChartCard({
    type: "gauge",
    title: "Jauge (gauge)",
    description: "Valeur / max, seuils colorés",
    value: DEMO_GAUGE_VALUE,
    max: 100,
    label: "%",
    segments: DEMO_GAUGE_SEGMENTS,
    size: 160
  }));

  host.appendChild(grid);
}
