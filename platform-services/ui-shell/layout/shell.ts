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
  // Landing: CP uses home-cp, APP uses home-app (login removed)
  const kind = (window as any).__ICONTROL_APP_KIND__ || (import.meta as any)?.env?.VITE_APP_KIND;
  return window.location.hash || (kind === "APP" || kind === "CLIENT_APP" ? "#/home-app" : "#/home-cp");
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

/** Icônes SVG 18×18 par id de navigation (style cohérent) */
const NAV_ICONS: Record<string, string> = {
  dashboard: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"9\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\"/></svg>",
  dossiers: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z\"/></svg>",
  system: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\" ry=\"2\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"9\"/><line x1=\"9\" y1=\"13\" x2=\"15\" y2=\"13\"/><line x1=\"9\" y1=\"17\" x2=\"12\" y2=\"17\"/></svg>",
  logs: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/><line x1=\"10\" y1=\"9\" x2=\"8\" y2=\"9\"/></svg>",
  users: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M23 21v-2a4 4 0 00-3-3.87\"/><path d=\"M16 3.13a4 4 0 010 7.75\"/></svg>",
  account: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>",
  developer: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"16 18 22 12 16 6\"/><polyline points=\"8 6 2 12 8 18\"/></svg>",
  verification: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>",
  toolbox: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z\"/></svg>",
  settings: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z\"/></svg>",
};

export function createShell(navItems: NavItem[]){
  const shell = buildMainSystemShell();
  const { root, header, drawer, overlay, main, nav, burger, close, logoutLink, sessionHint, headerUser } = shell;

  function renderNav(){
    nav.innerHTML = "";
    navItems.forEach(it=>{
      if(!it.show()) return;
      const a = document.createElement("a");
      a.href = it.hash;
      a.setAttribute("data-hash", it.hash);
      const icon = NAV_ICONS[it.id];
      if (icon) {
        const span = document.createElement("span");
        span.className = "cxNavIcon";
        span.innerHTML = icon;
        span.setAttribute("aria-hidden", "true");
        a.appendChild(span);
      }
      a.appendChild(document.createTextNode(it.label));
      nav.appendChild(a);
    });

    if(isLoggedIn()){
      logoutLink.style.display = "inline-block";
      logoutLink.onclick = (e)=>{
        e.preventDefault();
        logout();
        // Landing: CP uses home-cp, APP uses home-app (login removed)
        const kind = (window as any).__ICONTROL_APP_KIND__ || (import.meta as any)?.env?.VITE_APP_KIND;
        window.location.hash = kind === "APP" || kind === "CLIENT_APP" ? "#/home-app" : "#/home-cp";
        closeDrawer();
      };
      const s = getSession() as any;
      const un = String(s?.username || "user");
      const role = String(s?.role || "USER");
      sessionHint.textContent = `Connecté: ${un} • Rôle: ${role}`;
      headerUser.textContent = `${un} (${role})`;
      headerUser.setAttribute("title", `Connecté: ${un} • Rôle: ${role}`);
    } else {
      logoutLink.style.display = "none";
      sessionHint.textContent = "Non connecté";
      headerUser.textContent = "—";
      headerUser.removeAttribute("title");
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

  renderNav();

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
/**
 * Navigation — noms adaptés à une console de contrôle (administration, pilotage, supervision).
 */
export function getDefaultNavItems(): NavItem[] {
  return [
    { id:"dashboard", label:"Tableau de bord", hash:"#/dashboard", show: ()=> true },
    { id:"dossiers", label:"Organisation", hash:"#/dossiers", show: ()=> canSeeDossiers() },
    { id:"system", label:"Système", hash:"#/system", show: ()=> isLoggedIn() },
    { id:"logs", label:"Journal", hash:"#/logs", show: ()=> isLoggedIn() },
    { id:"users", label:"Utilisateurs", hash:"#/users", show: ()=> isLoggedIn() },
    { id:"account", label:"Compte", hash:"#/account", show: ()=> isLoggedIn() },
    { id:"developer", label:"Outils", hash:"#/developer", show: ()=> isLoggedIn() },
    { id:"verification", label:"Audit", hash:"#/verification", show: ()=> isLoggedIn() },
    { id:"toolbox", label:"Diagnostic", hash:"#/toolbox", show: ()=> canAccessToolbox() },
    { id:"theme-studio", label:"Theme Studio", hash:"#/theme-studio", show: ()=> canSeeSettings() },
    { id:"settings", label:"Paramètres", hash:"#/settings", show: ()=> canSeeSettings() },
  ];
}
