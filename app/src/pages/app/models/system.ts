/**
 * ICONTROL_APP_SYSTEM_MODEL_V1
 * Modèle système pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */

function getSafeModeApp(): "STRICT" | "COMPAT" {
  try {
    const mode = (globalThis as any).ICONTROL_SAFE_MODE;
    return mode === "STRICT" ? "STRICT" : "COMPAT";
  } catch {
    return "COMPAT";
  }
}

export type SystemFlagVMApp = {
  id: string;
  label: string;
  description: string;
  value: boolean;
  disabledBySafeMode: boolean;
};

export type SystemModelApp = {
  safeMode: "STRICT" | "COMPAT";
  flags: SystemFlagVMApp[];
  menuOrder: string[];
  layout: {
    topbarHeight: number;
    drawerWidth: number;
    maxWidth: number;
    pagePadding: number;
  };
};

export function createSystemModelApp(storage: Storage = window.localStorage): SystemModelApp {
  const safeMode = getSafeModeApp();
  
  // Flags de base pour l'application client
  const flags: SystemFlagVMApp[] = [
    { id: "ui.notifications", label: "Notifications", description: "Afficher les notifications", value: true, disabledBySafeMode: false },
    { id: "ui.theme", label: "Thème", description: "Thème sombre/clair", value: false, disabledBySafeMode: false }
  ];

  return {
    safeMode,
    flags,
    menuOrder: ["dashboard", "dossiers", "account"],
    layout: {
      topbarHeight: 60,
      drawerWidth: 260,
      maxWidth: 1200,
      pagePadding: 16
    }
  };
}
