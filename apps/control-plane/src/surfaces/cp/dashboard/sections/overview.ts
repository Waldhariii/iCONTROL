// Section Overview - Vue d'ensemble du système
export function renderOverview(container: HTMLElement): void {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="color: var(--text-primary); margin-bottom: 16px;">Vue d'ensemble</h2>
      <p style="color: var(--text-muted);">Contenu actuel du dashboard sera ici.</p>
      <p style="color: var(--text-muted); margin-top: 8px;">KPI + Graphiques + Événements récents</p>
    </div>
  `;
}
