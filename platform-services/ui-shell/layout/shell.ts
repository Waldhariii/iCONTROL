import "./shell.css";
import { getSession, isLoggedIn, logout } from "../../../app/src/localAuth";
import { canAccessToolbox, canSeeSettings } from "../../../app/src/runtime/rbac";
import { buildMainSystemShell } from "../../../modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.ui";

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

export function createShell(navItems: NavItem[]){
  const shell = buildMainSystemShell();
  const { root, header, drawer, overlay, main, nav, burger, close, logoutLink, sessionHint } = shell;

  function renderNav(){
    nav.innerHTML = "";
    navItems.forEach(it=>{
      if(!it.show()) return;
      const a = document.createElement("a");
      a.href = it.hash;
      a.setAttribute("data-hash", it.hash);
      a.textContent = it.label;
      nav.appendChild(a);
    });

    if(isLoggedIn()){
      logoutLink.style.display = "inline-block";
      logoutLink.onclick = (e)=>{
        e.preventDefault();
        logout();
        window.location.hash = "#/login";
        closeDrawer();
      };
      const s = getSession() as any;
      sessionHint.textContent = `Connecté: ${String(s?.username||"user")} • Rôle: ${String(s?.role||"USER")}`;
    } else {
      logoutLink.style.display = "none";
      sessionHint.textContent = "Non connecté";
    }

    setActiveLinks(drawer);
  }

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
  return [
    { id:"dashboard", label:"Dashboard", hash:"#/dashboard", show: ()=> true },
    /* ICONTROL_NAV_SYSTEM_LOGS_V1 */
    { id:"system", label:"Systeme", hash:"#/system", show: ()=> isLoggedIn() },
    { id:"logs", label:"Logs", hash:"#/logs", show: ()=> isLoggedIn() },
    /* ICONTROL_NAV_MAIN_SYSTEM_V1 */
    { id:"users", label:"Utilisateurs", hash:"#/users", show: ()=> isLoggedIn() },
    { id:"account", label:"Compte", hash:"#/account", show: ()=> isLoggedIn() },
    { id:"developer", label:"Développeur", hash:"#/developer", show: ()=> isLoggedIn() },
    { id:"verification", label:"Vérification", hash:"#/verification", show: ()=> isLoggedIn() },
    { id:"toolbox", label:"Toolbox", hash:"#/toolbox", show: ()=> canAccessToolbox() },
    { id:"settings", label:"Paramètres", hash:"#/settings", show: ()=> canSeeSettings() },
  ];
}
