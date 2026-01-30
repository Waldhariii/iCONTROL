import { MAIN_SYSTEM_MODULES, MAIN_SYSTEM_RULES } from "../_shared/mainSystem.data";

export type VerificationModel = {
  title: string;
  description: string;
  selfcheckRoute: string;
  ruleConditions: string[];
  ruleEffects: string[];
  ruleValueRefs: string[];
};

export function createVerificationModel(): VerificationModel {
  const core = MAIN_SYSTEM_MODULES.find((mod) => mod.id === "CORE_SYSTEM");
  return {
    title: "Verification",
    description: "Contrôle des règles et du moteur (inventaire).",
    selfcheckRoute: core?.routes.includes("selfcheck") ? "selfcheck" : "unknown",
    ruleConditions: MAIN_SYSTEM_RULES.conditions,
    ruleEffects: MAIN_SYSTEM_RULES.effects,
    ruleValueRefs: MAIN_SYSTEM_RULES.valueRefs
  };
}
