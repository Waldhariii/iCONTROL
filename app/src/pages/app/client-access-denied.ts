import "./client-foundation.css";

export function renderClientAccessDenied(root: HTMLElement): void {
  root.innerHTML = `
    <div data-scope="client-foundation">
      <div class="cf-shell">
        <div class="cf-panel">
          <div class="cf-title">Accès refusé</div>
          <div class="cf-subtitle">La surface Client est verrouillée par la gouvernance.</div>
          <div class="cf-meta">Ref: CLIENT_ACCESS_DENIED</div>
        </div>
      </div>
    </div>
  `;
}
