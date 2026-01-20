/**
 // @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * owner: core-platform
 * expiry: TBD
 * risk: LOW
 * file: modules/core-system/ui/frontend-ts/pages/login.ts
 * created_at: 2026-01-20T01:13:27.385Z
 *
 * Rationale:
 * - Stub de compilation pour unblock bundling/tests.
 * - À remplacer par une implémentation réelle avant prod.
 */

import { authenticate, authenticateManagement } from "/src/localAuth";
import { navigate } from "/src/router";
const CARD_STYLE =
  `max-width:520px;margin:40px auto;padding:18px;border-radius:18px;` +
  "background:var(--ic-card);border:1px solid var(--ic-border);color:var(--ic-text);";
const INPUT_STYLE =
  "padding:10px 12px;border-radius:12px;border:1px solid var(--ic-border);" +
  "background:var(--ic-panel);color:var(--ic-text);";
const ACTION_STYLE =
  "padding:10px 12px;border-radius:12px;border:1px solid var(--ic-border);" +
  "background:var(--ic-accent2);color:var(--ic-text);font-weight:800;cursor:pointer;";
const MUTED_STYLE = "color:var(--ic-mutedText);";
const LINK_STYLE = "color:var(--ic-mutedText);text-decoration:underline;";

export function renderLogin(root: HTMLElement): void {
  root.innerHTML = `
    <div style="${CARD_STYLE}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-size:20px;font-weight:900">Connexion</div>
        <div style="display:flex;align-items:center;gap:10px">
          <select id="lang" style="background:var(--ic-panel);color:var(--ic-text);border:1px solid var(--ic-border);padding:6px 10px;border-radius:10px">
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
          <a href="#/login" id="forgot" style="${LINK_STYLE}">Mot de passe oublié</a>
        </div>
      </div>

      <div style="margin-top:14px;${MUTED_STYLE}">Entrez vos identifiants.</div>

      <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
        <input id="u" placeholder="Nom d’utilisateur" style="${INPUT_STYLE}" />
        <input id="p" type="password" placeholder="Mot de passe" style="${INPUT_STYLE}" />
        <div id="err" style="min-height:18px;color:var(--ic-accent)"></div>
        <button id="btn" style="${ACTION_STYLE}">Se connecter</button>
      </div>
    </div>
  `;

  const u = root.querySelector<HTMLInputElement>("#u")!;
  const p = root.querySelector<HTMLInputElement>("#p")!;
  const err = root.querySelector<HTMLDivElement>("#err")!;
  const btn = root.querySelector<HTMLButtonElement>("#btn")!;

  const submit = () => {
    err.textContent = "";
    const isCP =
      (import.meta as any)?.env?.VITE_APP_KIND === "CONTROL_PLANE" ||
      (typeof window !== "undefined" &&
        window.location.pathname.startsWith("/cp"));
    const res = isCP
      ? authenticateManagement(u.value, p.value)
      : authenticate(u.value, p.value);
    if (!res.ok) {
      err.textContent = res.error;
      return;
    }
    navigate("#/dashboard");
  };

  btn.onclick = submit;
  p.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}
