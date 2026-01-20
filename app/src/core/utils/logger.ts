/**
 * ICONTROL_LOGGER_V1
 * Logger conditionnel pour les logs de débogage
 * Active uniquement en mode développement (DEV) ou si ICONTROL_DEBUG=1
 */

const isDev = (): boolean => {
  try {
    // Vite: import.meta.env.DEV
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
      return true;
    }
    // Node.js: process.env.NODE_ENV !== 'production'
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
      return true;
    }
    // Variable d'environnement explicite
    if (
      (typeof window !== "undefined" && (window as any).ICONTROL_DEBUG === "1") ||
      (typeof process !== "undefined" && process.env?.ICONTROL_DEBUG === "1")
    ) {
      return true;
    }
  } catch {
    // Ignore errors
  }
  return false;
};

const DEBUG_ENABLED = isDev();

/**
 * Log de débogage (affiché uniquement en mode développement)
 */
export function debugLog(...args: unknown[]): void {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
}

/**
 * Log d'avertissement (toujours affiché)
 */
export function warnLog(...args: unknown[]): void {
  console.warn(...args);
}

/**
 * Log d'erreur (toujours affiché)
 */
export function errorLog(...args: unknown[]): void {
  console.error(...args);
}

/**
 * Log d'info (toujours affiché, pour les messages importants)
 */
export function infoLog(...args: unknown[]): void {
  console.info(...args);
}