import { coreBaseStyles } from "../../shared/coreStyles";
import { authenticate, getSession } from "../../../../../../core-kernel/security/auth/localAuth";

export function renderLoginPage(): string {
  const s = getSession();
  const already = s ? `<div class="cxOk">Session active: <b>${s.username}</b> (${s.role})</div>` : "";
  return `
    ${coreBaseStyles()}
    <div class="cxTopRight">
      <select class="cxLang" id="cxLang">
        <option value="fr" selected>FR</option>
        <option value="en">EN</option>
      </select>
      <a class="cxLink" href="#/login?forgot=1" id="cxForgot">Mot de passe oublié</a>
    </div>

    <div class="cxWrap">
      <div class="cxCard" role="region" aria-label="Login">
        <div class="cxTitle"><span>i</span>CONTROL — Connexion</div>
        <div class="cxMuted">Accès sécurisé au système. Auth locale (bootstrap) pour démarrage, prêt pour Auth Provider ultérieur.</div>

        <div class="cxField">
          <label class="cxLabel" for="cxUser">Identifiant</label>
          <input class="cxInput" id="cxUser" autocomplete="username" placeholder="ex: sysadmin, Waldhari" />
        </div>

        <div class="cxField">
          <label class="cxLabel" for="cxPass">Mot de passe</label>
          <input class="cxInput" id="cxPass" type="password" autocomplete="current-password" placeholder="••••••••" />
        </div>

        <button class="cxBtn" id="cxLoginBtn" type="button">Se connecter</button>

        <div id="cxLoginMsg"></div>
        ${already}
      </div>
    </div>
  `;
}

export function bindLoginEvents(host: { navigate: (r: string) => void }) {
  const u = document.getElementById("cxUser") as HTMLInputElement | null;
  const p = document.getElementById("cxPass") as HTMLInputElement | null;
  const b = document.getElementById("cxLoginBtn") as HTMLButtonElement | null;
  const msg = document.getElementById("cxLoginMsg") as HTMLDivElement | null;

  if (!u || !p || !b || !msg) return;

  const setMsg = (html: string) => { msg.innerHTML = html; };

  const doLogin = () => {
    const user = (u.value || "").trim();
    const pass = (p.value || "").trim();

    if (!user || !pass) {
      setMsg(`<div class="cxErr">Veuillez entrer un identifiant et un mot de passe.</div>`);
      return;
    }

    const s = authenticate(user, pass);
    if (!s) {
      setMsg(`<div class="cxErr">Identifiant invalide.</div>`);
      return;
    }

    setMsg(`<div class="cxOk">Connecté: <b>${s.username}</b> (${s.role}). Redirection…</div>`);
    host.navigate("#/dashboard");
  };

  b.onclick = doLogin;
  p.onkeydown = (e) => { if (e.key === "Enter") doLogin(); };
  u.onkeydown = (e) => { if (e.key === "Enter") doLogin(); };
}
