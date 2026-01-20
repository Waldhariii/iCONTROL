/**
 * ICONTROL_RESPONSIVE_BREAKPOINTS_V1
 * Système de breakpoints standardisés pour responsive design
 */

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1920,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export const BREAKPOINT_VALUES = {
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.laptop - 1}px)`,
  laptop: `(min-width: ${BREAKPOINTS.laptop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
} as const;

/**
 * Détecte le type d'appareil basé sur la largeur de l'écran
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.laptop) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'laptop';
  return 'desktop';
}

/**
 * Vérifie si la largeur correspond à un breakpoint
 */
export function isBreakpoint(width: number, breakpoint: BreakpointKey): boolean {
  const bp = BREAKPOINTS[breakpoint];
  const nextBp = Object.values(BREAKPOINTS).find(v => v > bp);
  
  if (breakpoint === 'mobile') {
    return width < BREAKPOINTS.tablet;
  }
  if (breakpoint === 'desktop') {
    return width >= BREAKPOINTS.desktop;
  }
  if (nextBp) {
    return width >= bp && width < nextBp;
  }
  return width >= bp;
}

/**
 * Media query string pour un breakpoint
 */
export function getMediaQuery(breakpoint: BreakpointKey, direction: 'min' | 'max' = 'min'): string {
  const value = BREAKPOINTS[breakpoint];
  if (direction === 'min') {
    return `(min-width: ${value}px)`;
  }
  return `(max-width: ${value - 1}px)`;
}
