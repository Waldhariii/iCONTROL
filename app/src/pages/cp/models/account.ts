/**
 * ICONTROL_CP_ACCOUNT_MODEL_V1
 * Modèle de compte pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */

export type AccountModelCp = {
  title: string;
  description: string;
  settingsKeys: string[];
  storageAllow: string[];
  storageUsageKeys: string[];
};

export function createAccountModelCp(): AccountModelCp {
  return {
    title: "Mon Compte - Administration",
    description: "Informations et paramètres de votre compte administrateur.",
    settingsKeys: ["language", "theme", "admin_notifications", "security_level"],
    storageAllow: ["controlx_role_*", "controlx_language_*", "controlx_theme_*", "controlx_admin_*", "controlx_security_*"],
    storageUsageKeys: ["controlx_iam_v1", "controlx_settings_v1", "controlx_logs_v1", "controlx_admin_v1", "controlx_security_v1"]
  };
}
