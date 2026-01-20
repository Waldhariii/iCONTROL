/**
 * ICONTROL_TOOLBOX_PANEL_V1
 * Composant Panel style Toolbox réutilisable
 */

/**
 * Crée un panneau style Toolbox avec header et content
 */
export function createToolboxPanelElement(title: string, subtitle?: string): {
  panel: HTMLElement;
  header: HTMLElement;
  content: HTMLElement;
} {
  const panel = document.createElement("div");
  panel.style.minWidth = "0";
  panel.style.boxSizing = "border-box";
  panel.className = "icontrol-toolbox-panel-element";
  panel.style.cssText = `
    background: var(--ic-card, var(--panel));
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  `;

  const header = document.createElement("div");
  header.className = "icontrol-panel-header";
  header.style.cssText = `
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

  header.appendChild(titleDiv);
  panel.appendChild(header);

  const content = document.createElement("div");
  content.className = "icontrol-panel-content";
  content.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 20px;
  `;

  panel.appendChild(content);

  return { panel, header, content };
}
