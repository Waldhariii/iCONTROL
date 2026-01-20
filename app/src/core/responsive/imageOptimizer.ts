/**
 * ICONTROL_RESPONSIVE_IMAGE_OPTIMIZER_V1
 * Utilitaires pour optimiser les images selon le device
 */

import { getCurrentDeviceType, isMobile, isTablet, isLaptop, isDesktop } from './utils';

/**
 * Retourne la taille d'image optimale selon le device
 */
export function getOptimalImageSize(baseWidth: number, baseHeight: number): { width: number; height: number } {
  const deviceType = getCurrentDeviceType();
  
  const multipliers = {
    mobile: 0.5,
    tablet: 0.75,
    laptop: 1,
    desktop: 1.25,
  };
  
  const multiplier = multipliers[deviceType];
  return {
    width: Math.round(baseWidth * multiplier),
    height: Math.round(baseHeight * multiplier),
  };
}

/**
 * Génère un srcset responsive pour une image
 */
export function generateResponsiveSrcSet(
  baseUrl: string,
  sizes: { mobile?: number; tablet?: number; laptop?: number; desktop?: number } = {}
): string {
  const defaultSizes = {
    mobile: 400,
    tablet: 768,
    laptop: 1024,
    desktop: 1920,
  };
  
  const finalSizes = { ...defaultSizes, ...sizes };
  
  return [
    `${baseUrl}?w=${finalSizes.mobile} ${finalSizes.mobile}w`,
    `${baseUrl}?w=${finalSizes.tablet} ${finalSizes.tablet}w`,
    `${baseUrl}?w=${finalSizes.laptop} ${finalSizes.laptop}w`,
    `${baseUrl}?w=${finalSizes.desktop} ${finalSizes.desktop}w`,
  ].join(', ');
}

/**
 * Retourne la taille d'image pour un srcset
 */
export function getImageSrcSetSize(): string {
  if (isMobile()) return '400px';
  if (isTablet()) return '768px';
  if (isLaptop()) return '1024px';
  return '1920px';
}

/**
 * Crée un élément picture avec sources responsives
 */
export function createResponsivePicture(
  src: string,
  alt: string,
  baseWidth: number = 1920,
  baseHeight: number = 1080
): HTMLPictureElement {
  const picture = document.createElement('picture');
  const optimalSize = getOptimalImageSize(baseWidth, baseHeight);
  
  // Source pour mobile
  const sourceMobile = document.createElement('source');
  sourceMobile.media = '(max-width: 767px)';
  sourceMobile.srcset = `${src}?w=400`;
  
  // Source pour tablette
  const sourceTablet = document.createElement('source');
  sourceTablet.media = '(min-width: 768px) and (max-width: 1023px)';
  sourceTablet.srcset = `${src}?w=768`;
  
  // Source pour laptop
  const sourceLaptop = document.createElement('source');
  sourceLaptop.media = '(min-width: 1024px) and (max-width: 1919px)';
  sourceLaptop.srcset = `${src}?w=1024`;
  
  // Image par défaut
  const img = document.createElement('img');
  img.src = `${src}?w=${optimalSize.width}`;
  img.alt = alt;
  img.loading = 'lazy';
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  
  picture.appendChild(sourceMobile);
  picture.appendChild(sourceTablet);
  picture.appendChild(sourceLaptop);
  picture.appendChild(img);
  
  return picture;
}

/**
 * Applique le lazy loading à une image
 */
export function applyLazyLoading(img: HTMLImageElement): void {
  if ('loading' in HTMLImageElement.prototype) {
    img.loading = 'lazy';
  } else {
    // Fallback pour navigateurs anciens
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          if (target.dataset.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    });
    
    if (img.dataset.src) {
      observer.observe(img);
    }
  }
}
