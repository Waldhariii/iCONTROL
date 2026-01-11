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
};

export function buildMainSystemShell(): MainSystemShell {
  const root = document.createElement("div");

  const header = document.createElement("div");
  header.className = "cxHeader";
  header.innerHTML = `
    <button class="cxBurger" id="cxBurger" aria-label="Menu">
      ☰
    </button>
    <div class="cxBrand">
      <div class="cxBrandDot"></div>
      <div id="cxBrandTitle">iCONTROL</div>
    </div>
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
    sessionHint: drawer.querySelector("#cxSessionHint") as HTMLElement
  };
}
