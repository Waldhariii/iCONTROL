/**
 * ICONTROL_CP_MANAGEMENT_V1
 * Page Management pour l'application ADMINISTRATION (/cp)
 * Page simplifiée sans onglets - contenu principal uniquement
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { exportToCSV, exportToJSON } from "/src/core/ui/exportUtils";
import { navigate, getCurrentHash } from "/src/runtime/navigate";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

export function renderManagementPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "Management",
    "Gestion centralisée des outils d'administration"
  );
  
  // Ajouter l'icône dans le header
  const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
  if (headerTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "⚙️";
    iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
    headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
  }
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();
  const role = getRole();
  const safeMode = getSafeMode();

  const infoDiv = document.createElement("div");
  infoDiv.style.cssText = `
    padding: 14px;
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    display: grid;
    gap: 8px;
    margin-bottom: 20px;
  `;
  infoDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Application</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">Administration (CP)</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Administrateur actuel</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">${s.username} <span style="color:var(--ic-accent, var(--accent));">(${s.username === "Master" ? "Master" : s.role})</span></span>
    </div>
  `;
  cardContent.appendChild(infoDiv);

  // Système d'onglets
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 0 24px 16px 24px;
    border-bottom: 1px solid var(--ic-border, #3e3e3e);
    margin-bottom: 24px;
  `;
  
  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "developer", label: "Développeur" }
  ];
  
  let activeTab = "overview";
  const hash = getCurrentHash();
  const tabMatch = hash.match(/[?&]tab=([^&]+)/);
  if (tabMatch) {
    activeTab = tabMatch[1];
  }
  
  tabs.forEach(tab => {
    const tabBtn = document.createElement("button");
    tabBtn.textContent = tab.label;
    tabBtn.style.cssText = `
      padding: 10px 20px;
      background: ${activeTab === tab.id ? "var(--ic-accent, #7b2cff)" : "transparent"};
      color: ${activeTab === tab.id ? "white" : "var(--ic-text, #d4d4d4)"};
      border: none;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-weight: ${activeTab === tab.id ? "600" : "500"};
      font-size: 14px;
      transition: all 0.2s;
      border-bottom: 2px solid ${activeTab === tab.id ? "var(--ic-accent, #7b2cff)" : "transparent"};
    `;
    
    tabBtn.onmouseenter = () => {
      if (activeTab !== tab.id) {
        tabBtn.style.background = "rgba(255,255,255,0.05)";
      }
    };
    tabBtn.onmouseleave = () => {
      if (activeTab !== tab.id) {
        tabBtn.style.background = "transparent";
      }
    };
    
    tabBtn.onclick = () => {
      navigate(`#/management${tab.id !== "overview" ? `?tab=${tab.id}` : ""}`);
    };
    
    tabsContainer.appendChild(tabBtn);
  });
  
  cardContent.appendChild(tabsContainer);
  
  // Conteneur pour le contenu des onglets
  const contentDiv = document.createElement("div");
  contentDiv.style.cssText = "padding: 0 24px 24px 24px; min-height: 400px;";
  
  // Contenu de l'onglet Développeur
  if (activeTab === "developer") {
    const developerContainer = document.createElement("div");
    developerContainer.id = "developer-tab-content";
    contentDiv.appendChild(developerContainer);
    
    const info = document.createElement("div");
    info.style.cssText = "padding: 24px; border: 1px solid var(--ic-border, #2b3136); border-radius: 12px; background: rgba(255,255,255,0.02);";
    info.innerHTML = `
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Outils développeur</div>
      <div style="font-size: 13px; color: var(--ic-mutedText, #858585); margin-bottom: 16px;">La vue développeur est isolée. Ouvrez-la dans sa route dédiée.</div>
    `;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Ouvrir Developer";
    btn.style.cssText = "padding: 10px 16px; border-radius: 8px; border: 1px solid var(--ic-border, #2b3136); background: rgba(255,255,255,0.06); color: var(--ic-text, #e7ecef); font-weight: 600; cursor: pointer;";
    btn.onclick = () => navigate("#/developer");
    info.appendChild(btn);
    developerContainer.appendChild(info);
  } else {
    // Contenu principal de Management (Vue d'ensemble)

  try {
    const moduleRegistry = JSON.parse(localStorage.getItem("icontrol_module_registry") || JSON.stringify({
      modules: {
        "core-system": { enabled: true, type: "core" },
        "dossiers": { enabled: false, type: "complementary" },
        "clients": { enabled: false, type: "complementary" },
        "inventory": { enabled: false, type: "complementary" },
        "documents": { enabled: false, type: "complementary" },
        "ocr": { enabled: false, type: "complementary" },
        "finance": { enabled: false, type: "complementary" },
        "billing": { enabled: false, type: "complementary" },
        "quotes": { enabled: false, type: "complementary" },
        "jobs": { enabled: false, type: "complementary" },
        "calendar": { enabled: false, type: "complementary" },
        "reports": { enabled: false, type: "complementary" },
        "contacts": { enabled: false, type: "complementary" },
        "payments": { enabled: false, type: "complementary" },
        "integrations-hub": { enabled: false, type: "complementary" }
      }
    }));
    const modules = moduleRegistry.modules || {};
    const enabledModules = Object.entries(modules).filter(([_, m]: [string, any]) => m.enabled);
    const disabledModules = Object.entries(modules).filter(([_, m]: [string, any]) => !m.enabled);
    
    contentDiv.innerHTML = `
      <div style="font-size:20px;font-weight:700;margin-bottom:8px;color:#d4d4d4;display:flex;align-items:center;gap:8px;">
        <span>📊</span> Vue d'ensemble Management
      </div>
      <div style="color:#858585;font-size:14px;margin-bottom:24px;">Pilotage fonctionnel et outils d'administration centralisés</div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:24px;">
        <div style="padding:20px;border:1px solid #3e3e3e;border-radius:12px;background:rgba(255,255,255,0.02);">
          <div style="font-weight:600;color:#d4d4d4;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
            <span>🔧</span> Outils disponibles
          </div>
          <div style="color:#858585;font-size:13px;line-height:1.8;">
            <div>• <strong>Système</strong> : Configuration et monitoring</div>
            <div>• <strong>Abonnement</strong> : Gestion des abonnements et services</div>
            <div>• <strong>Organisation</strong> : Configuration organisationnelle</div>
          </div>
        </div>
        
        <div style="padding:20px;border:1px solid #3e3e3e;border-radius:12px;background:rgba(255,255,255,0.02);">
          <div style="font-weight:600;color:#d4d4d4;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
            <span>📦</span> Modules système
          </div>
          <div style="display:grid;gap:8px;">
            <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
              <span style="color:#858585;font-size:13px;">Actifs</span>
              <span style="font-weight:600;color:#4ec9b0;">${enabledModules.length}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
              <span style="color:#858585;font-size:13px;">Désactivés</span>
              <span style="font-weight:600;color:#858585;">${disabledModules.length}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
              <span style="color:#858585;font-size:13px;">Total</span>
              <span style="font-weight:600;color:#d4d4d4;">${Object.keys(modules).length}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="padding:20px;border:1px solid #3e3e3e;border-radius:12px;background:rgba(255,255,255,0.02);">
        <div style="font-weight:600;color:#d4d4d4;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <span>ℹ️</span> Guide d'utilisation
        </div>
        <div style="color:#858585;font-size:14px;line-height:1.6;">
          <p style="margin-bottom:12px;">Cette page centralise tous les outils d'administration du système iCONTROL. Utilisez le menu latéral pour accéder à chaque section :</p>
          <ul style="margin-left:20px;line-height:2;">
            <li><strong>Système</strong> : Configuration système, monitoring et santé des services</li>
            <li><strong>Abonnement</strong> : Gestion des abonnements, consommation et facturation</li>
            <li><strong>Organisation</strong> : Configuration organisationnelle et paramètres multi-tenant</li>
          </ul>
        </div>
      </div>
      
      <div style="margin-top:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:18px;font-weight:600;color:#d4d4d4;display:flex;align-items:center;gap:8px;">
            <span>📦</span> Modules système
          </div>
          <div style="display:flex;gap:8px;">
            <button id="exportModulesBtn" style="padding:8px 16px;background:var(--ic-panel,#1a1d1f);border:1px solid var(--ic-border,#2b3136);color:var(--ic-text,#e7ecef);border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='var(--ic-panel,#1a1d1f)'">
              📥 Exporter CSV
            </button>
            <button id="refreshModulesBtn" style="padding:8px 16px;background:var(--ic-panel,#1a1d1f);border:1px solid var(--ic-border,#2b3136);color:var(--ic-text,#e7ecef);border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='var(--ic-panel,#1a1d1f)'">
              🔄 Actualiser
            </button>
          </div>
        </div>
        <div id="modules-table-container"></div>
      </div>
    `;

    // Créer le tableau des modules
    const modulesTableContainer = contentDiv.querySelector("#modules-table-container");
    if (modulesTableContainer) {
      const modulesData = Object.entries(modules).map(([id, m]: [string, any]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
        type: m.type === "core" ? "Cœur" : "Complémentaire",
        status: m.enabled ? "Actif" : "Désactivé",
        enabled: m.enabled,
        ...m
      }));

      const columns: TableColumn<typeof modulesData[0]>[] = [
        {
          key: "name",
          label: "Nom",
          sortable: true
        },
        {
          key: "type",
          label: "Type",
          sortable: true,
          render: (value) => {
            const span = document.createElement("span");
            span.style.cssText = `padding: 4px 8px; background: ${value === "Cœur" ? "rgba(59,130,246,0.15)" : "rgba(244,135,113,0.15)"}; color: ${value === "Cœur" ? "#3b82f6" : "#f48771"}; border-radius: 4px; font-size: 12px; font-weight: 600;`;
            span.textContent = String(value);
            return span;
          }
        },
        {
          key: "status",
          label: "Statut",
          sortable: true,
          render: (value, row) => {
            const span = document.createElement("span");
            span.style.cssText = `padding: 4px 8px; background: ${row.enabled ? "rgba(78,201,176,0.15)" : "rgba(244,135,113,0.15)"}; color: ${row.enabled ? "#4ec9b0" : "#f48771"}; border-radius: 4px; font-size: 12px; font-weight: 600;`;
            span.textContent = String(value);
            return span;
          }
        }
      ];

      const modulesTable = createDataTable({
        columns,
        data: modulesData,
        searchable: true,
        sortable: true,
        pagination: true,
        pageSize: 10,
        actions: (row) => {
          const actions = [];
          if (row.id !== "core-system") { // Ne pas permettre de désactiver le core-system
            actions.push({
              label: row.enabled ? "Désactiver" : "Activer",
              onClick: () => {
                const newModules = { ...modules };
                newModules[row.id].enabled = !row.enabled;
                localStorage.setItem("icontrol_module_registry", JSON.stringify({ modules: newModules }));
                location.reload();
              },
              style: row.enabled ? ("warning" as const) : ("primary" as const)
            });
          }
          actions.push({
            label: "Configurer",
            onClick: () => {
              alert(`Configuration du module ${row.name} (Fonctionnalité à venir)`);
            },
            style: "primary" as const
          });
          return actions;
        }
      });

      modulesTableContainer.appendChild(modulesTable);

      // Event listeners pour les boutons
      const exportBtn = contentDiv.querySelector("#exportModulesBtn");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => {
          exportToCSV(modulesData.map(m => ({ Nom: m.name, Type: m.type, Statut: m.status })), "modules-systeme");
        });
      }

      const refreshBtn = contentDiv.querySelector("#refreshModulesBtn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
          location.reload();
        });
      }
    }
  } catch {
    contentDiv.innerHTML = `
      <div style="padding:20px;">
        <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:#d4d4d4;">Vue d'ensemble Management</h3>
        <div style="color:#858585;line-height:1.6;">
          <p>Bienvenue dans la page Management. Cette page centralise l'accès aux outils d'administration.</p>
        </div>
      </div>
    `;
  }
  }

  cardContent.appendChild(contentDiv);
  
  // Gérer les changements d'onglets via hashchange
  const handleHashChange = () => {
    const hash = getCurrentHash();
    const tabMatch = hash.match(/[?&]tab=([^&]+)/);
    const newActiveTab = tabMatch ? tabMatch[1] : "overview";
    
    if (newActiveTab !== activeTab) {
      // Recharger la page pour appliquer le changement
      location.reload();
    }
  };
  
  window.addEventListener("hashchange", handleHashChange);
}
