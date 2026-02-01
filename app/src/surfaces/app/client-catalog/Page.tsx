/* import "./client-foundation.css"; — désactivé: styles visuels retirés */
export function renderClientCatalog(root: HTMLElement): void {
  root.innerHTML = `
    <div data-scope="client-foundation">
      <div class="cf-shell">
        <div class="cf-panel">
          <div class="cf-title">Client — Canonique UI</div>
          <div class="cf-subtitle">Page fictive de référence (sans data métier).</div>
          <div class="cf-grid">
            <div class="cf-card">
              <div class="cf-title" style="font-size:16px;">Carte</div>
              <div class="cf-subtitle">Surface 1 / tokenized</div>
            </div>
            <div class="cf-card">
              <div class="cf-title" style="font-size:16px;">KPI</div>
              <div class="cf-subtitle">Valeur • Trend</div>
            </div>
            <div class="cf-card">
              <div class="cf-title" style="font-size:16px;">État</div>
              <div class="cf-subtitle">Placeholder canonique</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
