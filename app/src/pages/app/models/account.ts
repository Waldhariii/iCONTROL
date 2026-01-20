/**
 * ICONTROL_APP_ACCOUNT_MODEL_V1
 * Modèle de compte pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */

export type AccountModelApp = {
  title: string;
  description: string;
  settingsKeys: string[];
  storageAllow: string[];
  storageUsageKeys: string[];
};

export function createAccountModelApp(): AccountModelApp {
  return {
    title: "Mon Compte - Application Client",
    description: "Informations et paramètres de votre compte client.",
    settingsKeys: ["language", "theme"],
    storageAllow: ["controlx_role_*", "controlx_language_*", "controlx_theme_*"],
    storageUsageKeys: ["controlx_iam_v1", "controlx_settings_v1", "controlx_logs_v1"]
  };
}
