/**
 * ICONTROL_SECRET_ROTATION_V1
 * Rotation automatique des secrets et clés
 */

export interface Secret {
  id: string;
  type: "password" | "api-key" | "token" | "certificate";
  current: string; // Hashé/chiffré
  previous?: string; // Version précédente (pour rollback)
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  autoRotate: boolean;
  rotationInterval: number; // jours
}

class SecretRotationManager {
  private secrets: Map<string, Secret> = new Map();

  registerSecret(secret: Secret) {
    this.secrets.set(secret.id, secret);
    this.checkRotationNeeded(secret.id);
  }

  async rotateSecret(id: string, newSecret: string): Promise<boolean> {
    const secret = this.secrets.get(id);
    if (!secret) return false;

    try {
      // Sauvegarder version précédente pour rollback
      secret.previous = secret.current;
      secret.current = await this.hashSecret(newSecret, secret.type);
      secret.rotatedAt = new Date();
      secret.expiresAt = new Date(Date.now() + secret.rotationInterval * 24 * 60 * 60 * 1000);

      this.secrets.set(id, secret);

      // Émettre événement de rotation
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("secret-rotated", {
          detail: { id, type: secret.type }
        }));
      }

      return true;
    } catch (e) {
      console.error(`Failed to rotate secret ${id}:`, e);
      return false;
    }
  }

  checkRotationNeeded(id: string): boolean {
    const secret = this.secrets.get(id);
    if (!secret || !secret.autoRotate) return false;

    if (!secret.expiresAt) {
      // Première vérification, définir expiration
      secret.expiresAt = new Date(Date.now() + secret.rotationInterval * 24 * 60 * 60 * 1000);
      return false;
    }

    const now = new Date();
    const daysUntilExpiry = (secret.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Alerter si expiration dans moins de 7 jours
    if (daysUntilExpiry < 7 && daysUntilExpiry > 0) {
      this.alertRotationNeeded(id, daysUntilExpiry);
    }

    // Rotation automatique si expiré
    if (now >= secret.expiresAt) {
      this.triggerAutoRotation(id);
      return true;
    }

    return false;
  }

  private async hashSecret(secret: string, type: Secret["type"]): Promise<string> {
    // Pour les mots de passe, utiliser passwordHash
    if (type === "password") {
      const { hashPassword } = await import("../security/passwordHash");
      return hashPassword(secret);
    }

    // Pour autres types, hash simple (en production, utiliser chiffrement)
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(String.fromCharCode(...hashArray));
  }

  private async alertRotationNeeded(id: string, daysUntilExpiry: number) {
    const message = `Secret ${id} expire dans ${Math.ceil(daysUntilExpiry)} jours`;
    console.warn(`[Secret Rotation] ${message}`);
    
    // Notifier administrateur via toast si disponible
    try {
      const { showToast } = await import("../ui/toast");
      showToast({
        status: "warning",
        title: "Rotation de secret requise",
        message: message,
        duration: 10000
      });
    } catch (e) {
      // Toast non disponible, ignorer silencieusement
    }
  }

  private async triggerAutoRotation(id: string) {
    const secret = this.secrets.get(id);
    if (!secret) return;

    // Générer nouveau secret (en production, utiliser générateur sécurisé)
    const newSecret = this.generateSecret(secret.type);
    await this.rotateSecret(id, newSecret);
  }

  private generateSecret(type: Secret["type"]): string {
    // Génération simplifiée (en production, utiliser bibliothèque sécurisée)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  checkAllSecrets() {
    this.secrets.forEach((secret, id) => {
      this.checkRotationNeeded(id);
    });
  }
}

export const secretRotationManager = new SecretRotationManager();

// Vérifier rotation toutes les heures
if (typeof window !== "undefined") {
  setInterval(() => {
    secretRotationManager.checkAllSecrets();
  }, 60 * 60 * 1000); // 1 heure
}
