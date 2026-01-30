/**
 * ICONTROL_SKELETON_LOADER_V1
 * Simple skeleton card for loading states.
 */
export function createCardSkeleton(height = 120): HTMLElement {
  const card = document.createElement("div");
  card.className = "ic-skel";
  card.style.height = `${height}px`;

  const shimmer = document.createElement("div");
  shimmer.className = "ic-skel__shimmer";
  card.appendChild(shimmer);

  if (!document.getElementById("icontrol-skeleton-style")) {
    const style = document.createElement("style");
    style.id = "icontrol-skeleton-style";
    style.setAttribute("data-icontrol-allow", "1");
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
