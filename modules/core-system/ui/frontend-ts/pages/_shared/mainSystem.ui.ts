// @ts-nocheck
export type MainSystemShell = {
  root: HTMLElement;
  header: HTMLElement;
  drawer: HTMLElement;
  overlay: HTMLElement;
  main: HTMLElement;
  nav: HTMLElement;
  burger: HTMLButtonElement;
  close: HTMLButtonElement;
  logoutLink: HTMLAnchorElement;
  sessionHint: HTMLElement;
  headerUser: HTMLElement;
};

export function buildMainSystemShell(): MainSystemShell {
  const root = document.createElement("div");

  const header = document.createElement("header");
  header.className = "cxHeader";
  header.setAttribute("role", "banner");
  header.innerHTML = `
    <button class="cxBurger" id="cxBurger" aria-label="Ouvrir le menu">
      ☰
    </button>
    <div class="cxBrand">
      <div class="cxBrandDot"></div>
      <div id="cxBrandTitle">iCONTROL</div>
    </div>
    <div class="cxUserZone" id="cxHeaderUser">—</div>
  `;

  const overlay = document.createElement("div");
  overlay.className = "cxDrawerOverlay";
  overlay.id = "cxDrawerOverlay";

  const drawer = document.createElement("div");
  drawer.className = "cxDrawer";
  drawer.id = "cxDrawer";
  drawer.innerHTML = `
    <div class="cxDrawerTop">
      <div class="cxDrawerTitle">Navigation</div>
      <button class="cxClose" id="cxClose" aria-label="Fermer le menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <nav class="cxNav" id="cxNav" role="navigation"></nav>
    <div style="margin-top:14px; border-top:1px solid var(--line); padding-top:12px;">
      <a href="#/login" id="cxLogoutLink" style="display:none;">Déconnexion</a>
      <small id="cxSessionHint"></small>
    </div>
  `;

  const main = document.createElement("main");
  main.className = "cxMain";
  main.id = "cxMain";
  main.setAttribute("role", "main");
  /* Placeholder jusqu'au premier renderRoute (évite flash de zone vide). */
  main.innerHTML = '<div class="icontrol-loading" aria-live="polite" style="padding:24px;opacity:0.9;font-size:14px;color:var(--muted,#a7b0b7);">Chargement…</div>';

  root.appendChild(header);
  root.appendChild(overlay);
  root.appendChild(drawer);
  root.appendChild(main);

  return {
    root,
    header,
    drawer,
    overlay,
    main,
    nav: drawer.querySelector("#cxNav") as HTMLElement,
    burger: header.querySelector("#cxBurger") as HTMLButtonElement,
    close: drawer.querySelector("#cxClose") as HTMLButtonElement,
    logoutLink: drawer.querySelector("#cxLogoutLink") as HTMLAnchorElement,
    sessionHint: drawer.querySelector("#cxSessionHint") as HTMLElement,
    headerUser: header.querySelector("#cxHeaderUser") as HTMLElement
  };
}
