import React, { useState } from "react";
import { authenticateManagement } from "@/localAuth";
import { navigate } from "@/runtime/navigate";

export function CpLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const res = authenticateManagement(username, password);
    if (res.ok) {
      navigate("#/dashboard");
      return;
    }
    setError(res.error);
  };

  return (
    <div className="page-container login-page">
      <h1 className="login-title">CP / LOGIN</h1>
      <p className="login-subtitle">Authentification locale (dev).</p>

      <form className="login-card" onSubmit={onSubmit}>
        <label className="login-label">
          Utilisateur
          <input
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
          />
        </label>

        <label className="login-label">
          Mot de passe
          <input
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin"
            type="password"
            autoComplete="current-password"
          />
        </label>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="login-actions">
          <button type="submit" className="btn-primary">Se connecter</button>
        </div>

        <div className="login-hint">
          Comptes dev: admin/admin, sysadmin/sysadmin, developer/developer, master/1234
        </div>
      </form>
    </div>
  );
}
