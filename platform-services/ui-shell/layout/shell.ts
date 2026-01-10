import "./shell.css";
import { getSession, isLoggedIn, logout } from "../../../app/src/localAuth";
import { canSeeSettings } from "../../../app/src/runtime/rbac";

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
  const root = document.createElement("div");

  const header = document.createElement("div");
  header.className = "cxHeader";
  header.innerHTML = `
    <div class="cxBrand">
      <div class="cxBrandDot"></div>
      <div id="cxBrandTitle">iCONTROL</div>
    </div>
    <button class="cxBurger" id="cxBurger" aria-label="Menu">
      ☰
    </button>
  `;

  const overlay = document.createElement("div");
  overlay.className = "cxDrawerOverlay";
  overlay.id = "cxDrawerOverlay";

  const drawer = document.createElement("div");
  drawer.className = "cxDrawer";
  drawer.id = "cxDrawer";
  drawer.innerHTML = `
    <div class="cxDrawerTop">
      <div class="cxDrawerTitle">MENU</div>
      <button class="cxClose" id="cxClose" aria-label="Fermer">X</button>
    </div>
    <div class="cxNav" id="cxNav"></div>
    <div style="margin-top:14px; border-top:1px solid var(--line); padding-top:12px;">
      <a href="#/login" id="cxLogoutLink" style="display:none;">Déconnexion</a>
      <small id="cxSessionHint"></small>
    </div>
  `;

  const main = document.createElement("div");
  main.className = "cxMain";
  main.id = "cxMain";

  root.appendChild(header);
  root.appendChild(overlay);
  root.appendChild(drawer);
  root.appendChild(main);

  const nav = drawer.querySelector("#cxNav") as HTMLElement;

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

    const logoutLink = drawer.querySelector("#cxLogoutLink") as HTMLAnchorElement;
    const hint = drawer.querySelector("#cxSessionHint") as HTMLElement;

    if(isLoggedIn()){
      logoutLink.style.display = "inline-block";
      logoutLink.onclick = (e)=>{
        e.preventDefault();
        logout();
        window.location.hash = "#/login";
        closeDrawer();
      };
      const s = getSession() as any;
      hint.textContent = `Connecté: ${String(s?.username||"user")} • Rôle: ${String(s?.role||"USER")}`;
    } else {
      logoutLink.style.display = "none";
      hint.textContent = "Non connecté";
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

  (header.querySelector("#cxBurger") as HTMLButtonElement).onclick = openDrawer;
  (drawer.querySelector("#cxClose") as HTMLButtonElement).onclick = closeDrawer;
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
    /* ICONTROL_NAV_MAIN_SYSTEM_V1 */
    { id:"users", label:"Utilisateurs", hash:"#/users", show: ()=> isLoggedIn() },
    { id:"account", label:"Compte", hash:"#/account", show: ()=> isLoggedIn() },
    { id:"developer", label:"Développeur", hash:"#/developer", show: ()=> isLoggedIn() },
    { id:"verification", label:"Vérification", hash:"#/verification", show: ()=> isLoggedIn() },
    { id:"settings", label:"Paramètres", hash:"#/settings", show: ()=> canSeeSettings() },
  ];
}
