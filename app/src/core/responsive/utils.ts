/**
 * ICONTROL_RESPONSIVE_UTILS_V1
 * Utilitaires pour le responsive design
 */

import { getDeviceType, type DeviceType } from './breakpoints';

/**
 * Obtient le type d'appareil depuis le window object (pour code non-React)
 */
export function getCurrentDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  return getDeviceType(window.innerWidth);
}

/**
 * Vérifie si on est sur mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Vérifie si on est sur tablette
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Vérifie si on est sur laptop
 */
export function isLaptop(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 1024 && width < 1920;
}

/**
 * Vérifie si on est sur desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1920;
}

/**
 * Clamp une valeur entre min et max basé sur la largeur
 */
export function clampResponsive(
  min: number,
  max: number,
  minWidth: number = 320,
  maxWidth: number = 1920
): string {
  const deviceType = getCurrentDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return `${min}px`;
    case 'tablet':
      return `${min + (max - min) * 0.3}px`;
    case 'laptop':
      return `${min + (max - min) * 0.6}px`;
    case 'desktop':
      return `${max}px`;
    default:
      return `${max}px`;
  }
}

/**
 * Retourne le nombre de colonnes optimal selon le device
 */
export function getOptimalColumns(): number {
  const deviceType = getCurrentDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return 1;
    case 'tablet':
      return 2;
    case 'laptop':
      return 3;
    case 'desktop':
      return 4;
    default:
      return 3;
  }
}

/**
 * Alias pour getOptimalColumns (compatibilité)
 */
export function getGridColumns(): number {
  return getOptimalColumns();
}

/**
 * Retourne la taille de police responsive
 */
export function getResponsiveFontSize(base: number): string {
  const deviceType = getCurrentDeviceType();
  
  const multipliers = {
    mobile: 0.875,
    tablet: 1,
    laptop: 1.125,
    desktop: 1.25,
  };
  
  return `${base * multipliers[deviceType]}px`;
}
