import "./shell.css";
import { getSession, isLoggedIn, logout } from "../../../app/src/localAuth";
import { canSeeSettings, canAccessPageRoute } from "../../../app/src/runtime/rbac";
import { getAppKind } from "../../../app/src/pages/appContext";
import { buildMainSystemShell } from "../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.ui";
import { getAvatarConfig, getInitials } from "../../../app/src/core/user/avatarManager";
import { getBrand } from "../../../platform-services/branding/brandService";

export type NavItem = {
  id: string;
  label: string;
  hash: string;
  show: () => boolean;
};

function getRouteHash(): string {
  return window.location.hash || "#/login";
}

function setActiveLinks(drawer: HTMLElement){
  const h = getRouteHash();
  drawer.querySelectorAll("a[data-hash]").forEach(a=>{
    const hash = (a as HTMLAnchorElement).getAttribute("data-hash") || "";
    if(hash && h.startsWith(hash)) a.classList.add("active");
    else a.classList.remove("active");
  });
}

function canSeeDossiers(): boolean {
  if (!isLoggedIn()) return false;
  const s = getSession() as any;
  const r = String(s?.role || "USER").toUpperCase();
  return r === "SYSADMIN" || r === "DEVELOPER" || r === "ADMIN";
}

export function createShell(navItems: NavItem[]){
  const shell = buildMainSystemShell();
  const { root, header, drawer, overlay, main, nav, burger, close, logoutLink, sessionHint } = shell;
  const headerContext = header.querySelector("#cxHeaderContext") as HTMLElement;
  const userAvatar = drawer.querySelector("#cxUserAvatar") as HTMLElement;
  const settingsLink = drawer.querySelector("#cxSettingsLink") as HTMLAnchorElement;
  const userInfo = drawer.querySelector("#cxUserInfo") as HTMLElement;
  const userFullname = drawer.querySelector("#cxUserFullname") as HTMLElement;
  const userRole = drawer.querySelector("#cxUserRole") as HTMLElement;
  const userCompany = drawer.querySelector("#cxUserCompany") as HTMLElement;
  const drawerLogoImg = drawer.querySelector("#cxDrawerLogoImg") as HTMLImageElement;
  const drawerLogoText = drawer.querySelector("#cxDrawerLogoText") as HTMLElement;

  // ICONTROL_HIDE_HEADER_ON_LOGIN_V1: Cacher le header et le menu sur la page Login
  function updateShellVisibility() {
    const currentHash = getRouteHash();
    const isLoginPage = currentHash === "#/login" || currentHash.startsWith("#/login");
    
    if (isLoginPage) {
      header.style.display = "none";
      burger.style.display = "none";
      drawer.style.display = "none";
      overlay.style.display = "none";
    } else {
      header.style.display = "";
      burger.style.display = "";
      drawer.style.display = "";
      overlay.style.display = "";
    }
  }

  function updateUserAvatar(): void {
    if (!isLoggedIn() || !userAvatar) return;
    const s = getSession() as any;
    if (!s) return;
    
    const avatarConfig = getAvatarConfig(s.username);
    if (avatarConfig.type === "image" && avatarConfig.imageUrl) {
      userAvatar.innerHTML = `<img src="${avatarConfig.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${getInitials(s.username)}';this.parentElement.style.background='${avatarConfig.color || "#6D28D9"}';" />`;
      userAvatar.style.background = "transparent";
    } else {
      userAvatar.innerHTML = getInitials(s.username);
      userAvatar.style.background = avatarConfig.color || "#6D28D9";
    }
  }

  function updateUserInfo(): void {
    if (!isLoggedIn() || !userInfo) return;
    const s = getSession() as any;
    if (!s) return;
    
    // Récupérer les données utilisateur depuis localStorage
    try {
      const userDataRaw = localStorage.getItem(`icontrol_user_data_${s.username}`);
      const userData = userDataRaw ? JSON.parse(userDataRaw) : {};
      const fullname = userData.fullname || s.username;
      // ICONTROL_MASTER_ROLE_DISPLAY_V1: Afficher "Master" au lieu de "SYSADMIN" pour l'utilisateur Master
      const displayRole = s.username === "Master" ? "Master" : (s.role || "USER");
      const brand = getBrand();
      const companyName = brand.LEGAL_NAME || brand.APP_DISPLAY_NAME || "iCONTROL";
      
      if (userFullname) userFullname.textContent = fullname;
      if (userRole) userRole.textContent = displayRole;
      if (userCompany) userCompany.textContent = companyName;
      
      userInfo.style.display = "block";
    } catch (e) {
      console.warn("Erreur lors de la récupération des infos utilisateur:", e);
      if (userFullname) userFullname.textContent = s.username;
      if (userRole) userRole.textContent = s.username === "Master" ? "Master" : (s.role || "USER");
      if (userCompany) userCompany.textContent = "iCONTROL";
      userInfo.style.display = "block";
    }
  }

  function updateDrawerLogo(): void {
    try {
      const brand = getBrand();
      const brandAny = brand as any;
      const currentTheme = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      const logoUrl = currentTheme === "light" 
        ? (brandAny.LOGO_LIGHT || brand.LOGO_PRIMARY || "")
        : (brandAny.LOGO_DARK || brand.LOGO_PRIMARY || "");
      
      if (logoUrl && drawerLogoImg) {
        drawerLogoImg.src = logoUrl;
        drawerLogoImg.style.display = "block";
        if (drawerLogoText) drawerLogoText.style.display = "none";
      } else {
        if (drawerLogoImg) drawerLogoImg.style.display = "none";
        if (drawerLogoText) {
          drawerLogoText.style.display = "block";
          drawerLogoText.textContent = brand.APP_DISPLAY_NAME || "iCONTROL";
        }
      }
    } catch (e) {
      console.warn("Erreur lors de la mise à jour du logo:", e);
    }
  }

  function renderNav(){
    nav.innerHTML = "";
    navItems.forEach(it=>{
      if(!it.show()) return;
      // Ne pas afficher "Paramètres" et "Compte" dans le menu (on a l'icône/avatar en bas)
      if (it.id === "settings" || it.id === "account") return;
      
      const a = document.createElement("a");
      a.href = it.hash;
      a.setAttribute("data-hash", it.hash);
      a.textContent = it.label;
      // ICONTROL_MENU_CLOSE_ON_CLICK_V1: Fermer le menu quand on clique sur un lien
      a.onclick = () => {
        closeDrawer();
      };
      nav.appendChild(a);
    });

    if(isLoggedIn()){
      logoutLink.style.display = "block";
      logoutLink.onclick = (e)=>{
        e.preventDefault();
        logout();
        window.location.hash = "#/login";
        closeDrawer();
      };
      updateUserAvatar();
      updateUserInfo();
      if (userAvatar) userAvatar.style.display = "flex";
      if (settingsLink) settingsLink.style.display = "flex";
    } else {
      logoutLink.style.display = "none";
      if (userAvatar) userAvatar.style.display = "none";
      if (settingsLink) settingsLink.style.display = "none";
      if (userInfo) userInfo.style.display = "none";
    }

    setActiveLinks(drawer);
    updateDrawerLogo();
  }

  // Exposer la fonction de mise à jour de l'avatar
  (window as any).__updateMenuAvatar = () => {
    updateUserAvatar();
    updateUserInfo();
  };
  
  // Navigation vers le compte
  (window as any).__navigateToAccount = () => {
    window.location.hash = "#/account";
    closeDrawer();
  };
  
  // Mettre à jour le logo du drawer quand le branding change
  window.addEventListener("storage", (e) => {
    if (e.key === "icontrol_brand_v1") {
      updateDrawerLogo();
    }
  });

  function openDrawer(){
    overlay.classList.add("open");
    drawer.classList.add("open");
    renderNav();
  }
  function closeDrawer(){
    overlay.classList.remove("open");
    drawer.classList.remove("open");
  }

  burger.onclick = openDrawer;
  close.onclick = closeDrawer;
  overlay.onclick = closeDrawer;

  window.addEventListener("hashchange", ()=>{
    renderNav();
    setActiveLinks(drawer);
    updateShellVisibility();
  });

  // ICONTROL_HEADER_CONTEXT_V1: Indicateurs de contexte permanents
  function updateHeaderContext(): void {
    if (!headerContext || !isLoggedIn()) {
      if (headerContext) headerContext.innerHTML = "";
      return;
    }
    
    const s = getSession() as any;
    if (!s) return;
    
    const role = s.username === "Master" ? "Master" : (s.role || "USER");
    const safeMode = (window as any).ICONTROL_SAFE_MODE || "COMPAT";
    // Détecter l'environnement depuis l'URL ou localStorage
    const hostname = window.location.hostname;
    const env = hostname === "localhost" || hostname === "127.0.0.1" ? "LOCAL" : 
                hostname.includes("staging") ? "STAGING" : "PROD";
    const safeModeClass = safeMode === "STRICT" ? "strict" : "";
    
    headerContext.innerHTML = `
      <span class="cxContextTag env" title="Environnement: ${env}">${env}</span>
      <span class="cxContextTag safemode ${safeModeClass}" title="SAFE_MODE: ${safeMode}">SAFE: ${safeMode}</span>
      <span class="cxContextTag role" title="Rôle: ${role}">${role}</span>
    `;
  }

  // Vérifier la visibilité au démarrage
  updateShellVisibility();
  updateHeaderContext();
  
  window.addEventListener("hashchange", () => {
    updateHeaderContext();
  });

  // Public API
  return {
    root,
    main,
    setBrandTitle(title: string){
      const el = header.querySelector("#cxBrandTitle") as HTMLElement;
      if(el) el.textContent = title || "iCONTROL";
    },
    closeDrawer,
    rerenderNav: renderNav
  };
}

