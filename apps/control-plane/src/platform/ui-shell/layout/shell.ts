import "./shell.css";
import { getSession, isLoggedIn, logout } from "@/localAuth";
import {
  canAccessSettings,
  canAccessBranding,
  canAccessThemeStudio,
  canAccessTenants,
  canAccessProviders,
  canAccessPolicies,
  canAccessSecurity
} from "@/runtime/rbac";
import { hasPermission } from "@/runtime/rbac";
import { buildMainSystemShell } from "@modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.ui";
import { navigate } from "@/router";
// @ts-ignore
import catalog from "@config/ssot/ROUTE_CATALOG.json";

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

function titleize(s: string): string {
  return s
    .replace(/^cp\./, "")
    .replace(/_cp$/, "")
    .replace(/_app$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function isAllowedByPermissions(perms: string[]): boolean {
  if (!perms.length) return true;
  const map: Record<string, () => boolean> = {
    canAccessSettings,
    canAccessBranding,
    canAccessThemeStudio,
    canAccessTenants,
    canAccessProviders,
    canAccessPolicies,
    canAccessSecurity,
  };
  return perms.every((p) => {
    const fn = map[p];
    if (fn) return fn();
    return hasPermission(p);
  });
}

function buildCatalogNavItems(): NavItem[] {
  const kind = (window as any).__ICONTROL_APP_KIND__ || (import.meta as any)?.env?.VITE_APP_KIND;
  const surface = kind === "APP" || kind === "CLIENT_APP" ? "APP" : "CP";
  const routes = (catalog as any)?.routes ?? [];
  const items = routes
    .filter((r: any) => r && r.app_surface === surface)
    .filter((r: any) => ["ACTIVE", "EXPERIMENTAL"].includes(String(r.status || "")))
    .filter((r: any) => typeof r.path === "string" && r.path.startsWith("#/"))
    .filter((r: any) => !String(r.route_id || "").includes("login") && !String(r.route_id || "").includes("notfound") && !String(r.route_id || "").includes("blocked"))
    .map((r: any) => {
      const routeId = String(r.route_id || "");
      const id = routeId.replace(/_cp$/, "").replace(/_app$/, "");
      const label = titleize(routeId || r.path || "");
      const perms = Array.isArray(r.permissions_required) ? r.permissions_required.map(String) : [];
      return {
        id,
        label,
        hash: String(r.path),
        show: () => isLoggedIn() && isAllowedByPermissions(perms),
      } as NavItem;
    });
  // Sort by label for deterministic order
  return items.sort((a: NavItem, b: NavItem) => a.label.localeCompare(b.label));
}

/** Icônes SVG 18×18 par id de navigation (style cohérent) */
const NAV_ICONS: Record<string, string> = {
  dashboard: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"9\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\"/></svg>",
  dossiers: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z\"/></svg>",
  system: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\" ry=\"2\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"9\"/><line x1=\"9\" y1=\"13\" x2=\"15\" y2=\"13\"/><line x1=\"9\" y1=\"17\" x2=\"12\" y2=\"17\"/></svg>",
  logs: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/><line x1=\"10\" y1=\"9\" x2=\"8\" y2=\"9\"/></svg>",
  audit: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M9 11l3 3L22 4\"/><path d=\"M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11\"/></svg>",
  users: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M23 21v-2a4 4 0 00-3-3.87\"/><path d=\"M16 3.13a4 4 0 010 7.75\"/></svg>",
  account: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>",
  developer: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"16 18 22 12 16 6\"/><polyline points=\"8 6 2 12 8 18\"/></svg>",
  verification: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>",
  toolbox: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z\"/></svg>",
  settings: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z\"/></svg>",
  branding: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v6\"/><path d=\"M12 16v6\"/><path d=\"M2 12h6\"/><path d=\"M16 12h6\"/></svg>",
  "theme-studio": "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22a10 10 0 100-20 6 6 0 000 12 2 2 0 110 4z\"/><circle cx=\"7.5\" cy=\"10\" r=\"1\"/><circle cx=\"12\" cy=\"7\" r=\"1\"/><circle cx=\"16.5\" cy=\"10\" r=\"1\"/></svg>",
  tenants: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/></svg>",
  providers: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M3 12h18\"/><path d=\"M6 6h12\"/><path d=\"M6 18h12\"/></svg>",
  policies: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M9 12l2 2 4-4\"/><path d=\"M20 6v6a8 8 0 01-16 0V6\"/></svg>",
  security: "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>",
};

export function createShell(navItems: NavItem[]){
  const shell = buildMainSystemShell();
  const { root, header, drawer, overlay, main, nav, burger, close, logoutLink, sessionHint, headerUser } = shell;

  function renderNav(){
    nav.innerHTML = "";
    const visibleItems = navItems.filter((it) => it.show());
    const ordered = visibleItems.slice().sort((a: NavItem, b: NavItem) => a.label.localeCompare(b.label));

    const renderLink = (it: NavItem) => {
      const a = document.createElement("a");
      a.href = it.hash;
      a.setAttribute("data-hash", it.hash);
      a.addEventListener("click", (e) => {
        const ev = e as MouseEvent;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        e.preventDefault();
        navigate(it.hash);
        closeDrawer();
      });
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
    };

    ordered.forEach(renderLink);

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
  const items = buildCatalogNavItems();
  if (items.length) return items;
  // Fallback minimal (should not be used)
  return [
    { id:"dashboard", label:"Tableau de bord", hash:"#/dashboard", show: ()=> true },
  ];
}
