/**
 * ICONTROL_RESPONSIVE_LAYOUT_V1
 * Utilitaires pour créer des layouts responsives
 */

import { getCurrentDeviceType, isMobile, isTablet, isLaptop, isDesktop } from './utils';

/**
 * Obtient les classes CSS pour un layout responsive
 */
export function getResponsiveLayoutClasses(): string {
  const deviceType = getCurrentDeviceType();
  return `layout-${deviceType}`;
}

/**
 * Obtient le nombre de colonnes optimal pour un grid
 */
export function getGridColumns(): number {
  if (isMobile()) return 1;
  if (isTablet()) return 2;
  if (isLaptop()) return 3;
  return 4;
}

/**
 * Obtient le padding responsive
 */
export function getResponsivePadding(): string {
  if (isMobile()) return 'var(--spacing-sm)';
  if (isTablet()) return 'var(--spacing-md)';
  if (isLaptop()) return 'var(--spacing-lg)';
  return 'var(--spacing-xl)';
}

/**
 * Obtient la taille de police responsive
 */
export function getResponsiveFontSize(base: number): string {
  if (isMobile()) return `${base * 0.875}px`;
  if (isTablet()) return `${base}px`;
  if (isLaptop()) return `${base * 1.125}px`;
  return `${base * 1.25}px`;
}

/**
 * Applique des styles responsives à un élément
 */
export function applyResponsiveStyles(element: HTMLElement, styles: {
  padding?: boolean;
  fontSize?: number;
  gridColumns?: boolean;
}): void {
  if (styles.padding) {
    element.style.padding = getResponsivePadding();
  }
  
  if (styles.fontSize) {
    element.style.fontSize = getResponsiveFontSize(styles.fontSize);
  }
  
  if (styles.gridColumns) {
    const columns = getGridColumns();
    element.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
}
