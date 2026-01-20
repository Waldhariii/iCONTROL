/**
 * ICONTROL_2FA_V1
 * Two-Factor Authentication (TOTP)
 * Note: Implémentation simplifiée - utiliser une bibliothèque comme 'otplib' en production
 */

export interface TOTPConfig {
  secret: string; // Base32 encoded secret
  issuer?: string;
  algorithm?: "SHA1" | "SHA256" | "SHA512";
  digits?: number;
  period?: number; // seconds
}

export interface User2FAConfig {
  username: string;
  enabled: boolean;
  secret?: string; // Encrypted
  backupCodes?: string[]; // Hashed
  createdAt?: Date;
  lastVerified?: Date;
}

// Simple TOTP implementation (for demo - use library like 'otplib' in production)
// Cette fonction est une simulation - utiliser une vraie bibliothèque TOTP en production
async function generateTOTP(secret: string, timeStep: number): Promise<string> {
  // Simulation simplifiée - remplacer par vraie implémentation TOTP
  // En production, utiliser: import { authenticator } from 'otplib';
  // return authenticator.generate(secret);
  
  // Simulation: générer code 6 chiffres basé sur temps (ne pas utiliser en production)
  const time = Math.floor(timeStep / 1000 / 30); // Time step de 30 secondes
  const seed = (secret.charCodeAt(0) || 0) + time;
  const code = (seed % 1000000).toString().padStart(6, "0");
  return code;
}

class TwoFactorAuthManager {
  private userConfigs: Map<string, User2FAConfig> = new Map();

  generateSecret(username: string): { secret: string; qrCodeUrl: string } {
    // Générer secret base32 (simplifié - utiliser vraie génération en production)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const config: User2FAConfig = {
      username,
      enabled: false,
      secret,
      backupCodes: this.generateBackupCodes(),
      createdAt: new Date()
    };

    this.userConfigs.set(username, config);
    this.saveToStorage();

    // URL QR Code (format otpauth://)
    const issuer = "iCONTROL";
    const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    return { secret, qrCodeUrl };
  }

  async verifyTOTP(username: string, code: string): Promise<boolean> {
    const config = this.userConfigs.get(username);
    if (!config || !config.enabled || !config.secret) {
      return false;
    }

    const now = Date.now();
    const timeStep = 30000; // 30 seconds

    // Vérifier code actuel, précédent et suivant (tolérance drift)
    for (let i = -1; i <= 1; i++) {
      const time = now + (i * timeStep);
      const expectedCode = await generateTOTP(config.secret, time);
      if (code === expectedCode) {
        config.lastVerified = new Date();
        this.saveToStorage();
        return true;
      }
    }

    return false;
  }

  verifyBackupCode(username: string, code: string): boolean {
    const config = this.userConfigs.get(username);
    if (!config || !config.backupCodes) {
      return false;
    }

    // Vérifier codes backup (simplifié - hash en production)
    const index = config.backupCodes.indexOf(code);
    if (index !== -1) {
      config.backupCodes.splice(index, 1); // Utiliser code une fois
      this.saveToStorage();
      return true;
    }

    return false;
  }

  async enable2FA(username: string, verificationCode: string): Promise<boolean> {
    const config = this.userConfigs.get(username);
    if (!config || !config.secret) {
      return false;
    }

    // Vérifier code avant activation
    if (!(await this.verifyTOTP(username, verificationCode))) {
      return false;
    }

    config.enabled = true;
    this.saveToStorage();
    return true;
  }

  disable2FA(username: string): void {
    const config = this.userConfigs.get(username);
    if (config) {
      config.enabled = false;
      config.secret = undefined;
      config.backupCodes = undefined;
      this.saveToStorage();
    }
  }

  is2FAEnabled(username: string): boolean {
    const config = this.userConfigs.get(username);
    return config?.enabled === true;
  }

  get2FAConfig(username: string): User2FAConfig | undefined {
    return this.userConfigs.get(username);
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Générer code 8 chiffres
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.userConfigs.entries()).map(([username, config]) => ({
        ...config,
        createdAt: config.createdAt?.toISOString(),
        lastVerified: config.lastVerified?.toISOString()
      }));
      localStorage.setItem("icontrol_2fa_configs", JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save 2FA configs", e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("icontrol_2fa_configs");
      if (stored) {
        const data = JSON.parse(stored);
        this.userConfigs.clear();
        data.forEach((item: any) => {
          this.userConfigs.set(item.username, {
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            lastVerified: item.lastVerified ? new Date(item.lastVerified) : undefined
          });
        });
      }
    } catch (e) {
      console.warn("Failed to load 2FA configs", e);
    }
  }
}

export const twoFactorAuth = new TwoFactorAuthManager();
twoFactorAuth.loadFromStorage();

// Note: L'implémentation TOTP ci-dessus est simplifiée pour démonstration.
// En production, utiliser une bibliothèque comme `otplib` ou `speakeasy`.
