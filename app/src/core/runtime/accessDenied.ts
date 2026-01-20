import { recordObs } from "./audit";
import { OBS } from "./obs";

export const ACCESS_DENIED_MARKER = "ICONTROL_ACCESS_DENIED_V1";

export function renderAccessDenied(root: HTMLElement, reason: string): void {
  recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "ui.accessDenied", detail: reason });
  root.innerHTML = `
    <div data-testid="access-denied"
         style="padding:14px;border-radius:18px;background:var(--ic-card, #1e1e1e);border:1px solid var(--ic-border, #2b3136);">
      <div style="font-weight:900;font-size:16px;margin-bottom:6px;color:var(--ic-text, #e7ecef);">Access denied</div>
      <div style="color:var(--ic-mutedText, #a7b0b7);font-size:13px;">
        Raison: <span style="color:var(--ic-text, #e7ecef);font-weight:700;">${reason}</span>
      </div>
      <div style="margin-top:10px;color:var(--ic-mutedText, #a7b0b7);font-size:12px;">
        Suggestion: verifier votre role, puis SAFE_MODE si applicable.
      </div>
    </div>
  `;
}
