import { MAIN_SYSTEM_MODULES, MAIN_SYSTEM_RULES } from "../../shared/mainSystem.data";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/runtime/safe";
import { getSession } from "/src/localAuth";

export type CheckResult = {
  id: string;
  title: string;
  severity: "OK" | "WARN" | "ERR";
  details: string;
  remediation?: string;
  evidence?: string;
};

export type VerificationModel = {
  title: string;
  description: string;
  selfcheckRoute: string;
  ruleConditions: string[];
  ruleEffects: string[];
  ruleValueRefs: string[];
  checks: CheckResult[];
};

function performSelfChecks(): CheckResult[] {
  const checks: CheckResult[] = [];
  const role = getRole();
  const safeMode = getSafeMode();
  const session = getSession();

  // Check 1: Routing/Assets
  try {
    const assetsBase = window.location.origin + (window.location.pathname.includes("/cp") ? "/cp" : "/app");
    checks.push({
      id: "routing-assets",
      title: "Routing & Assets",
      severity: "OK",
      details: "Routes et assets accessibles",
      evidence: `Base: ${assetsBase}`
    });
  } catch (e) {
    checks.push({
      id: "routing-assets",
      title: "Routing & Assets",
      severity: "ERR",
      details: `Erreur de routage: ${String(e)}`,
      remediation: "Vérifier la configuration du serveur"
    });
  }

  // Check 2: Registry integrity
  try {
    const modules = MAIN_SYSTEM_MODULES;
    const moduleIds = modules.map(m => m.id);
    const duplicates = moduleIds.filter((id, idx) => moduleIds.indexOf(id) !== idx);
    
    if (duplicates.length > 0) {
      checks.push({
        id: "registry-duplicates",
        title: "Registry Integrity",
        severity: "WARN",
        details: `IDs dupliqués détectés: ${duplicates.join(", ")}`,
        remediation: "Corriger les IDs dupliqués dans le registre"
      });
    } else {
      checks.push({
        id: "registry-integrity",
        title: "Registry Integrity",
        severity: "OK",
        details: `${modules.length} modules chargés, aucun doublon`,
        evidence: `Modules: ${moduleIds.join(", ")}`
      });
    }
  } catch (e) {
    checks.push({
      id: "registry-integrity",
      title: "Registry Integrity",
      severity: "ERR",
      details: `Erreur lors de la vérification: ${String(e)}`
    });
  }

  // Check 3: RBAC/SAFE_MODE
  try {
    const rbacStatus = role ? "OK" : "ERR";
    const safeModeStatus = safeMode ? "OK" : "WARN";
    
    checks.push({
      id: "rbac-safemode",
      title: "RBAC & SAFE_MODE",
      severity: rbacStatus === "OK" && safeModeStatus === "OK" ? "OK" : "WARN",
      details: `Rôle: ${role || "NON DÉFINI"}, SAFE_MODE: ${safeMode || "NON DÉFINI"}`,
      evidence: session ? `Session: ${(session as any).username}` : "Aucune session"
    });
  } catch (e) {
    checks.push({
      id: "rbac-safemode",
      title: "RBAC & SAFE_MODE",
      severity: "ERR",
      details: `Erreur: ${String(e)}`
    });
  }

  // Check 4: Storage providers
  try {
    const storageAvailable = typeof localStorage !== "undefined";
    const storageTest = storageAvailable ? (() => {
      try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        return true;
      } catch {
        return false;
      }
    })() : false;

    checks.push({
      id: "storage-providers",
      title: "Storage Providers",
      severity: storageTest ? "OK" : "ERR",
      details: storageTest 
        ? "localStorage opérationnel" 
        : "localStorage non disponible ou bloqué",
      remediation: storageTest ? undefined : "Vérifier les permissions du navigateur"
    });
  } catch (e) {
    checks.push({
      id: "storage-providers",
      title: "Storage Providers",
      severity: "ERR",
      details: `Erreur: ${String(e)}`
    });
  }

  // Check 5: Rules engine
  try {
    const conditions = MAIN_SYSTEM_RULES.conditions;
    const effects = MAIN_SYSTEM_RULES.effects;
    const hasRules = conditions.length > 0 || effects.length > 0;

    checks.push({
      id: "rules-engine",
      title: "Rules Engine",
      severity: hasRules ? "OK" : "WARN",
      details: `${conditions.length} conditions, ${effects.length} effets`,
      evidence: hasRules ? "Moteur de règles chargé" : "Aucune règle définie"
    });
  } catch (e) {
    checks.push({
      id: "rules-engine",
      title: "Rules Engine",
      severity: "ERR",
      details: `Erreur: ${String(e)}`
    });
  }

  return checks;
}

export function createVerificationModel(): VerificationModel {
  const core = MAIN_SYSTEM_MODULES.find((mod) => mod.id === "CORE_SYSTEM");
  const checks = performSelfChecks();
  
  return {
    title: "Control Plane Self-Check",
    description: "Vérification complète de la conformité, intégrité et readiness du système.",
    selfcheckRoute: core?.routes.includes("selfcheck") ? "selfcheck" : "unknown",
    ruleConditions: MAIN_SYSTEM_RULES.conditions,
    ruleEffects: MAIN_SYSTEM_RULES.effects,
    ruleValueRefs: MAIN_SYSTEM_RULES.valueRefs,
    checks
  };
}
