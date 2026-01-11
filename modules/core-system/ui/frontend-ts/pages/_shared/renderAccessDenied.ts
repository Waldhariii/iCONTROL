import { MAIN_SYSTEM_THEME } from "./mainSystem.data";
import { recordObs } from "./audit";
import { OBS } from "./obsCodes";

export const ACCESS_DENIED_MARKER = "ICONTROL_ACCESS_DENIED_V1";

export function renderAccessDenied(root: HTMLElement, reason: string): void {
  const TOK = MAIN_SYSTEM_THEME.tokens;
  
  // P17.4: _shared CSS vars (var(--ic-*), fallback TOK)
  const CSS_TEXT = "var(--ic-text, " + TOK.text + ")";
  const CSS_MUTED = "var(--ic-muted, " + TOK.mutedText + ")";
  const CSS_BORDER = "var(--ic-border, " + TOK.border + ")";
  const CSS_CARD = "var(--ic-card, " + TOK.card + ")";
recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "ui.accessDenied", detail: reason });

  root.innerHTML = `
    <div data-testid="access-denied"
         style="padding:14px;border-radius:18px;background:${CSS_CARD};border:1px solid ${CSS_BORDER};">
      <div style="font-weight:900;font-size:16px;margin-bottom:6px;">Access denied</div>
      <div style="color:${CSS_MUTED};font-size:13px;">
        Raison: <span style="color:${CSS_TEXT};font-weight:700;">${reason}</span>
      </div>
      <div style="margin-top:10px;color:${CSS_MUTED};font-size:12px;">
        Suggestion: verifier votre role, puis SAFE_MODE si applicable.
      </div>
    </div>
  `;
}
