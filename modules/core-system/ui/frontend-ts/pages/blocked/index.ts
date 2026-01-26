import { escapeHtml } from "../../../../../../app/src/runtime/safeRender";

export default function blockedPage(): string {
  const w = globalThis as any;
  const block = w.__bootBlock as { kind: string; code?: string; message?: string } | undefined;

  const kind = block?.kind || "BLOCKED";
  const code = block?.code || "ERR_VERSION_BLOCKED";
  const message = block?.message || "Cette version est bloquée par une policy de gouvernance.";

  return `
    <div style="padding:18px; font-family: system-ui; max-width: 820px; margin: 0 auto;">
      <h2>Accès bloqué</h2>
      <div style="margin-top:8px; opacity:.85">
        <div><b>Mode</b>: ${escapeHtml(kind)}</div>
        <div><b>Code</b>: ${escapeHtml(code)}</div>
      </div>
      <div style="margin-top:14px; padding:12px; border:1px solid var(--ic-borderDarkStrong); border-radius:10px;">
        ${escapeHtml(message)}
      </div>

      <div style="margin-top:14px; opacity:.85">
        Contacte l’administrateur ou mets à jour l’application.
      </div>

      <div style="margin-top:16px">
        <button id="goLogin">Retour Login</button>
      </div>
    </div>
  `;
}
