/**
 * ICONTROL_TOOLBOX_CARD_V1
 * Composant Card style Toolbox professionnel avec couleurs actuelles
 */

export function createToolboxCard(title: string, subtitle?: string): HTMLDivElement {
  const card = document.createElement("div");
  card.style.minWidth = "0";
  card.style.boxSizing = "border-box";
  card.style.cssText = `
    background: var(--ic-card, var(--panel));
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
  `;
  
  card.addEventListener("mouseenter", () => {
    card.style.borderColor = "var(--ic-accent, var(--accent))";
    card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  });
  
  card.addEventListener("mouseleave", () => {
    card.style.borderColor = "var(--ic-border, var(--line))";
    card.style.boxShadow = "none";
  });
  
  // Header style Toolbox
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 16px;
    background: var(--ic-panel, var(--panel2));
    border-bottom: 1px solid var(--ic-border, var(--line));
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  const titleDiv = document.createElement("div");
  titleDiv.style.cssText = "display:flex;align-items:center;gap:12px;";
  titleDiv.innerHTML = `
    <div>
      <div style="font-size:16px;font-weight:700;color:var(--ic-text, var(--text));">${title}</div>
      ${subtitle ? `<div style="font-size:12px;color:var(--ic-mutedText, var(--muted));margin-top:2px;">${subtitle}</div>` : ''}
    </div>
  `;
  header.appendChild(titleDiv);
  card.appendChild(header);
  
  // Content area
  const content = document.createElement("div");
  content.style.cssText = `
    padding: 20px;
    flex: 1;
  `;
  card.appendChild(content);
  
  // Exposer le content pour ajouter du contenu
  (card as any).content = content;
  
  return card;
}

export function createToolboxPanel(title: string, content: HTMLElement | string): HTMLDivElement {
  const panel = document.createElement("div");
  panel.style.cssText = `
    background: var(--ic-panel, var(--panel2));
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;
  
  // Panel header
  const panelHeader = document.createElement("div");
  panelHeader.style.cssText = `
    padding: 12px 16px;
    background: var(--ic-panel, var(--panel2));
    border-bottom: 1px solid var(--ic-border, var(--line));
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  const panelTitle = document.createElement("div");
  panelTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: var(--ic-text, var(--text));
  `;
  panelTitle.textContent = title;
  panelHeader.appendChild(panelTitle);
  panel.appendChild(panelHeader);
  
  // Panel content
  const panelContent = document.createElement("div");
  panelContent.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 16px;
  `;
  
  if (typeof content === 'string') {
    panelContent.innerHTML = content;
  } else {
    panelContent.appendChild(content);
  }
  
  panel.appendChild(panelContent);
  
  return panel;
}
