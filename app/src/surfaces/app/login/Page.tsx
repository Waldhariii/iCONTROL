import { getTenantIdSSOT } from "../../../core/tenant/tenantContext";
import { newCorrelationIdSSOT } from "../../../core/observability/correlation";
import { useMemo, useState } from "react";
import { withSpan } from "../_shared/telemetry";

export default function Page(){
  
  const tenantId = getTenantIdSSOT();
  void tenantId;
  void newCorrelationIdSSOT;
return withSpan("login", () => {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const canSubmit = useMemo(()=> email.trim().length>3 && pwd.length>5, [email,pwd]);

    return (
      <div className="icx-login-page-0-26f2f9cd00">
        <h1>Connexion</h1>
        <p>Wave 1 — UI prête, branchement auth au prochain sprint (ports-first).</p>

        <label className="icx-login-page-1-414cab0ddd">
          Courriel
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="icx-login-page-2-c2558552a0" />
        </label>

        <label className="icx-login-page-3-510086163b">
          Mot de passe
          <input type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} className="icx-login-page-4-cfbb0d6e90" />
        </label>

        <button disabled={!canSubmit} className="icx-login-page-5-21b6df7206">
          Se connecter
        </button>

        <div className="icx-login-page-6-f3f0814cd5">
          <a href="#/forgot">Mot de passe oublié?</a>
        </div>
      </div>
    );
  });
}
