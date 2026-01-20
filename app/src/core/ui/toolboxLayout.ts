/**
 * ICONTROL_TOOLBOX_LAYOUT_V1
 * Système de layout style Developer Toolbox
 * - Barre d'onglets en haut
 * - Sidebar gauche avec sections
 * - Zone principale avec panneaux en grille 2x2
 */

import "../../core/ui/toolboxLayout.css";

export interface ToolboxTab {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
}

export interface ToolboxSidebarSection {
  id: string;
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon?: string;
    checked?: boolean;
  }>;
}

export interface ToolboxPanel {
  id: string;
  title: string;
  subtitle?: string;
  content: HTMLElement;
  width?: "half" | "full"; // half = 50%, full = 100%
  height?: "half" | "full";
}

/**
 * Crée le layout complet style Toolbox
 */
export function createToolboxLayout(options: {
  tabs: ToolboxTab[];
  sidebarSections: ToolboxSidebarSection[];
  panels: ToolboxPanel[];
  onTabChange?: (tabId: string) => void;
  onSidebarItemClick?: (sectionId: string, itemId: string) => void;
}): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.className = "icontrol-toolbox-layout";
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: var(--ic-bg, #0f1112);
    color: var(--ic-text, #e7ecef);
    overflow: hidden;
  `;

  // Top Navigation Bar avec onglets
  const topNav = createTopNavigation(options.tabs, options.onTabChange);
  container.appendChild(topNav);

  // Container principal (sidebar + content)
  const mainContainer = document.createElement("div");
  mainContainer.style.cssText = `
    display: flex;
    flex: 1;
    overflow: hidden;
  `;

  // Sidebar gauche
  const sidebar = createSidebar(options.sidebarSections, options.onSidebarItemClick);
  mainContainer.appendChild(sidebar);

  // Zone de contenu avec panneaux
  const contentArea = createContentArea(options.panels);
  mainContainer.appendChild(contentArea);

  container.appendChild(mainContainer);

  return container;
}

/**
 * Crée la barre de navigation supérieure avec onglets
 */
function createTopNavigation(
  tabs: ToolboxTab[],
  onTabChange?: (tabId: string) => void,
): HTMLElement {
  const nav = document.createElement("div");
  nav.className = "icontrol-toolbox-topnav";
  nav.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 16px;
    background: var(--ic-panel2, #202427);
    border-bottom: 1px solid var(--ic-border, #2b3136);
    flex-shrink: 0;
  `;

  // Titre à gauche
  const title = document.createElement("div");
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: var(--ic-text, #e7ecef);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  title.textContent = "Developer Toolbox";
  nav.appendChild(title);

  // Onglets à droite
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0;
    height: 100%;
  `;

  tabs.forEach((tab) => {
    const tabButton = document.createElement("button");
    tabButton.className = `icontrol-toolbox-tab ${tab.active ? "active" : ""}`;
    tabButton.dataset.tabId = tab.id;
    tabButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 100%;
      background: ${tab.active ? "var(--ic-panel, #1a1d1f)" : "transparent"};
      border: none;
      border-bottom: ${tab.active ? "2px solid var(--ic-accent, #7b2cff)" : "2px solid transparent"};
      color: ${tab.active ? "var(--ic-text, #e7ecef)" : "var(--ic-mutedText, #a7b0b7)"};
      font-size: 12px;
      font-weight: ${tab.active ? "600" : "500"};
      cursor: pointer;
      transition: all 0.2s;
    `;

    if (tab.icon) {
      const iconSpan = document.createElement("span");
      iconSpan.textContent = tab.icon;
      iconSpan.style.fontSize = "14px";
      tabButton.appendChild(iconSpan);
    }

    const labelSpan = document.createElement("span");
    labelSpan.textContent = tab.label;
    tabButton.appendChild(labelSpan);

    tabButton.onclick = () => {
      // Mettre à jour l'état actif
      tabsContainer.querySelectorAll(".icontrol-toolbox-tab").forEach((t) => {
        t.classList.remove("active");
        (t as HTMLElement).style.background = "transparent";
        (t as HTMLElement).style.borderBottom = "2px solid transparent";
        (t as HTMLElement).style.color = "var(--ic-mutedText, #a7b0b7)";
        (t as HTMLElement).style.fontWeight = "500";
      });

      tabButton.classList.add("active");
      tabButton.style.background = "var(--ic-panel, #1a1d1f)";
      tabButton.style.borderBottom = "2px solid var(--ic-accent, #7b2cff)";
      tabButton.style.color = "var(--ic-text, #e7ecef)";
      tabButton.style.fontWeight = "600";

      if (onTabChange) {
        onTabChange(tab.id);
      }
    };

    tabsContainer.appendChild(tabButton);
  });

  nav.appendChild(tabsContainer);

  return nav;
}

