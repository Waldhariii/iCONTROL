/**
 * ICONTROL_TOOLBOX_WINDOW_V3
 * Fenêtre Developer Toolbox professionnelle avec panneaux multiples
 * Architecture inspirée des meilleures pratiques de développement
 */

const STORAGE_KEY = "icontrol_toolbox_window_size";
const STORAGE_LAYOUT_KEY = "icontrol_toolbox_layout";

interface WindowSize {
  width: number;
  height: number;
  left?: number;
  top?: number;
}

interface LayoutState {
  sidebarWidth: number;
  activeTab: string;
  panelLayout: "grid" | "single";
}

function getSavedWindowSize(): WindowSize | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveWindowSize(size: WindowSize): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
  } catch {}
}

function getSavedLayout(): LayoutState | null {
  try {
    const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveLayout(layout: LayoutState): void {
  try {
    localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(layout));
  } catch {}
}

export function openToolboxWindow(): void {
  const savedSize = getSavedWindowSize();
  // Responsive sizing: fullscreen on mobile, windowed on desktop
  const isMobile = window.innerWidth < 768;
  const defaultWidth = isMobile ? screen.width : (savedSize?.width || 1800);
  const defaultHeight = isMobile ? screen.height : (savedSize?.height || 1100);
  const defaultLeft = isMobile ? 0 : (savedSize?.left || (screen.width - defaultWidth) / 2);
  const defaultTop = isMobile ? 0 : (savedSize?.top || (screen.height - defaultHeight) / 2);
  
  const popup = window.open(
    window.location.href,
    "icontrol-toolbox",
    `width=${defaultWidth},height=${defaultHeight},left=${defaultLeft},top=${defaultTop},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
  );
  
  if (!popup) {
    // Popup bloquée, retour silencieux (pas de message d'alerte)
    return;
  }
  
  // Script de sauvegarde des dimensions
  const saveSizeScript = `
    (function() {
      let resizeTimeout = null;
      function saveSize() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          try {
            const size = {
              width: window.outerWidth,
              height: window.outerHeight,
              left: window.screenX,
              top: window.screenY
            };
            localStorage.setItem('${STORAGE_KEY}', JSON.stringify(size));
          } catch (e) {}
        }, 500);
      }
      window.addEventListener('resize', saveSize);
      window.addEventListener('beforeunload', saveSize);
      let moveTimeout = null;
      window.addEventListener('move', () => {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(saveSize, 500);
      });
    })();
  `;
  
  const checkReady = setInterval(() => {
    try {
      if (popup.document.readyState === "complete" && popup.document.body) {
        clearInterval(checkReady);
        if (!popup.document.getElementById('icontrol-size-saver')) {
          const script = popup.document.createElement('script');
          script.id = 'icontrol-size-saver';
          script.textContent = saveSizeScript;
          popup.document.head.appendChild(script);
        }
        setTimeout(() => setupProfessionalToolbox(popup), 500);
      }
    } catch (e) {}
  }, 100);
  
  setTimeout(() => {
    clearInterval(checkReady);
    try {
      if (popup.document.readyState === "complete") {
        if (!popup.document.getElementById('icontrol-size-saver')) {
          const script = popup.document.createElement('script');
          script.id = 'icontrol-size-saver';
          script.textContent = saveSizeScript;
          popup.document.head.appendChild(script);
        }
        setupProfessionalToolbox(popup);
      }
    } catch (e) {
      console.warn("Impossible d'accéder au document de la popup:", e);
    }
  }, 5000);
}

function setupProfessionalToolbox(popup: Window): void {
  try {
    const doc = popup.document;
    const savedLayout = getSavedLayout();
    const sidebarWidth = savedLayout?.sidebarWidth || 280;
    const activeTab = savedLayout?.activeTab || "api";
    
    // Styles complets
    const style = doc.createElement("style");
    style.id = "icontrol-toolbox-styles";
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        margin: 0; 
        padding: 0; 
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background: #0f1112;
        color: #d4d4d4;
      }
      #icontrol-toolbox-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
      #icontrol-toolbox-sidebar {
        width: ${sidebarWidth}px;
        min-width: 240px;
        max-width: 400px;
        background: #1e1e1e;
        border-right: 1px solid #3e3e3e;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: horizontal;
      }
      /* ICONTROL_RESPONSIVE_TOOLBOX_V1: Responsive toolbox for mobile */
      @media (max-width: 767px) {
        #icontrol-toolbox-container {
          flex-direction: column;
        }
        #icontrol-toolbox-sidebar {
          width: 100%;
          max-width: 100%;
          min-width: 100%;
          border-right: none;
          border-bottom: 1px solid #3e3e3e;
          max-height: 40vh;
          resize: vertical;
        }
        #icontrol-toolbox-main {
          flex: 1;
          min-height: 60vh;
        }
        #icontrol-toolbox-topbar {
          flex-wrap: wrap;
          gap: 4px;
        }
        .icontrol-topbar-tab {
          font-size: 11px;
          padding: 6px 8px;
        }
        .icontrol-toolbox-panel {
          min-height: auto;
        }
      }
      #icontrol-toolbox-sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #3e3e3e;
        background: #252526;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #icontrol-toolbox-sidebar-title {
        font-size: 16px;
        font-weight: 700;
        color: #d4d4d4;
      }
      #icontrol-toolbox-sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      .icontrol-sidebar-section {
        margin-bottom: 24px;
      }
      .icontrol-sidebar-section-title {
        font-size: 11px;
        font-weight: 600;
        color: #858585;
        text-transform: uppercase;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }
      .icontrol-sidebar-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        color: #d4d4d4;
        font-size: 13px;
        transition: background 0.2s;
      }
      .icontrol-sidebar-item:hover {
        background: rgba(255,255,255,0.05);
      }
      .icontrol-sidebar-item.active {
        background: rgba(78,201,176,0.15);
        color: #4ec9b0;
      }
      .icontrol-sidebar-checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid #3e3e3e;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .icontrol-sidebar-checkbox.checked {
        background: #4ec9b0;
        border-color: #4ec9b0;
      }
      .icontrol-sidebar-checkbox.checked::after {
        content: "✓";
        color: #1e1e1e;
        font-size: 12px;
        font-weight: bold;
      }
      .icontrol-shortcut {
        margin-left: auto;
        font-size: 11px;
        color: #858585;
        font-family: monospace;
      }
      #icontrol-toolbox-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #0f1112;
      }
      #icontrol-toolbox-topbar {
        height: 50px;
        background: #252526;
        border-bottom: 1px solid #3e3e3e;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 8px;
      }
      #icontrol-toolbox-topbar-title {
        font-size: 18px;
        font-weight: 700;
        color: #d4d4d4;
        margin-right: 24px;
      }
      .icontrol-topbar-tab {
        padding: 8px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #858585;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .icontrol-topbar-tab:hover {
        color: #d4d4d4;
        background: rgba(255,255,255,0.05);
      }
      .icontrol-topbar-tab.active {
        color: #4ec9b0;
        border-bottom-color: #4ec9b0;
      }
      #icontrol-toolbox-panels {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 1px;
        background: #3e3e3e;
        padding: 1px;
        overflow: hidden;
      }
      .icontrol-toolbox-panel {
        background: #1e1e1e;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .icontrol-panel-header {
        padding: 12px 16px;
        background: #252526;
        border-bottom: 1px solid #3e3e3e;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .icontrol-panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #d4d4d4;
      }
      .icontrol-panel-content {
        flex: 1;
        overflow: auto;
        padding: 16px;
      }
      .icontrol-api-request {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .icontrol-api-method {
        padding: 8px 12px;
        background: #37373d;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        color: #d4d4d4;
        font-size: 13px;
        min-width: 80px;
      }
      .icontrol-api-url {
        flex: 1;
        padding: 8px 12px;
        background: #252526;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        color: #d4d4d4;
        font-size: 13px;
        font-family: monospace;
      }
      .icontrol-api-send {
        padding: 8px 20px;
        background: #4ec9b0;
        border: none;
        border-radius: 6px;
        color: #1e1e1e;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
      }
      .icontrol-api-send:hover {
        background: #45b8a0;
      }
      .icontrol-api-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid #3e3e3e;
        margin-bottom: 12px;
      }
      .icontrol-api-tab {
        padding: 8px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #858585;
        cursor: pointer;
        font-size: 12px;
      }
      .icontrol-api-tab.active {
        color: #4ec9b0;
        border-bottom-color: #4ec9b0;
      }
      .icontrol-api-response {
        background: #252526;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        padding: 12px;
        font-family: monospace;
        font-size: 12px;
        color: #d4d4d4;
        white-space: pre-wrap;
        max-height: 300px;
        overflow: auto;
      }
      .icontrol-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      .icontrol-status-ok {
        background: rgba(78,201,176,0.15);
        color: #4ec9b0;
      }
      .icontrol-logs-filter {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .icontrol-logs-filter select {
        padding: 6px 10px;
        background: #252526;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        color: #d4d4d4;
        font-size: 12px;
      }
      .icontrol-logs-entry {
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        font-size: 12px;
        font-family: monospace;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .icontrol-logs-entry:hover {
        background: rgba(255,255,255,0.02);
      }
      .icontrol-network-graph {
        height: 150px;
        background: #252526;
        border: 1px solid #3e3e3e;
        border-radius: 6px;
        margin-bottom: 12px;
        position: relative;
      }
      .icontrol-network-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .icontrol-network-table th,
      .icontrol-network-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .icontrol-network-table th {
        color: #858585;
        font-weight: 600;
      }
      .icontrol-registry-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid #3e3e3e;
        margin-bottom: 12px;
      }
      .icontrol-registry-tab {
        padding: 8px 16px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #858585;
        cursor: pointer;
        font-size: 12px;
      }
      .icontrol-registry-tab.active {
        color: #4ec9b0;
        border-bottom-color: #4ec9b0;
      }
    `;
    if (!doc.getElementById("icontrol-toolbox-styles")) {
      doc.head.appendChild(style);
    }
    
    // Structure principale
    if (!doc.getElementById("icontrol-toolbox-container")) {
      doc.body.innerHTML = "";
      
      const container = doc.createElement("div");
      container.id = "icontrol-toolbox-container";
      container.style.minWidth = "0";
      container.style.boxSizing = "border-box";
      
      // Sidebar gauche
      const sidebar = doc.createElement("div");
      sidebar.id = "icontrol-toolbox-sidebar";
      
      const sidebarHeader = doc.createElement("div");
      sidebarHeader.id = "icontrol-toolbox-sidebar-header";
      sidebarHeader.innerHTML = `
        <div id="icontrol-toolbox-sidebar-title">🔧 Developer Toolbox</div>
        <button id="icontrol-close-toolbox" style="background:transparent;border:none;color:#858585;cursor:pointer;font-size:18px;padding:4px 8px;">✕</button>
      `;
      
      const sidebarContent = doc.createElement("div");
      sidebarContent.id = "icontrol-toolbox-sidebar-content";
      
      // Section Resources
      const resourcesSection = doc.createElement("div");
      resourcesSection.className = "icontrol-sidebar-section";
      resourcesSection.innerHTML = `
        <div class="icontrol-sidebar-section-title">Resources</div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox checked"></div>
          <span>Variables</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Tokens & Keys</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Settings</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Cache & Storage</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Modules & Routes</span>
        </div>
      `;
      
      // Section Actions
      const actionsSection = doc.createElement("div");
      actionsSection.className = "icontrol-sidebar-section";
      actionsSection.innerHTML = `
        <div class="icontrol-sidebar-section-title">Actions</div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox checked"></div>
          <span>Playground</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Trigger Action</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox checked"></div>
          <span>Simulate Role</span>
        </div>
        <div class="icontrol-sidebar-item">
          <div class="icontrol-sidebar-checkbox"></div>
          <span>Data Export</span>
        </div>
      `;
      
      // Section Shortcuts
      const shortcutsSection = doc.createElement("div");
      shortcutsSection.className = "icontrol-sidebar-section";
      shortcutsSection.innerHTML = `
        <div class="icontrol-sidebar-section-title">Shortcuts</div>
        <div class="icontrol-sidebar-item">
          <span>Export registry</span>
          <span class="icontrol-shortcut">Ctrl+Shift+E</span>
        </div>
        <div class="icontrol-sidebar-item">
          <span>Trigger action</span>
          <span class="icontrol-shortcut">Ctrl+Shift+C</span>
        </div>
        <div class="icontrol-sidebar-item">
          <span>Play role simulation</span>
          <span class="icontrol-shortcut">Ctrl+Shift+P</span>
        </div>
      `;
      
      sidebarContent.appendChild(resourcesSection);
      sidebarContent.appendChild(actionsSection);
      sidebarContent.appendChild(shortcutsSection);
      
      sidebar.appendChild(sidebarHeader);
      sidebar.appendChild(sidebarContent);
      
      // Zone principale
      const main = doc.createElement("div");
      main.id = "icontrol-toolbox-main";
      
      // Topbar avec onglets
      const topbar = doc.createElement("div");
      topbar.id = "icontrol-toolbox-topbar";
      topbar.innerHTML = `
        <div id="icontrol-toolbox-topbar-title">Developer Toolbox</div>
        <button class="icontrol-topbar-tab ${activeTab === "console" ? "active" : ""}" data-tab="console">
          <span>💻</span> Console
        </button>
        <button class="icontrol-topbar-tab ${activeTab === "api" ? "active" : ""}" data-tab="api">
          <span>🔌</span> API
        </button>
        <button class="icontrol-topbar-tab ${activeTab === "network" ? "active" : ""}" data-tab="network">
          <span>🌐</span> Network
        </button>
        <button class="icontrol-topbar-tab ${activeTab === "logs" ? "active" : ""}" data-tab="logs">
          <span>📋</span> Logs
        </button>
        <button class="icontrol-topbar-tab ${activeTab === "monitoring" ? "active" : ""}" data-tab="monitoring">
          <span>📊</span> Monitoring
        </button>
        <button class="icontrol-topbar-tab ${activeTab === "registry" ? "active" : ""}" data-tab="registry">
          <span>🗄️</span> Registry
        </button>
      `;
      
      // Panneaux en grille
      const panels = doc.createElement("div");
      panels.id = "icontrol-toolbox-panels";
      
      // Panel API Testing (haut gauche)
      const apiPanel = doc.createElement("div");
      apiPanel.className = "icontrol-toolbox-panel";
      apiPanel.id = "panel-api";
      apiPanel.style.display = activeTab === "api" ? "flex" : "none";
      apiPanel.innerHTML = `
        <div class="icontrol-panel-header">
          <div class="icontrol-panel-title">API Testing</div>
        </div>
        <div class="icontrol-panel-content">
          <div class="icontrol-api-request">
            <select class="icontrol-api-method">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input type="text" class="icontrol-api-url" value="/api/resources" placeholder="/api/endpoint" />
            <button class="icontrol-api-send">Send</button>
          </div>
          <div class="icontrol-api-tabs">
            <button class="icontrol-api-tab active">Headers</button>
            <button class="icontrol-api-tab">Body</button>
            <button class="icontrol-api-tab">Run</button>
          </div>
          <div style="margin-bottom:12px;">
            <span class="icontrol-status-badge icontrol-status-ok">
              <span>✓</span> Status 200 OK 66µs
            </span>
          </div>
          <div class="icontrol-api-response" id="api-response">{
  "status": "ok",
  "data": []
}</div>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button style="padding:6px 12px;background:#37373d;border:1px solid #3e3e3e;border-radius:6px;color:#d4d4d4;cursor:pointer;font-size:12px;">Format JSON</button>
            <button style="padding:6px 12px;background:#37373d;border:1px solid #3e3e3e;border-radius:6px;color:#d4d4d4;cursor:pointer;font-size:12px;">Highlight</button>
            <button style="padding:6px 12px;background:#37373d;border:1px solid #3e3e3e;border-radius:6px;color:#d4d4d4;cursor:pointer;font-size:12px;">Copy</button>
          </div>
        </div>
      `;
      
      // Panel Logs (haut droite)
      const logsPanel = doc.createElement("div");
      logsPanel.className = "icontrol-toolbox-panel";
      logsPanel.id = "panel-logs";
      logsPanel.innerHTML = `
        <div class="icontrol-panel-header">
          <div class="icontrol-panel-title">Logs</div>
          <span class="icontrol-status-badge" style="background:rgba(220,220,170,0.15);color:#dcdcaa;">SAFE_MODE</span>
        </div>
        <div class="icontrol-panel-content">
          <div class="icontrol-logs-filter">
            <select>
              <option>Module: All</option>
              <option>CORE_SYSTEM</option>
              <option>API</option>
            </select>
            <select>
              <option>Severity: All</option>
              <option>INFO</option>
              <option>WARN</option>
              <option>ERR</option>
            </select>
            <input type="text" placeholder="06:02:24" style="padding:6px 10px;background:#252526;border:1px solid #3e3e3e;border-radius:6px;color:#d4d4d4;font-size:12px;width:100px;" />
          </div>
          <div id="logs-entries">
            <div class="icontrol-logs-entry">
              <span style="color:#4ec9b0;">[INFO]</span>
              <span>API request completed /api/resources</span>
              <span style="margin-left:auto;color:#858585;font-size:11px;">20%</span>
            </div>
            <div class="icontrol-logs-entry">
              <span style="color:#dcdcaa;">[WARN]</span>
              <span>CORE_SYSTEM Module loaded successfully</span>
              <span style="margin-left:auto;color:#858585;font-size:11px;">15%</span>
            </div>
            <div class="icontrol-logs-entry">
              <span style="color:#4ec9b0;">[INFO]</span>
              <span>API request completed: success</span>
              <span style="margin-left:auto;color:#858585;font-size:11px;">12%</span>
            </div>
          </div>
        </div>
      `;
      
      // Panel Network Activity (bas gauche)
      const networkPanel = doc.createElement("div");
      networkPanel.className = "icontrol-toolbox-panel";
      networkPanel.id = "panel-network";
      networkPanel.innerHTML = `
        <div class="icontrol-panel-header">
          <div class="icontrol-panel-title">Network Activity</div>
        </div>
        <div class="icontrol-panel-content">
          <div style="margin-bottom:12px;color:#858585;font-size:12px;">Latency performance metrics</div>
          <div class="icontrol-network-graph" id="network-graph"></div>
          <table class="icontrol-network-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>/api/resources</td>
                <td>XHR</td>
                <td style="color:#4ec9b0;">200</td>
                <td>180ms</td>
              </tr>
              <tr>
                <td>system/info</td>
                <td>XHR</td>
                <td style="color:#4ec9b0;">200</td>
                <td>266ms</td>
              </tr>
              <tr>
                <td>/modules/init</td>
                <td>Other</td>
                <td style="color:#4ec9b0;">200</td>
                <td>145ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      // Panel Registry viewer (bas droite)
      const registryPanel = doc.createElement("div");
      registryPanel.className = "icontrol-toolbox-panel";
      registryPanel.id = "panel-registry";
      registryPanel.innerHTML = `
        <div class="icontrol-panel-header">
          <div class="icontrol-panel-title">Registry viewer</div>
        </div>
        <div class="icontrol-panel-content">
          <div style="margin-bottom:12px;color:#858585;font-size:12px;">CORE_SYSTEM modules and contracts</div>
          <div class="icontrol-registry-tabs">
            <button class="icontrol-registry-tab active">ROLE</button>
            <button class="icontrol-registry-tab">TableDef</button>
            <button class="icontrol-registry-tab">FormDef</button>
            <button class="icontrol-registry-tab">Routes</button>
            <button class="icontrol-registry-tab">Tools</button>
          </div>
          <table class="icontrol-network-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Key</th>
                <th>Label</th>
                <th>Rules</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NOROITE</td>
                <td>EP</td>
                <td>Columns</td>
                <td>visibleForRole</td>
              </tr>
              <tr>
                <td>actbims</td>
                <td>ες</td>
                <td>action</td>
                <td>visibleForRole</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      panels.appendChild(apiPanel);
      panels.appendChild(logsPanel);
      panels.appendChild(networkPanel);
      panels.appendChild(registryPanel);
      
      main.appendChild(topbar);
      main.appendChild(panels);
      
      container.appendChild(sidebar);
      container.appendChild(main);
      doc.body.appendChild(container);
      
      // Gérer les onglets de la topbar - tous les panneaux restent visibles, onglet = focus
      topbar.querySelectorAll(".icontrol-topbar-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          const tabId = tab.getAttribute("data-tab");
          topbar.querySelectorAll(".icontrol-topbar-tab").forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          
          // Tous les panneaux restent visibles, l'onglet sélectionné met juste en évidence
          // Les 4 panneaux sont toujours affichés en grille 2x2
          saveLayout({ sidebarWidth, activeTab: tabId || "api", panelLayout: "grid" });
        });
      });
      
      // Tous les panneaux sont visibles par défaut en grille 2x2
      panels.querySelectorAll(".icontrol-toolbox-panel").forEach(panel => {
        panel.style.display = "flex";
      });
      
      // Gérer le redimensionnement de la sidebar
      let resizeTimeout: number | null = null;
      const observer = new MutationObserver(() => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          const newWidth = sidebar.offsetWidth;
          saveLayout({ sidebarWidth: newWidth, activeTab, panelLayout: "grid" });
        }, 500);
      });
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      
      // Bouton fermer
      const closeBtn = sidebarHeader.querySelector("#icontrol-close-toolbox");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          popup.close();
        });
      }
      
      // Gérer les checkboxes de la sidebar
      sidebarContent.querySelectorAll(".icontrol-sidebar-checkbox").forEach(checkbox => {
        checkbox.addEventListener("click", (e) => {
          e.stopPropagation();
          checkbox.classList.toggle("checked");
        });
      });
      
      // Intégrer les outils existants dans les panneaux
      setTimeout(() => {
        try {
          // Charger et intégrer les logs
          import("../../../../modules/core-system/ui/frontend-ts/pages/logs/sections/audit-log").then(module => {
            const logsContent = doc.getElementById("logs-entries");
            if (logsContent) {
              const logsContainer = doc.createElement("div");
              module.renderLogsAudit(logsContainer);
              logsContent.innerHTML = "";
              logsContent.appendChild(logsContainer);
            }
          }).catch(() => {});
          
          // Charger et intégrer le registry viewer
          import("../../../../modules/core-system/ui/frontend-ts/pages/developer/sections/registry-viewer").then(module => {
            const registryContent = doc.querySelector("#panel-registry .icontrol-panel-content");
            if (registryContent) {
              const registryContainer = doc.createElement("div");
              module.render_registry_viewer(registryContainer);
              // Intégrer le contenu dans le panneau
              const existingTable = registryContent.querySelector("table");
              if (existingTable && registryContainer.querySelector("table")) {
                existingTable.replaceWith(registryContainer.querySelector("table")!);
              }
            }
          }).catch(() => {});
        } catch (e) {
          console.warn("Impossible de charger les outils:", e);
        }
      }, 1500);
      
      // Gérer le bouton Send API
      const apiSendBtn = doc.querySelector("#panel-api .icontrol-api-send");
      if (apiSendBtn) {
        apiSendBtn.addEventListener("click", () => {
          const method = (doc.querySelector("#panel-api .icontrol-api-method") as HTMLSelectElement)?.value || "GET";
          const url = (doc.querySelector("#panel-api .icontrol-api-url") as HTMLInputElement)?.value || "";
          const responseDiv = doc.getElementById("api-response");
          
          if (responseDiv) {
            responseDiv.textContent = `Envoi de la requête ${method} ${url}...`;
            // Simuler une réponse (à remplacer par un vrai appel API)
            setTimeout(() => {
              responseDiv.textContent = JSON.stringify({
                status: "ok",
                method,
                endpoint: url,
                timestamp: new Date().toISOString(),
                data: []
              }, null, 2);
            }, 500);
          }
        });
      }
    }
  } catch (e) {
    console.error("Erreur lors de la configuration de la Toolbox:", e);
  }
}
