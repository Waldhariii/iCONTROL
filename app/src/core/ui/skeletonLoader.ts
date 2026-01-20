/**
 * ICONTROL_SKELETON_LOADER_V1
 * Système de skeleton loaders réutilisable pour états de chargement
 */

export interface SkeletonOptions {
  width?: string;
  height?: string;
  borderRadius?: string;
  animation?: "pulse" | "wave" | "none";
  lines?: number;
}

export function createSkeletonLoader(options: SkeletonOptions = {}): HTMLElement {
  const {
    width = "100%",
    height = "20px",
    borderRadius = "4px",
    animation = "pulse",
    lines = 1
  } = options;

  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    display: flex;
    flex-direction: ${lines > 1 ? "column" : "row"};
    gap: ${lines > 1 ? "8px" : "0"};
    width: 100%;
  `;

  for (let i = 0; i < lines; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "icontrol-skeleton-loader";
    skeleton.style.cssText = `
      width: ${width};
      height: ${height};
      background: rgba(255, 255, 255, 0.05);
      border-radius: ${borderRadius};
      animation: ${animation === "pulse" ? "icontrol-skeleton-pulse 1.5s ease-in-out infinite" : animation === "wave" ? "icontrol-skeleton-wave 1.5s ease-in-out infinite" : "none"};
      flex-shrink: 0;
    `;
    container.appendChild(skeleton);
  }

  // Injecter les animations CSS si elles n'existent pas déjà
  if (!document.querySelector("#icontrol-skeleton-styles")) {
    const style = document.createElement("style");
    style.id = "icontrol-skeleton-styles";
    style.textContent = `
      @keyframes icontrol-skeleton-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      @keyframes icontrol-skeleton-wave {
        0% {
          background-position: -200px 0;
        }
        100% {
          background-position: calc(200px + 100%) 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return container;
}

export function createCardSkeleton(): HTMLElement {
  const card = document.createElement("div");
  card.style.cssText = `
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // Titre
  card.appendChild(createSkeletonLoader({ width: "60%", height: "20px" }));
  // Ligne 1
  card.appendChild(createSkeletonLoader({ width: "100%", height: "16px" }));
  // Ligne 2
  card.appendChild(createSkeletonLoader({ width: "80%", height: "16px" }));

  return card;
}

export function createTableSkeleton(rows: number = 5, cols: number = 4): HTMLElement {
  const table = document.createElement("div");
  table.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  `;

  // En-têtes
  const header = document.createElement("div");
  header.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid var(--ic-border, #2b3136);
  `;
  for (let i = 0; i < cols; i++) {
    header.appendChild(createSkeletonLoader({ width: "100%", height: "14px" }));
  }
  table.appendChild(header);

  // Lignes
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div");
    row.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: 12px;
      padding: 12px;
    `;
    for (let i = 0; i < cols; i++) {
      row.appendChild(createSkeletonLoader({ width: "100%", height: "16px" }));
    }
    table.appendChild(row);
  }

  return table;
}
