import { useMemo, useState } from "react";
import { withSpan } from "../_shared/telemetry";

export default function Page(){
  return withSpan("login", () => {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const canSubmit = useMemo(()=> email.trim().length>3 && pwd.length>5, [email,pwd]);

    return (
      <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <h1>Connexion</h1>
        <p>Wave 1 — UI prête, branchement auth au prochain sprint (ports-first).</p>

        <label style={{ display:"block", marginTop: 16 }}>
          Courriel
          <input value={email} onChange={(e)=>setEmail(e.target.value)} style={{ display:"block", width:"100%", padding: 10, marginTop: 6 }} />
        </label>

        <label style={{ display:"block", marginTop: 12 }}>
          Mot de passe
          <input type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} style={{ display:"block", width:"100%", padding: 10, marginTop: 6 }} />
        </label>

        <button disabled={!canSubmit} style={{ marginTop: 16, padding: "10px 14px" }}>
          Se connecter
        </button>

        <div style={{ marginTop: 16, opacity: 0.8 }}>
          <a href="#/forgot">Mot de passe oublié?</a>
        </div>
      </div>
    );
  });
}
