import { MAIN_SYSTEM_RULES } from "../_shared/mainSystem.data";

export type AccountModel = {
  title: string;
  description: string;
  settingsKeys: string[];
  storageAllow: string[];
};

export function createAccountModel(): AccountModel {
  return {
    title: "Compte",
    description: "Gestion du compte et preferences.",
    settingsKeys: ["language", "theme"],
    storageAllow: MAIN_SYSTEM_RULES.storageAllow
  };
}
