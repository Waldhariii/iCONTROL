/**
 * ICONTROL_PASSWORD_HASH_V1
 * Système de hachage de mots de passe sécurisé utilisant Web Crypto API
 * Pour les utilisateurs critiques (Master, etc.)
 */

/**
 * Hash un mot de passe avec PBKDF2 (Web Crypto API)
 * @param password - Mot de passe en clair
 * @param salt - Sel (optionnel, généré automatiquement si non fourni)
 * @returns Promise avec le hash et le sel (format: hash:base64|salt:base64)
 */
export async function hashPassword(
  password: string,
  salt?: Uint8Array,
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Générer un sel aléatoire si non fourni
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));

  // Importer la clé pour PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  // Dériver la clé avec PBKDF2 (100,000 itérations pour sécurité renforcée)
  const iterations = 100000;
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256, // 256 bits = 32 bytes
  );

  // Convertir en base64 pour stockage
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  const saltBase64 = btoa(String.fromCharCode(...saltBytes));

  // Format: hash:base64|salt:base64|iterations
  return `${hashBase64}|${saltBase64}|${iterations}`;
}

/**
 * Vérifie un mot de passe contre un hash stocké
 * @param password - Mot de passe à vérifier
 * @param storedHash - Hash stocké (format: hash:base64|salt:base64|iterations)
 * @returns Promise<boolean> - true si le mot de passe correspond
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const parts = storedHash.split("|");
    if (parts.length !== 3) {
      console.error("Format de hash invalide");
      return false;
    }

    const [hashBase64, saltBase64, iterationsStr] = parts;
    const iterations = parseInt(iterationsStr, 10) || 100000;

    // Décoder le sel
    const saltBytes = Uint8Array.from(
      atob(saltBase64),
      (c) => c.charCodeAt(0),
    );

    // Hasher le mot de passe fourni avec le même sel
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = btoa(String.fromCharCode(...hashArray));

    // Comparaison constante dans le temps pour éviter les attaques par timing
    return constantTimeEquals(computedHash, hashBase64);
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe:", error);
    return false;
  }
}

/**
 * Comparaison constante dans le temps pour éviter les attaques par timing
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Génère un hash pour un mot de passe (utilitaire pour création d'utilisateurs)
 * Usage: await generatePasswordHash("motdepasse")
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return hashPassword(password);
}