/**
 * Default nav rules:
 * - Login NEVER in menu
 * - Settings visible only ADMIN/SYSADMIN/DEVELOPER
 */
export function getDefaultNavItems(): NavItem[] {
  const appKind = getAppKind();
  const isApp = appKind === "APP";
  
  return [
    { id:"dashboard", label:"Dashboard", hash:"#/dashboard", show: ()=> isLoggedIn() && canAccessPageRoute("dashboard") },
    // ICONTROL_REMOVE_DOSSIERS_FROM_CP_V1: Dossiers uniquement dans APP (client), pas dans CP (administration)
    { id:"dossiers", label:"Dossiers", hash:"#/dossiers", show: ()=> canSeeDossiers() && isApp && canAccessPageRoute("dossiers") },
    /* ICONTROL_NAV_MANAGEMENT_V1: Management remplace les pages individuelles dans CP */
    { id:"management", label:"Management", hash:"#/management", show: ()=> isLoggedIn() && !isApp && canAccessPageRoute("management") },
    /* ICONTROL_NAV_MAIN_SYSTEM_V1 */
    { id:"users", label:"Utilisateurs", hash:"#/users", show: ()=> isLoggedIn() && canAccessPageRoute("users") },
    { id:"account", label:"Compte", hash:"#/account", show: ()=> isLoggedIn() && canAccessPageRoute("account") },
    /* ICONTROL_NAV_VERIFICATION_LOGS_V1: Vérification et Logs ajoutés au menu déroulant */
    { id:"verification", label:"Vérification", hash:"#/verification", show: ()=> isLoggedIn() && !isApp && canAccessPageRoute("verification") },
    { id:"logs", label:"Logs", hash:"#/logs", show: ()=> isLoggedIn() && !isApp && canAccessPageRoute("logs") },
    { id:"settings", label:"Paramètres", hash:"#/settings", show: ()=> canSeeSettings() && canAccessPageRoute("settings") },
  ];
}
