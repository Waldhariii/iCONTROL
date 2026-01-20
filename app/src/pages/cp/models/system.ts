/**
 * ICONTROL_CP_SYSTEM_MODEL_V1
 * Modèle système pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */

function getSafeModeCp(): "STRICT" | "COMPAT" {
  try {
    const mode = (globalThis as any).ICONTROL_SAFE_MODE;
    return mode === "STRICT" ? "STRICT" : "COMPAT";
  } catch {
    return "COMPAT";
  }
}

function listFlagsCp(storage: Storage = window.localStorage): Array<{ def: { id: string; label: string; description: string }; effective: boolean; disabledBySafeMode: boolean }> {
  try {
    const flags: any[] = [];
    const flagDefs = [
      { id: "ui.developer", label: "Developer UI", description: "Afficher les outils développeur", defaultValue: false },
      { id: "ui.logs", label: "Logs UI", description: "Afficher les logs système", defaultValue: false },
      { id: "system.monitoring", label: "Monitoring", description: "Activer le monitoring système", defaultValue: true }
    ];
    
    flagDefs.forEach(fd => {
      const stored = storage.getItem(`flag_${fd.id}`);
      const effective = stored ? stored === "true" : fd.defaultValue;
      flags.push({
        def: fd,
        effective,
        disabledBySafeMode: false
      });
    });
    
    return flags;
  } catch {
    return [];
  }
}

export type SystemFlagVMCp = {
  id: string;
  label: string;
  description: string;
  value: boolean;
  disabledBySafeMode: boolean;
};

export type SystemModelCp = {
  safeMode: "STRICT" | "COMPAT";
  flags: SystemFlagVMCp[];
  menuOrder: string[];
  layout: {
    topbarHeight: number;
    drawerWidth: number;
    maxWidth: number;
    pagePadding: number;
  };
};

export function createSystemModelCp(storage: Storage = window.localStorage): SystemModelCp {
  const safeMode = getSafeModeCp();
  
  const flags = listFlagsCp(storage).map((f) => ({
    id: f.def.id,
    label: f.def.label,
    description: f.def.description,
    value: f.effective,
    disabledBySafeMode: f.disabledBySafeMode
  }));

  return {
    safeMode,
    flags,
    menuOrder: ["dashboard", "system", "logs", "developer", "users", "account"],
    layout: {
      topbarHeight: 60,
      drawerWidth: 280,
      maxWidth: 1400,
      pagePadding: 20
    }
  };
}

export function updateFlagCp(id: string, next: boolean, storage: Storage = window.localStorage): void {
  storage.setItem(`flag_${id}`, String(next));
}

export function setAllFlagsCp(next: boolean, storage: Storage = window.localStorage): void {
  listFlagsCp(storage).forEach((f) => updateFlagCp(f.def.id, next, storage));
}

export function resetFlagsCp(storage: Storage = window.localStorage): void {
  const flagDefs = [
    { id: "ui.developer", defaultValue: false },
    { id: "ui.logs", defaultValue: false },
    { id: "system.monitoring", defaultValue: true }
  ];
  flagDefs.forEach((f) => updateFlagCp(f.id, f.defaultValue, storage));
}
