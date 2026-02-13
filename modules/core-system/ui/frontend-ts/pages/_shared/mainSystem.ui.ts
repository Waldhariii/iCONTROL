// @ts-nocheck
export type MainSystemShell = {
  root: HTMLElement;
  header: HTMLElement;
  body: HTMLElement;
  drawer: HTMLElement;
  overlay: HTMLElement;
  main: HTMLElement;
  nav: HTMLElement;
  burger: HTMLButtonElement;
  close: HTMLButtonElement;
  modeToggle: HTMLButtonElement;
  logoutLink: HTMLAnchorElement;
  sessionHint: HTMLElement;
  headerUser: HTMLElement;
  avatar: HTMLButtonElement;
};

export function buildMainSystemShell(): MainSystemShell {
  const root = document.createElement("div");
  root.className = "cxShell";

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
    <button class="cxAvatar" id="cxAvatar" aria-label="Compte"></button>
  `;

  const overlay = document.createElement("div");
  overlay.className = "cxDrawerOverlay";
  overlay.id = "cxDrawerOverlay";

  const drawer = document.createElement("div");
  drawer.className = "cxDrawer";
  drawer.id = "cxDrawer";
  drawer.innerHTML = `
    <div class="cxDrawerTop">
      <div class="cxDrawerTitle"></div>
      <div class="cxDrawerActions">
        <button class="cxClose" id="cxClose" aria-label="Réduire le menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <button class="cxModeToggle" id="cxModeToggle" aria-label="Basculer mode navigation"></button>
      </div>
    </div>
    <nav class="cxNav" id="cxNav" role="navigation"></nav>
    <div class="cxDrawerFooter">
      <a href="#/login" id="cxLogoutLink" class="cxLogoutLink">
        <span class="cxLogoutIcon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </span>
        <span class="cxLogoutLabel">Déconnexion</span>
      </a>
      <small id="cxSessionHint" class="cxSessionHint"></small>
    </div>
  `;

  const main = document.createElement("main");
  main.className = "cxMain";
  main.id = "cxMain";
  main.setAttribute("role", "main");
  /* Placeholder jusqu'au premier renderRoute (évite flash de zone vide). */
  main.innerHTML = '<div class="icontrol-loading" aria-live="polite" style="padding:24px;opacity:0.9;font-size:14px;color:var(--muted,#a7b0b7);">Chargement…</div>';

  const body = document.createElement("div");
  body.className = "cxBody";
  body.appendChild(drawer);
  body.appendChild(main);

  root.appendChild(header);
  root.appendChild(overlay);
  root.appendChild(body);

  return {
    root,
    header,
    body,
    drawer,
    overlay,
    main,
    nav: drawer.querySelector("#cxNav") as HTMLElement,
    burger: header.querySelector("#cxBurger") as HTMLButtonElement,
    close: drawer.querySelector("#cxClose") as HTMLButtonElement,
    modeToggle: drawer.querySelector("#cxModeToggle") as HTMLButtonElement,
    logoutLink: drawer.querySelector("#cxLogoutLink") as HTMLAnchorElement,
    sessionHint: drawer.querySelector("#cxSessionHint") as HTMLElement,
    headerUser: header.querySelector("#cxHeaderUser") as HTMLElement,
    avatar: header.querySelector("#cxAvatar") as HTMLButtonElement
  };
}
