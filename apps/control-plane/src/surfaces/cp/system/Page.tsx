import { createPageShell } from "../../../core/ui/pageShell";

export function render(root: HTMLElement): void {
  const shell = createPageShell({
    title: "Système",
    subtitle: "Configuration et gestion du système iCONTROL",
  });

  // Onglets de navigation
  const tabs = [
    { id: "overview", label: "Vue d'ensemble", path: "#/system/overview" },
    { id: "subscriptions", label: "Abonnements", path: "#/system/subscriptions" },
    { id: "plans", label: "Plans", path: "#/system/plans" },
    { id: "storage", label: "Stockage", path: "#/system/storage" },
    { id: "integrations", label: "Intégrations", path: "#/system/integrations" },
    { id: "config", label: "Configuration", path: "#/system/config" },
  ];

  // Créer la barre d'onglets
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--surface-border, #262d35);
    padding-bottom: 8px;
  `;

  const currentPath = window.location.hash;
  
  tabs.forEach(tab => {
    const tabBtn = document.createElement("a");
    tabBtn.href = tab.path;
    tabBtn.textContent = tab.label;
    tabBtn.style.cssText = `
      padding: 12px 20px;
      text-decoration: none;
      color: ${currentPath.startsWith(tab.path) ? 'var(--accent-primary, #5a8fff)' : 'var(--text-muted, #9aa3ad)'};
      border-bottom: 2px solid ${currentPath.startsWith(tab.path) ? 'var(--accent-primary, #5a8fff)' : 'transparent'};
      font-weight: ${currentPath.startsWith(tab.path) ? '600' : '400'};
      transition: all 0.2s ease;
    `;
    
    tabBtn.addEventListener('mouseenter', () => {
      if (!currentPath.startsWith(tab.path)) {
        tabBtn.style.color = 'var(--text-primary, #e6e9ee)';
      }
    });
    
    tabBtn.addEventListener('mouseleave', () => {
      if (!currentPath.startsWith(tab.path)) {
        tabBtn.style.color = 'var(--text-muted, #9aa3ad)';
      }
    });
    
    tabsContainer.appendChild(tabBtn);
  });

  // Message par défaut si on est sur /system sans sous-page
  const content = document.createElement("div");
  content.style.cssText = `
    padding: 40px;
    text-align: center;
    color: var(--text-muted, #9aa3ad);
  `;
  content.innerHTML = `
    <h3 style="color: var(--text-primary, #e6e9ee); margin-bottom: 12px;">
      Sélectionnez un onglet
    </h3>
    <p>Choisissez une section ci-dessus pour configurer le système.</p>
  `;

  shell.appendChild(tabsContainer);
  shell.appendChild(content);
  
  root.innerHTML = "";
  root.appendChild(shell);
}
