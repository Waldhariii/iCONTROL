import { authenticate } from "/src/localAuth";
import { navigate } from "/src/router";
import { MAIN_SYSTEM_THEME } from "./_shared/mainSystem.data";

const TOK = MAIN_SYSTEM_THEME.tokens;
const CARD_STYLE =
  `max-width:520px;margin:40px auto;padding:18px;border-radius:18px;` +
  `background:${TOK.card};border:1px solid ${TOK.border};color:${TOK.text};`;
const INPUT_STYLE =
  `padding:10px 12px;border-radius:12px;border:1px solid ${TOK.border};` +
  `background:${TOK.panel};color:${TOK.text};`;
const ACTION_STYLE =
  `padding:10px 12px;border-radius:12px;border:1px solid ${TOK.border};` +
  `background:${TOK.accent2};color:${TOK.text};font-weight:800;cursor:pointer;`;
const MUTED_STYLE = `color:${TOK.mutedText};`;
const LINK_STYLE = `color:${TOK.mutedText};text-decoration:underline;`;

export function renderLogin(root: HTMLElement): void {
  root.innerHTML = `
    <div style="${CARD_STYLE}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-size:20px;font-weight:900">Connexion</div>
        <div style="display:flex;align-items:center;gap:10px">
          <select id="lang" style="background:${TOK.panel};color:${TOK.text};border:1px solid ${TOK.border};padding:6px 10px;border-radius:10px">
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
        <div id="err" style="min-height:18px;color:${TOK.accent}"></div>
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
    const res = authenticate(u.value, p.value);
    if (!res.ok) { err.textContent = res.error; return; }
    navigate("#/dashboard");
  };

  btn.onclick = submit;
  p.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
}
