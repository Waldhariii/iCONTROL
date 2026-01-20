/**
 * ICONTROL_TOOLBOX_LAYOUT_V1
 * Layout system basé sur la Developer Toolbox avec topbar, sidebar et panneaux
 */

export interface ToolboxTab {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}

export interface ToolboxSidebarSection {
  id: string;
  title: string;
  items: ToolboxSidebarItem[];
}

export interface ToolboxSidebarItem {
  id: string;
  label: string;
  checked?: boolean;
  onClick?: () => void;
  shortcut?: string;
}

export interface ToolboxPanel {
  id: string;
  title: string;
  subtitle?: string;
  content: HTMLElement | string;
  gridColumn?: number;
  gridRow?: number;
}

/**
 * Crée un layout Toolbox complet avec topbar, sidebar et main content
 */
export function createToolboxLayout(options: {
  topbarTitle: string;
  tabs?: ToolboxTab[];
  sidebarSections?: ToolboxSidebarSection[];
  panels?: ToolboxPanel[];
  mainContent?: HTMLElement | string;
}): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.className = "icontrol-toolbox-layout";
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: var(--ic-bg, var(--bg));
    color: var(--ic-text, var(--text));
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  `;

  // Topbar
  const topbar = createToolboxTopbar(options.topbarTitle, options.tabs || []);
  container.appendChild(topbar);

  // Main container (sidebar + content)
  const mainContainer = document.createElement("div");
  mainContainer.style.cssText = `
    display: flex;
    flex: 1;
    overflow: hidden;
  `;

  // Sidebar
  if (options.sidebarSections && options.sidebarSections.length > 0) {
    const sidebar = createToolboxSidebar(options.sidebarSections);
    mainContainer.appendChild(sidebar);
  }

  // Content area
  const contentArea = document.createElement("div");
  contentArea.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--ic-bg, var(--bg));
  `;

  // Panels grid ou main content
  if (options.panels && options.panels.length > 0) {
    const panelsGrid = createToolboxPanelsGrid(options.panels);
    contentArea.appendChild(panelsGrid);
  } else if (options.mainContent) {
    const mainContentDiv = document.createElement("div");
    mainContentDiv.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 20px;
    `;
    if (typeof options.mainContent === 'string') {
      mainContentDiv.innerHTML = options.mainContent;
    } else {
      mainContentDiv.appendChild(options.mainContent);
    }
    contentArea.appendChild(mainContentDiv);
  }

  mainContainer.appendChild(contentArea);
  container.appendChild(mainContainer);

  return container;
}

/**
 * Crée une topbar avec titre et tabs
 */
function createToolboxTopbar(title: string, tabs: ToolboxTab[]): HTMLElement {
  const topbar = document.createElement("div");
  topbar.className = "icontrol-toolbox-topbar";
  topbar.style.cssText = `
    height: 50px;
    background: var(--ic-panel, var(--panel2));
    border-bottom: 1px solid var(--ic-border, var(--line));
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
    flex-shrink: 0;
  `;

  const titleDiv = document.createElement("div");
  titleDiv.className = "icontrol-toolbox-topbar-title";
  titleDiv.style.cssText = `
    font-size: 18px;
    font-weight: 700;
    color: var(--ic-text, var(--text));
    margin-right: 24px;
  `;
  titleDiv.textContent = title;
  topbar.appendChild(titleDiv);

  tabs.forEach((tab, index) => {
    const tabBtn = document.createElement("button");
    tabBtn.className = "icontrol-topbar-tab";
    tabBtn.dataset.tabId = tab.id;
    tabBtn.style.cssText = `
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--ic-mutedText, var(--muted));
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    if (tab.icon) {
      const iconSpan = document.createElement("span");
      iconSpan.textContent = tab.icon;
      tabBtn.appendChild(iconSpan);
    }
    
    const labelSpan = document.createElement("span");
    labelSpan.textContent = tab.label;
    tabBtn.appendChild(labelSpan);

    // Active state (first tab by default)
    if (index === 0) {
      tabBtn.classList.add("active");
      tabBtn.style.color = "var(--ic-accent2, #4ec9b0)";
      tabBtn.style.borderBottomColor = "var(--ic-accent2, #4ec9b0)";
    }

    tabBtn.addEventListener("mouseenter", () => {
      if (!tabBtn.classList.contains("active")) {
        tabBtn.style.color = "var(--ic-text, var(--text))";
        tabBtn.style.background = "rgba(255,255,255,0.05)";
      }
    });

    tabBtn.addEventListener("mouseleave", () => {
      if (!tabBtn.classList.contains("active")) {
        tabBtn.style.color = "var(--ic-mutedText, var(--muted))";
        tabBtn.style.background = "transparent";
      }
    });

    tabBtn.addEventListener("click", () => {
      // Remove active from all tabs
      topbar.querySelectorAll(".icontrol-topbar-tab").forEach(t => {
        t.classList.remove("active");
        (t as HTMLElement).style.color = "var(--ic-mutedText, var(--muted))";
        (t as HTMLElement).style.borderBottomColor = "transparent";
      });
      
      // Add active to clicked tab
      tabBtn.classList.add("active");
      tabBtn.style.color = "var(--ic-accent2, #4ec9b0)";
      tabBtn.style.borderBottomColor = "var(--ic-accent2, #4ec9b0)";
      
      if (tab.onClick) tab.onClick();
    });

    topbar.appendChild(tabBtn);
  });

  return topbar;
}

/**
 * Crée une sidebar avec sections
 */
