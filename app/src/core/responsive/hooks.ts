/**
 * ICONTROL_RESPONSIVE_HOOKS_V1
 * Hooks pour détecter le type d'appareil et les breakpoints
 */

import React, { useState, useEffect } from 'react';
import { getDeviceType, type DeviceType, BREAKPOINTS, type BreakpointKey } from './breakpoints';

/**
 * Hook pour détecter le type d'appareil actuel
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getDeviceType(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

/**
 * Hook pour vérifier si un media query correspond
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Support pour addEventListener (moderne)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback pour addListener (ancien)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Hook pour vérifier si on est au-dessus d'un breakpoint
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
  return useMediaQuery(query);
}

/**
 * Hook pour obtenir la largeur actuelle de la fenêtre
 */
export function useWindowWidth(): number {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 1920;
    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

/**
 * Hook pour vérifier si on est sur mobile
 */
export function useIsMobile(): boolean {
  return useBreakpoint('tablet') === false;
}

/**
 * Hook pour vérifier si on est sur tablette ou plus grand
 */
export function useIsTabletOrLarger(): boolean {
  return useBreakpoint('tablet');
}

/**
 * Hook pour vérifier si on est sur desktop
 */
export function useIsDesktop(): boolean {
  return useBreakpoint('desktop');
}
