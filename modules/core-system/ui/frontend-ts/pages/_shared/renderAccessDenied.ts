import { MAIN_SYSTEM_THEME } from "./mainSystem.data";
import { recordObs } from "./audit";
import { OBS } from "./obsCodes";

export const ACCESS_DENIED_MARKER = "ICONTROL_ACCESS_DENIED_V1";

export function renderAccessDenied(root: HTMLElement, reason: string): void {
  const TOK = MAIN_SYSTEM_THEME.tokens;
  recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "ui.accessDenied", detail: reason });

  root.innerHTML = `
    <div data-testid="access-denied"
         style="padding:14px;border-radius:18px;background:${TOK.card};border:1px solid ${TOK.border};">
      <div style="font-weight:900;font-size:16px;margin-bottom:6px;">Access denied</div>
      <div style="color:${TOK.mutedText};font-size:13px;">
        Raison: <span style="color:${TOK.text};font-weight:700;">${reason}</span>
      </div>
      <div style="margin-top:10px;color:${TOK.mutedText};font-size:12px;">
        Suggestion: verifier votre role, puis SAFE_MODE si applicable.
      </div>
    </div>
  `;
}
