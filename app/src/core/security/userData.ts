/**
 * ICONTROL_USER_DATA_V1
 * Stockage sécurisé des données utilisateur critiques
 * Les données sensibles sont stockées de manière chiffrée
 */

import { hashPassword, verifyPassword } from "./passwordHash";

export interface SecureUserData {
  username: string;
  fullName: string;
  email: string;
  passwordHash: string; // Format: hash|salt|iterations
  role: "MASTER" | "DEVELOPER" | "SYSADMIN" | "ADMIN" | "USER";
  isCritical: boolean; // Utilisateur critique nécessitant sécurité renforcée
  createdAt: string;
  lastLogin?: string;
  failedLoginAttempts: number;
  lockedUntil?: number;
}

// ICONTROL_SECURE_USERS_V1: Utilisateurs avec sécurité renforcée
// Le hash a été généré avec PBKDF2 (100,000 itérations, SHA-256)
const SECURE_USERS: Record<string, SecureUserData> = {
  WaldHari: {
    username: "WaldHari",
    fullName: "Dany Gaudreault",
    email: "dany@exterminationinnovex.com",
    // Hash generated with an internal test vector (redacted)
    // Format: hash|salt|iterations
    passwordHash: "QUsgz75rA+76bChIrHRxHiIeyeYswYS4wos9/NUV2WA=|a+Tqx/a2KiHDJyNU/Yq46A==|100000",
    role: "MASTER",
    isCritical: true,
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
  },
};

/**
 * Récupère les données d'un utilisateur sécurisé
 */
export function getSecureUserData(username: string): SecureUserData | null {
  const key = username;
  return SECURE_USERS[key] || null;
}

/**
 * Vérifie si un utilisateur existe dans le système sécurisé
 */
export function isSecureUser(username: string): boolean {
  return username in SECURE_USERS;
}

/**
 * Vérifie le mot de passe d'un utilisateur sécurisé
 */
export async function verifySecureUserPassword(
  username: string,
  password: string,
): Promise<boolean> {
  const userData = getSecureUserData(username);
  if (!userData) return false;

  return verifyPassword(password, userData.passwordHash);
}

/**
 * Met à jour les données d'un utilisateur sécurisé
 */
export function updateSecureUserData(
  username: string,
  updates: Partial<SecureUserData>,
): boolean {
  const userData = getSecureUserData(username);
  if (!userData) return false;

  Object.assign(userData, updates);
  return true;
}

/**
 * Récupère tous les utilisateurs sécurisés (pour administration)
 */
export function getAllSecureUsers(): SecureUserData[] {
  return Object.values(SECURE_USERS);
}

/**
 * Récupère les informations publiques d'un utilisateur (nom, email)
 * pour affichage dans l'interface utilisateur
 */
export function getUserPublicInfo(username: string): { fullName?: string; email?: string } | null {
  const userData = getSecureUserData(username);
  if (!userData) return null;
  
  return {
    fullName: userData.fullName,
    email: userData.email,
  };
}
