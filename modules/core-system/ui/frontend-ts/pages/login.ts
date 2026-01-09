import { authenticate } from "../../../../app/src/localAuth";
import { navigate } from "../../../../app/src/router";

export function renderLogin(root: HTMLElement): void {
  root.innerHTML = `
    <div style="max-width:520px;margin:40px auto;padding:18px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-size:20px;font-weight:900">Connexion</div>
        <div style="display:flex;align-items:center;gap:10px">
          <select id="lang" style="background:transparent;color:inherit;border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:10px">
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
          <a href="#/login" id="forgot" style="color:inherit;opacity:.8;text-decoration:underline">Mot de passe oublié</a>
        </div>
      </div>

      <div style="margin-top:14px;opacity:.8">Entrez vos identifiants.</div>

      <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
        <input id="u" placeholder="Nom d’utilisateur" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
        <input id="p" type="password" placeholder="Mot de passe" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
        <div id="err" style="min-height:18px;color:#ff6b6b"></div>
        <button id="btn" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(183,217,75,0.15);color:inherit;font-weight:800;cursor:pointer">Se connecter</button>
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
