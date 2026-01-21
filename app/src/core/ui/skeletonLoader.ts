/**
 * ICONTROL_SKELETON_LOADER_V1
 * Simple skeleton card for loading states.
 */
export function createCardSkeleton(height = 120): HTMLElement {
  const card = document.createElement("div");
  card.style.cssText = `
    border: 1px solid var(--ic-border, #2b3136);
    background: var(--ic-card, #1a1d1f);
    border-radius: 10px;
    height: ${height}px;
    overflow: hidden;
    position: relative;
  `;

  const shimmer = document.createElement("div");
  shimmer.style.cssText = `
    position: absolute;
    top: 0;
    left: -60%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    animation: icSkeleton 1.4s infinite;
  `;
  card.appendChild(shimmer);

  if (!document.getElementById("icontrol-skeleton-style")) {
    const style = document.createElement("style");
    style.id = "icontrol-skeleton-style";
    style.textContent = `
      @keyframes icSkeleton {
        0% { transform: translateX(0); }
        100% { transform: translateX(220%); }
      }
    `;
    document.head.appendChild(style);
  }

  return card;
}
