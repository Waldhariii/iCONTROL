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
      <img id="cxBrandLogo" data-brand-logo style="max-height: 32px; max-width: 150px; object-fit: contain; display: none;" alt="Logo" />
      <div class="cxBrandDot"></div>
      <div id="cxBrandTitle">iCONTROL</div>
    </div>
    <div class="cxHeaderContext" id="cxHeaderContext"></div>
  `;

  const overlay = document.createElement("div");
  overlay.className = "cxDrawerOverlay";
  overlay.id = "cxDrawerOverlay";

  const drawer = document.createElement("div");
  drawer.className = "cxDrawer";
  drawer.id = "cxDrawer";
  drawer.innerHTML = `
    <div class="cxDrawerTop">
      <div class="cxDrawerLogo" style="display:flex;align-items:center;justify-content:center;padding:12px 0;">
        <img id="cxDrawerLogoImg" data-brand-logo style="max-height: 40px; max-width: 180px; object-fit: contain; display: none;" alt="Logo" />
        <div id="cxDrawerLogoText" style="font-weight:800;letter-spacing:.2px;">iCONTROL</div>
      </div>
      <button class="cxClose" id="cxClose" aria-label="Fermer">X</button>
      <div style="height:1px;background:var(--line);margin:8px 0;"></div>
    </div>
    <div class="cxNav" id="cxNav"></div>
    <div class="cxDrawerBottom" style="margin-top:auto;">
      <div style="border-top:1px solid var(--line);padding:12px 0;">
        <div id="cxUserInfo" style="display:none;padding:0 8px 12px;">
          <div id="cxUserFullname" style="font-weight:600;color:var(--text);margin-bottom:4px;"></div>
          <div id="cxUserRole" style="font-size:12px;color:var(--muted);margin-bottom:4px;"></div>
          <div id="cxUserCompany" style="font-size:12px;color:var(--muted);"></div>
        </div>
        <div style="border-top:1px solid var(--line);padding-top:12px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div id="cxUserAvatar" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:16px;flex-shrink:0;cursor:pointer;" onclick="window.__navigateToAccount?.()"></div>
            <a href="#/login" id="cxLogoutLink" style="flex:1;text-align:center;display:none;color:var(--text);text-decoration:none;padding:8px;border-radius:8px;transition:background 0.2s;">Déconnexion</a>
            <a href="#/settings" id="cxSettingsLink" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;color:var(--text);text-decoration:none;transition:background 0.2s;flex-shrink:0;" title="Paramètres">
              <span style="font-size:20px;">⚙️</span>
            </a>
          </div>
        </div>
      </div>
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
