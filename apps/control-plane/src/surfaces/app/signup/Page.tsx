import React from "react";

export default function SignupPage() {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.email || !form.password || !form.companyName) {
      setError("Tous les champs sont requis");
      return;
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // Mock API - Créer tenant + user
      const tenantId = form.companyName.toLowerCase().replace(/\s+/g, "-");
      const newTenant = {
        id: tenantId,
        name: form.companyName,
        plan: "FREE",
        owner: {
          email: form.email,
          password: form.password,
        },
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder dans localStorage (mock)
      const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
      tenants.push(newTenant);
      localStorage.setItem("tenants", JSON.stringify(tenants));

      // Créer session
      localStorage.setItem("currentTenant", tenantId);
      localStorage.setItem("currentUser", form.email);

      // Redirect vers dashboard
      window.location.hash = "#/dashboard";
    } catch (err) {
      setError("Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-0)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "var(--surface-1)",
          padding: "40px",
          borderRadius: "12px",
          border: "1px solid var(--surface-border)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              color: "var(--accent-primary)",
              fontSize: "28px",
              fontWeight: "700",
              margin: "0 0 8px 0",
            }}
          >
            iCONTROL
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              background: "#ef4444",
              color: "white",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Nom de l&apos;entreprise *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Acme Corporation"
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--surface-0)",
                border: "1px solid var(--surface-border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vous@entreprise.com"
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--surface-0)",
                border: "1px solid var(--surface-border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Mot de passe *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--surface-0)",
                border: "1px solid var(--surface-border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Retapez votre mot de passe"
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--surface-0)",
                border: "1px solid var(--surface-border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#666" : "var(--accent-primary)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "16px",
            }}
          >
            {loading ? "Création en cours..." : "Créer mon compte gratuit"}
          </button>

          <div style={{ textAlign: "center" }}>
            
              href="#/login"
              style={{
                color: "var(--accent-primary)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Vous avez déjà un compte ? Se connecter
            </a>
          </div>
        </form>

        {/* Plan FREE info */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "var(--surface-0)",
            borderRadius: "6px",
            border: "1px solid var(--surface-border)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Plan FREE inclus :
          </p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 20px",
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            <li>Accès complet à toutes les fonctionnalités de base</li>
            <li>1 utilisateur</li>
            <li>1 GB de stockage</li>
            <li>Support communautaire</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
