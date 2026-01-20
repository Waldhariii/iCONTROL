/**
 * ICONTROL_RATE_LIMITER_V1
 * Système de limitation de taux pour prévenir les attaques par force brute
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const RATE_LIMIT_STORAGE_KEY = "icontrol_rate_limit_v1";
const MAX_ATTEMPTS = 5; // Nombre maximum de tentatives
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes
const WINDOW_DURATION = 5 * 60 * 1000; // 5 minutes pour la fenêtre de tentatives

// Pour les utilisateurs critiques (Master), limites plus strictes
const CRITICAL_USER_MAX_ATTEMPTS = 3;
const CRITICAL_USER_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

function getRateLimitStorage(): Map<string, RateLimitEntry> {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map<string, RateLimitEntry>();
      for (const [key, value] of Object.entries(parsed)) {
        map.set(key, value as RateLimitEntry);
      }
      return map;
    }
  } catch (e) {
    console.error("Erreur lors de la lecture du rate limit:", e);
  }
  return new Map<string, RateLimitEntry>();
}

function saveRateLimitStorage(map: Map<string, RateLimitEntry>): void {
  try {
    const obj: Record<string, RateLimitEntry> = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde du rate limit:", e);
  }
}

function isCriticalUser(username: string): boolean {
  const criticalUsers = ["WaldHari", "waldhari", "Master", "master"];
  return criticalUsers.includes(username);
}

/**
 * Vérifie si un utilisateur peut tenter de se connecter
 * @param username - Nom d'utilisateur
 * @param identifier - Identifiant supplémentaire (IP, etc.)
 * @returns { allowed: boolean; remainingAttempts?: number; lockedUntil?: number; error?: string }
 */
export function checkRateLimit(
  username: string,
  identifier: string = "default",
): {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
  error?: string;
} {
  const storage = getRateLimitStorage();
  const key = `${username.toLowerCase()}:${identifier}`;
  const entry = storage.get(key);
  const now = Date.now();
  const isCritical = isCriticalUser(username);

  const maxAttempts = isCritical ? CRITICAL_USER_MAX_ATTEMPTS : MAX_ATTEMPTS;
  const lockoutDuration = isCritical
    ? CRITICAL_USER_LOCKOUT_DURATION
    : LOCKOUT_DURATION;

  // Si l'utilisateur est verrouillé
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000);
    return {
      allowed: false,
      error: `Compte verrouillé. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
      lockedUntil: entry.lockedUntil,
    };
  }

  // Si le verrouillage est expiré, réinitialiser
  if (entry?.lockedUntil && entry.lockedUntil <= now) {
    storage.delete(key);
    saveRateLimitStorage(storage);
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  // Si aucune entrée ou fenêtre expirée, autoriser
  if (!entry || now - entry.lastAttempt > WINDOW_DURATION) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  // Vérifier le nombre de tentatives
  if (entry.attempts >= maxAttempts) {
    const lockoutUntil = now + lockoutDuration;
    entry.lockedUntil = lockoutUntil;
    storage.set(key, entry);
    saveRateLimitStorage(storage);

    const minutes = Math.ceil(lockoutDuration / 60000);
    return {
      allowed: false,
      error: `Trop de tentatives échouées. Compte verrouillé pour ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      lockedUntil: lockoutUntil,
    };
  }

  const remaining = maxAttempts - entry.attempts;
  return { allowed: true, remainingAttempts: remaining };
}

/**
 * Enregistre une tentative de connexion échouée
 * @param username - Nom d'utilisateur
 * @param identifier - Identifiant supplémentaire
 */
export function recordFailedAttempt(
  username: string,
  identifier: string = "default",
): void {
  const storage = getRateLimitStorage();
  const key = `${username.toLowerCase()}:${identifier}`;
  const entry = storage.get(key) || { attempts: 0, lastAttempt: 0 };
  const now = Date.now();

  // Réinitialiser si la fenêtre est expirée
  if (now - entry.lastAttempt > WINDOW_DURATION) {
    entry.attempts = 1;
  } else {
    entry.attempts += 1;
  }

  entry.lastAttempt = now;
  storage.set(key, entry);
  saveRateLimitStorage(storage);

  // Logger l'événement de sécurité
  logSecurityEvent("FAILED_LOGIN_ATTEMPT", {
    username,
    attempts: entry.attempts,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Réinitialise le compteur de tentatives après une connexion réussie
 * @param username - Nom d'utilisateur
 * @param identifier - Identifiant supplémentaire
 */
export function resetRateLimit(
  username: string,
  identifier: string = "default",
): void {
  const storage = getRateLimitStorage();
  const key = `${username.toLowerCase()}:${identifier}`;
  storage.delete(key);
  saveRateLimitStorage(storage);

  logSecurityEvent("SUCCESSFUL_LOGIN", {
    username,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log un événement de sécurité
 */
function logSecurityEvent(
  eventType: string,
  data: Record<string, any>,
): void {
  try {
    const logs = JSON.parse(
      localStorage.getItem("icontrol_security_logs_v1") || "[]",
    );
    logs.push({
      type: eventType,
      ...data,
    });

    // Garder seulement les 100 derniers logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    localStorage.setItem("icontrol_security_logs_v1", JSON.stringify(logs));
  } catch (e) {
    console.error("Erreur lors du logging de sécurité:", e);
  }
}

/**
 * Récupère les logs de sécurité récents
 */
export function getSecurityLogs(limit: number = 20): Array<Record<string, any>> {
  try {
    const logs = JSON.parse(
      localStorage.getItem("icontrol_security_logs_v1") || "[]",
    );
    return logs.slice(-limit).reverse();
  } catch {
    return [];
  }
}
