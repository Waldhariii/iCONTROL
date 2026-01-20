import { MAIN_SYSTEM_RULES } from "../../shared/mainSystem.data";

export type AccountModel = {
  title: string;
  description: string;
  settingsKeys: string[];
  storageAllow: string[];
  storageUsageKeys: string[];
};

export function createAccountModel(): AccountModel {
  return {
    title: "Compte",
    description: "Gestion du compte et preferences.",
    settingsKeys: ["language", "theme"],
    storageAllow: MAIN_SYSTEM_RULES.storageAllow,
    storageUsageKeys: ["controlx_iam_v1", "controlx_settings_v1", "controlx_logs_v1"]
  };
}
