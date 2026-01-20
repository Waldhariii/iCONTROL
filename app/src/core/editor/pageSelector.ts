/**
 * ICONTROL_PAGE_SELECTOR_V1
 * Sélecteur de pages pour l'édition visuelle
 */

export interface PageInfo {
  id: string;
  title: string;
  path: string;
  appKind: "APP" | "CP" | "BOTH";
  category: string;
}

export const AVAILABLE_PAGES: PageInfo[] = [
  // Pages CP (Administration)
  { id: "dashboard", title: "Dashboard", path: "/cp/#/dashboard", appKind: "CP", category: "Core" },
  { id: "users", title: "Utilisateurs", path: "/cp/#/users", appKind: "CP", category: "Gestion" },
  { id: "account", title: "Compte", path: "/cp/#/account", appKind: "CP", category: "Core" },
  { id: "management", title: "Management", path: "/cp/#/management", appKind: "CP", category: "Gestion" },
  { id: "settings", title: "Paramètres", path: "/cp/#/settings", appKind: "CP", category: "Configuration" },
  { id: "developer", title: "Développeur", path: "/cp/#/developer", appKind: "CP", category: "Développement" },
  { id: "system", title: "Système", path: "/cp/#/system", appKind: "CP", category: "Configuration" },
  { id: "logs", title: "Logs", path: "/cp/#/logs", appKind: "CP", category: "Développement" },
  { id: "verification", title: "Vérification", path: "/cp/#/verification", appKind: "CP", category: "Développement" },
  
  // Pages APP (Client)
  { id: "dashboard-app", title: "Dashboard (Client)", path: "/app/#/dashboard", appKind: "APP", category: "Core" },
  { id: "dossiers", title: "Dossiers", path: "/app/#/dossiers", appKind: "APP", category: "Gestion" },
  { id: "account-app", title: "Compte (Client)", path: "/app/#/account", appKind: "APP", category: "Core" },
];

/**
 * Obtient les pages disponibles selon le contexte (APP ou CP)
 */
export function getAvailablePages(appKind?: "APP" | "CP"): PageInfo[] {
  if (!appKind) {
    // Détecter depuis l'URL
    const path = window.location.pathname;
    appKind = path.startsWith("/cp") ? "CP" : "APP";
  }
  
  return AVAILABLE_PAGES.filter(page => 
    page.appKind === appKind || page.appKind === "BOTH"
  );
}

/**
 * Ouvre une page dans une nouvelle fenêtre pour édition
 */
export function openPageForEditing(page: PageInfo): Window | null {
  const fullUrl = window.location.origin + page.path;
  const popup = window.open(
    fullUrl,
    `icontrol-editor-${page.id}`,
    `width=1400,height=900,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
  );
  
  return popup;
}
