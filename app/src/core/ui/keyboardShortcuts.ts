/**
 * ICONTROL_KEYBOARD_SHORTCUTS_V1
 * Raccourcis clavier pour power users
 */
export type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  handler: ShortcutHandler;
  description: string;
  enabled?: () => boolean;
}

const shortcuts: ShortcutConfig[] = [];

let isEnabled = true;

export function registerShortcut(config: ShortcutConfig): void {
  shortcuts.push(config);
}

export function enableShortcuts(): void {
  isEnabled = true;
}

export function disableShortcuts(): void {
  isEnabled = false;
}

export function initKeyboardShortcuts(): void {
  document.addEventListener("keydown", (e) => {
    if (!isEnabled) return;
    
    // Ignorer si on est dans un input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      // Permettre ESC et quelques autres
      if (e.key !== "Escape" && e.key !== "Enter") return;
    }
    
    // Ignorer si Ctrl/Cmd est pressé (sauf pour certains raccourcis)
    if ((e.ctrlKey || e.metaKey) && !["/", "r", "e"].includes(e.key.toLowerCase())) {
      return;
    }
    
    const key = e.key.toLowerCase();
    
    // Raccourcis globaux
    switch (key) {
      case "/":
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="recherche" i], input[placeholder*="search" i]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        break;
        
      case "r":
        if (e.ctrlKey || e.metaKey) return; // Laisser Ctrl+R pour refresh navigateur
        e.preventDefault();
        const refreshBtn = document.querySelector<HTMLButtonElement>('button[data-action="refresh"], button:has-text("Rafraîchir"), button:has-text("Refresh")');
        if (refreshBtn && !refreshBtn.disabled) {
          refreshBtn.click();
        } else {
          location.reload();
        }
        break;
        
      case "e":
        e.preventDefault();
        const exportBtn = document.querySelector<HTMLButtonElement>('button[data-action="export"], button:has-text("Exporter"), button:has-text("Export")');
        if (exportBtn && !exportBtn.disabled) {
          exportBtn.click();
        }
        break;
        
      case "?":
        e.preventDefault();
        showShortcutsHelp();
        break;
    }
    
    // Raccourcis enregistrés
    shortcuts.forEach(shortcut => {
      if (shortcut.key.toLowerCase() === key) {
        if (!shortcut.enabled || shortcut.enabled()) {
          e.preventDefault();
          shortcut.handler();
        }
      }
    });
  });
}

function showShortcutsHelp(): void {
  const overlay = document.createElement("div");
  overlay.style.minWidth = "0";
  overlay.style.boxSizing = "border-box";
  overlay.setAttribute("style", `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `);
  
  const modal = document.createElement("div");
  modal.setAttribute("style", `
    background: #1e1e1e;
    border: 1px solid #3e3e3e;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  `);
  
  const globalShortcuts = [
    { key: "/", desc: "Focus sur la recherche" },
    { key: "R", desc: "Rafraîchir la page" },
    { key: "E", desc: "Exporter les données" },
    { key: "?", desc: "Afficher cette aide" },
  ];
  
  modal.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 18px; font-weight: 700;">
      Raccourcis clavier
    </h2>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${globalShortcuts.map(s => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
          <span style="color: #858585; font-size: 13px;">${s.desc}</span>
          <kbd style="padding: 4px 8px; background: #2b2b2b; border: 1px solid #3e3e3e; border-radius: 4px; font-family: monospace; font-size: 12px; color: #d4d4d4;">${s.key}</kbd>
        </div>
      `).join("")}
      ${shortcuts.length > 0 ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #3e3e3e;">
          <div style="color: #858585; font-size: 12px; margin-bottom: 12px; font-weight: 600;">Raccourcis spécifiques à la page</div>
          ${shortcuts.map(s => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px;">
              <span style="color: #858585; font-size: 13px;">${s.description}</span>
              <kbd style="padding: 4px 8px; background: #2b2b2b; border: 1px solid #3e3e3e; border-radius: 4px; font-family: monospace; font-size: 12px; color: #d4d4d4;">${s.key}</kbd>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
    <button id="closeShortcutsHelp" style="margin-top: 20px; width: 100%; padding: 10px; background: #37373d; color: white; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer; font-weight: 600;">
      Fermer
    </button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const closeBtn = modal.querySelector("#closeShortcutsHelp") as HTMLButtonElement;
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
}

// Initialiser au chargement
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKeyboardShortcuts);
  } else {
    initKeyboardShortcuts();
  }
}
