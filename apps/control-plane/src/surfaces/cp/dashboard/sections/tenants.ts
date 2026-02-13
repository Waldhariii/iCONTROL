// Section Tenants - Vue centrée tenants
export function renderTenantsView(container: HTMLElement): void {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h2 style="color: var(--text-primary); margin-bottom: 16px;">Vue Tenants</h2>
      
      <!-- KPI Row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--surface-border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Tenants actifs</div>
          <div style="font-size: 28px; font-weight: 700; color: var(--accent-primary);">127</div>
        </div>
        <div style="background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--surface-border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Nouveaux (30j)</div>
          <div style="font-size: 28px; font-weight: 700; color: #10b981;">+12</div>
        </div>
        <div style="background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--surface-border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Suspendus</div>
          <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">3</div>
        </div>
        <div style="background: var(--surface-1); padding: 16px; border-radius: 8px; border: 1px solid var(--surface-border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Modules activés (7j)</div>
          <div style="font-size: 28px; font-weight: 700; color: var(--text-primary);">45</div>
        </div>
      </div>

      <p style="color: var(--text-muted);">Graphiques + Table top tenants à implémenter</p>
    </div>
  `;
}
