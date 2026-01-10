import { getUserLabel } from "/src/router";
import { safeRender } from "./_shared/mainSystem.shared";

export function renderDashboard(root: HTMLElement): void {
  safeRender(root, () => {
    root.innerHTML = `
      <div style="max-width:980px;margin:26px auto;padding:0 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div style="font-size:22px;font-weight:900">Dashboard</div>
          <div style="opacity:.8">${getUserLabel()}</div>
        </div>

        <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
          <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
            <div style="font-weight:900">Santé PME</div>
            <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
          </div>
          <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
            <div style="font-weight:900">Raccourcis</div>
            <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
          </div>
          <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
            <div style="font-weight:900">Alertes</div>
            <div style="opacity:.8;margin-top:6px">Widget (placeholder)</div>
          </div>
        </div>
      </div>
    `;
  });
}