function createToolboxSidebar(sections: ToolboxSidebarSection[]): HTMLElement {
  const sidebar = document.createElement("div");
  sidebar.className = "icontrol-toolbox-sidebar";
  sidebar.style.cssText = `
    width: 280px;
    min-width: 240px;
    max-width: 400px;
    background: var(--ic-panel, var(--panel2));
    border-right: 1px solid var(--ic-border, var(--line));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  `;

  const sidebarContent = document.createElement("div");
  sidebarContent.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  `;

  sections.forEach(section => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "icontrol-sidebar-section";
    sectionDiv.style.cssText = "margin-bottom: 24px;";

    const sectionTitle = document.createElement("div");
    sectionTitle.className = "icontrol-sidebar-section-title";
    sectionTitle.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: var(--ic-mutedText, var(--muted));
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    `;
    sectionTitle.textContent = section.title;
    sectionDiv.appendChild(sectionTitle);

    section.items.forEach(item => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "icontrol-sidebar-item";
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        color: var(--ic-text, var(--text));
        font-size: 13px;
        transition: background 0.2s;
      `;

      const checkbox = document.createElement("div");
      checkbox.className = "icontrol-sidebar-checkbox";
      checkbox.style.cssText = `
        width: 16px;
        height: 16px;
        border: 1px solid var(--ic-border, var(--line));
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `;
      
      if (item.checked) {
        checkbox.classList.add("checked");
        checkbox.style.background = "var(--ic-accent2, #4ec9b0)";
        checkbox.style.borderColor = "var(--ic-accent2, #4ec9b0)";
        checkbox.innerHTML = `<span style="color:#1e1e1e;font-size:12px;font-weight:bold;">✓</span>`;
      }

      const label = document.createElement("span");
      label.textContent = item.label;
      label.style.flex = "1";

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(label);

      if (item.shortcut) {
        const shortcut = document.createElement("span");
        shortcut.className = "icontrol-shortcut";
        shortcut.style.cssText = `
          margin-left: auto;
          font-size: 11px;
          color: var(--ic-mutedText, var(--muted));
          font-family: monospace;
        `;
        shortcut.textContent = item.shortcut;
        itemDiv.appendChild(shortcut);
      }

      itemDiv.addEventListener("mouseenter", () => {
        itemDiv.style.background = "rgba(255,255,255,0.05)";
      });

      itemDiv.addEventListener("mouseleave", () => {
        itemDiv.style.background = "transparent";
      });

      itemDiv.addEventListener("click", () => {
        if (item.onClick) item.onClick();
        // Toggle checkbox
        const isChecked = checkbox.classList.contains("checked");
        if (isChecked) {
          checkbox.classList.remove("checked");
          checkbox.style.background = "transparent";
          checkbox.style.borderColor = "var(--ic-border, var(--line))";
          checkbox.innerHTML = "";
        } else {
          checkbox.classList.add("checked");
          checkbox.style.background = "var(--ic-accent2, #4ec9b0)";
          checkbox.style.borderColor = "var(--ic-accent2, #4ec9b0)";
          checkbox.innerHTML = `<span style="color:#1e1e1e;font-size:12px;font-weight:bold;">✓</span>`;
        }
      });

      sectionDiv.appendChild(itemDiv);
    });

    sidebarContent.appendChild(sectionDiv);
  });

  sidebar.appendChild(sidebarContent);
  return sidebar;
}

/**
 * Crée une grille de panneaux (2x2 par défaut)
 */
function createToolboxPanelsGrid(panels: ToolboxPanel[]): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "icontrol-toolbox-panels";
  grid.style.cssText = `
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1px;
    background: var(--ic-border, var(--line));
    padding: 1px;
    overflow: hidden;
  `;

  panels.forEach(panel => {
    const panelDiv = createToolboxPanel(panel.title, panel.subtitle, panel.content);
    if (panel.gridColumn) panelDiv.style.gridColumn = String(panel.gridColumn);
    if (panel.gridRow) panelDiv.style.gridRow = String(panel.gridRow);
    grid.appendChild(panelDiv);
  });

  return grid;
}

/**
 * Crée un panneau individuel
 */
export function createToolboxPanel(title: string, subtitle?: string, content?: HTMLElement | string): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "icontrol-toolbox-panel";
  panel.style.cssText = `
    background: var(--ic-card, var(--panel));
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const panelHeader = document.createElement("div");
  panelHeader.className = "icontrol-panel-header";
  panelHeader.style.cssText = `
    padding: 12px 16px;
    background: var(--ic-panel, var(--panel2));
    border-bottom: 1px solid var(--ic-border, var(--line));
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  `;

  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  const titleSpan = document.createElement("div");
  titleSpan.className = "icontrol-panel-title";
  titleSpan.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: var(--ic-text, var(--text));
  `;
  titleSpan.textContent = title;
  titleDiv.appendChild(titleSpan);

  if (subtitle) {
    const subtitleSpan = document.createElement("div");
    subtitleSpan.style.cssText = `
      font-size: 11px;
      color: var(--ic-mutedText, var(--muted));
    `;
    subtitleSpan.textContent = subtitle;
    titleDiv.appendChild(subtitleSpan);
  }

  panelHeader.appendChild(titleDiv);
  panel.appendChild(panelHeader);

  const panelContent = document.createElement("div");
  panelContent.className = "icontrol-panel-content";
  panelContent.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 16px;
  `;

  if (content) {
    if (typeof content === 'string') {
      panelContent.innerHTML = content;
    } else {
      panelContent.appendChild(content);
    }
  }

  panel.appendChild(panelContent);
  return panel;
}
