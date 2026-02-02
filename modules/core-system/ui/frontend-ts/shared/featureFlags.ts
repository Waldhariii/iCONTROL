import { asStorage } from "../../../../../shared/storage/webStorage";
import { recordObs } from "../pages/_shared/audit";
import { OBS } from "../pages/_shared/obsCodes";
import { getSafeMode } from "../pages/_shared/safeMode";

export type FlagId =
  | "AUTO_DECISION_ENGINE"
  | "ENABLE_RISK_ALERTS"
  | "STRICT_COMPLIANCE_MODE"
  | "ALLOW_COST_OVERRUN"
  | "ENABLE_DOCS_OCR_MODULE"
  | "ENABLE_SYSTEM_MODULE"
  | "ENABLE_LOGS_MODULE";

export type FlagDef = {
  id: FlagId;
  label: string;
  description: string;
  defaultValue: boolean;
  safeModeForcesOff?: boolean;
};

export const FLAG_DEFS: FlagDef[] = [
  {
    id: "AUTO_DECISION_ENGINE",
    label: "Moteur de decision automatique",
    description: "Active les decisions automatiques (recommandations/triage).",
    defaultValue: false,
    safeModeForcesOff: true
  },
  {
    id: "ENABLE_RISK_ALERTS",
    label: "Alertes de risque",
    description: "Active l'emission d'alertes (risques, incoherences, seuils).",
    defaultValue: true
  },
  {
    id: "STRICT_COMPLIANCE_MODE",
    label: "Conformite stricte",
    description: "Verrouille les operations sensibles et renforce les validations.",
    defaultValue: true
  },
  {
    id: "ALLOW_COST_OVERRUN",
    label: "Depassement budgetaire autorise",
    description: "Autorise l'execution meme si le budget prevu est depasse.",
    defaultValue: false,
    safeModeForcesOff: true
  },
  {
    id: "ENABLE_DOCS_OCR_MODULE",
    label: "Module Documents/OCR",
    description: "Active le module DOCUMENTS (OCR) s'il est disponible.",
    defaultValue: false
  },
  {
    id: "ENABLE_SYSTEM_MODULE",
    label: "Module Systeme",
    description: "Active la page SYSTEME (flags, modes, self-check).",
    defaultValue: true
  },
  {
    id: "ENABLE_LOGS_MODULE",
    label: "Module Logs",
    description: "Active la page LOGS (audit en lecture seule).",
    defaultValue: true
  }
];

const PREFIX = "icontrol_flags_v1.";

function keyOf(id: FlagId): string {
  return PREFIX + id;
}

export function getFlag(id: FlagId, storage: Storage = asStorage()): boolean {
  const raw = storage.getItem(keyOf(id));
  if (raw === "true") return true;
  if (raw === "false") return false;
  const def = FLAG_DEFS.find((d) => d.id === id);
  return def ? def.defaultValue : false;
}

export function setFlag(id: FlagId, value: boolean, storage: Storage = asStorage()): void {
  if (getSafeMode() === "STRICT") {
    recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: `flag:${id}`, detail: "safeModeStrict" });
    return;
  }
  storage.setItem(keyOf(id), value ? "true" : "false");
  recordObs({ code: OBS.INFO_WRITE_OK, actionId: `flag:${id}`, detail: `set:${value}` });
}

export function listFlags(storage: Storage = asStorage()): Array<{
  def: FlagDef;
  value: boolean;
  effective: boolean;
  disabledBySafeMode: boolean;
}> {
  const safeMode = getSafeMode();
  return FLAG_DEFS.map((def) => {
    const value = getFlag(def.id, storage);
    const disabledBySafeMode = Boolean(def.safeModeForcesOff && safeMode === "STRICT");
    const effective = disabledBySafeMode ? false : value;
    return { def, value, effective, disabledBySafeMode };
  });
}