/**
 * Crée la sidebar gauche
 */
function createSidebar(
  sections: ToolboxSidebarSection[],
  onItemClick?: (sectionId: string, itemId: string) => void,
): HTMLElement {
  const sidebar = document.createElement("div");
  sidebar.className = "icontrol-toolbox-sidebar";
  sidebar.style.cssText = `
    width: 240px;
    background: var(--ic-panel, #1a1d1f);
    border-right: 1px solid var(--ic-border, #2b3136);
    overflow-y: auto;
    padding: 16px;
    flex-shrink: 0;
  `;

  sections.forEach((section) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.style.cssText = `
      margin-bottom: 24px;
    `;

    const sectionTitle = document.createElement("div");
    sectionTitle.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: var(--ic-mutedText, #a7b0b7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    `;
    sectionTitle.textContent = section.title;
    sectionDiv.appendChild(sectionTitle);

    section.items.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 13px;
        color: var(--ic-text, #e7ecef);
      `;

      itemDiv.onmouseenter = () => {
        itemDiv.style.background = "rgba(255,255,255,0.05)";
      };
      itemDiv.onmouseleave = () => {
        itemDiv.style.background = "transparent";
      };

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.checked || false;
      checkbox.style.cssText = `
        width: 14px;
        height: 14px;
        cursor: pointer;
      `;
      itemDiv.appendChild(checkbox);

      // Label
      const label = document.createElement("span");
      label.textContent = item.label;
      itemDiv.appendChild(label);

      itemDiv.onclick = () => {
        checkbox.checked = !checkbox.checked;
        if (onItemClick) {
          onItemClick(section.id, item.id);
        }
      };

      sectionDiv.appendChild(itemDiv);
    });

    sidebar.appendChild(sectionDiv);
  });

  return sidebar;
}

/**
 * Crée la zone de contenu avec panneaux en grille 2x2
 */
function createContentArea(panels: ToolboxPanel[]): HTMLElement {
  const contentArea = document.createElement("div");
  contentArea.className = "icontrol-toolbox-content";
  contentArea.style.cssText = `
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 1px;
    background: var(--ic-border, #2b3136);
    padding: 1px;
    overflow: hidden;
  `;

  panels.forEach((panel) => {
    const panelContainer = document.createElement("div");
    panelContainer.className = `icontrol-toolbox-panel-container`;
    panelContainer.id = `panel-${panel.id}`;

    const gridColumn = panel.width === "full" ? "1 / -1" : "auto";
    const gridRow = panel.height === "full" ? "1 / -1" : "auto";

    panelContainer.style.cssText = `
      grid-column: ${gridColumn};
      grid-row: ${gridRow};
      display: flex;
      flex-direction: column;
      background: var(--ic-panel, #1a1d1f);
      overflow: hidden;
    `;

    // Header du panneau
    const panelHeader = document.createElement("div");
    panelHeader.style.cssText = `
      padding: 12px 16px;
      background: var(--ic-panel2, #202427);
      border-bottom: 1px solid var(--ic-border, #2b3136);
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-shrink: 0;
    `;

    const panelTitle = document.createElement("div");
    panelTitle.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: var(--ic-text, #e7ecef);
    `;
    panelTitle.textContent = panel.title;
    panelHeader.appendChild(panelTitle);

    if (panel.subtitle) {
      const panelSubtitle = document.createElement("div");
      panelSubtitle.style.cssText = `
        font-size: 11px;
        color: var(--ic-mutedText, #a7b0b7);
      `;
      panelSubtitle.textContent = panel.subtitle;
      panelHeader.appendChild(panelSubtitle);
    }

    panelContainer.appendChild(panelHeader);

    // Contenu du panneau
    const panelContent = document.createElement("div");
    panelContent.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 16px;
    `;
    panelContent.appendChild(panel.content);
    panelContainer.appendChild(panelContent);

    contentArea.appendChild(panelContainer);
  });

  return contentArea;
}
