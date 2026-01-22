import "./client-foundation.css";

export function renderClientDisabled(root: HTMLElement): void {
  root.innerHTML = `
    <div data-scope="client-foundation">
      <div class="cf-shell">
        <div class="cf-panel">
          <div class="cf-title">Client désactivé</div>
          <div class="cf-subtitle">Surface Client en reconstruction — accès temporairement suspendu.</div>
          <div class="cf-meta">Ref: CLIENT_RESET_FOUNDATION_V1</div>
          <div class="cf-grid">
            <div class="cf-card">
              <div class="cf-title" style="font-size:16px;">État</div>
              <div class="cf-subtitle">Legacy désactivé • Build gouvernée</div>
            </div>
            <div class="cf-card">
              <div class="cf-title" style="font-size:16px;">Suivi</div>
              <div class="cf-subtitle">Routes legacy bloquées • Audit actif</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
