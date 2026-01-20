/**
 * ICONTROL_LAZY_LOADER_V1
 * Lazy loading pour composants et ressources
 */

export interface LazyLoadOptions {
  root?: HTMLElement;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Lazy load d'images avec Intersection Observer
 */
export function lazyLoadImages(container: HTMLElement = document.body): () => void {
  const images = container.querySelectorAll<HTMLImageElement>("img[data-src]");
  
  if (!("IntersectionObserver" in window)) {
    // Fallback: charger toutes les images immédiatement
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: "50px"
  });

  images.forEach(img => observer.observe(img));

  return () => {
    images.forEach(img => observer.unobserve(img));
  };
}

/**
 * Lazy load de composants (modules) via dynamic import
 */
export async function lazyLoadComponent<T = any>(
  importFn: () => Promise<{ default: T } | T>
): Promise<T> {
  try {
    const module = await importFn();
    return "default" in module ? module.default : module as T;
  } catch (error) {
    console.error("Failed to lazy load component:", error);
    throw error;
  }
}

/**
 * Lazy load de contenu avec placeholder (skeleton screen)
 */
export function createLazyContentPlaceholder(placeholder: HTMLElement): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "position: relative; min-height: 200px;";

  // Skeleton loader
  const skeleton = document.createElement("div");
  skeleton.style.cssText = `
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, 
      var(--ic-panel, #1a1d1f) 0%, 
      rgba(255,255,255,0.05) 50%, 
      var(--ic-panel, #1a1d1f) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  `;

  if (!document.getElementById("lazy-loader-styles")) {
    const style = document.createElement("style");
    style.id = "lazy-loader-styles";
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(skeleton);
  container.appendChild(placeholder);
  placeholder.style.opacity = "0";

  return container;
}

/**
 * Lazy load avec intersection observer (pour contenu lourd)
 */
export function lazyLoadOnVisible(
  element: HTMLElement,
  loadFn: () => void | Promise<void>,
  options: LazyLoadOptions = {}
): () => void {
  if (!("IntersectionObserver" in window)) {
    // Fallback: charger immédiatement
    loadFn();
    return () => {};
  }

  const observer = new IntersectionObserver(async (entries) => {
    entries.forEach(async entry => {
      if (entry.isIntersecting) {
        await loadFn();
        observer.unobserve(element);
      }
    });
  }, {
    root: options.root,
    rootMargin: options.rootMargin || "100px",
    threshold: options.threshold || 0.1
  });

  observer.observe(element);

  return () => observer.unobserve(element);
}
