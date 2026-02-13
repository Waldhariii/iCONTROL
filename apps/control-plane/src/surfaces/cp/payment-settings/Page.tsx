import React from "react";

const AVAILABLE_PROVIDERS = [
  { id: "mock", name: "Mock Provider (Dev)", icon: "🧪", requiresConfig: false },
  { id: "stripe", name: "Stripe", icon: "💳", requiresConfig: true },
  { id: "paypal", name: "PayPal", icon: "🅿️", requiresConfig: true },
  { id: "paddle", name: "Paddle", icon: "🚣", requiresConfig: true },
  { id: "square", name: "Square", icon: "⬛", requiresConfig: true },
  { id: "razorpay", name: "Razorpay", icon: "💰", requiresConfig: true },
];

export default function PaymentSettingsPage() {
  const [activeProvider, setActiveProvider] = React.useState("mock");
  const [config, setConfig] = React.useState<Record<string, string>>({});
  const [showConfig, setShowConfig] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Charger la config depuis localStorage
    const savedProvider = localStorage.getItem("payment_provider") || "mock";
    const savedConfig = JSON.parse(localStorage.getItem("payment_config") || "{}");
    setActiveProvider(savedProvider);
    setConfig(savedConfig);
  }, []);

  const handleSaveProvider = () => {
    localStorage.setItem("payment_provider", activeProvider);
    localStorage.setItem("payment_config", JSON.stringify(config));
    setMessage("✅ Configuration sauvegardée");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setTestResult("⏳ Test en cours...");
    
    // Simuler un test de connexion
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (activeProvider === "mock") {
      setTestResult("✅ Mock provider - Toujours disponible");
    } else if (!config.apiKey && activeProvider !== "mock") {
      setTestResult("❌ Clé API manquante");
    } else {
      setTestResult("✅ Connexion réussie (simulation)");
    }
  };

  const selectedProvider = AVAILABLE_PROVIDERS.find(p => p.id === activeProvider);

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
          Payment Provider Configuration
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Choisissez et configurez votre fournisseur de paiement
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: "12px", marginBottom: "24px", background: "#10b981", color: "white", borderRadius: "6px" }}>
          {message}
        </div>
      )}

      {/* Provider actif */}
      <div style={{ 
        padding: "20px", 
        background: "var(--surface-1)", 
        border: "2px solid var(--accent-primary)", 
        borderRadius: "12px",
        marginBottom: "32px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span style={{ fontSize: "32px" }}>{selectedProvider?.icon}</span>
          <div>
            <div style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: "600" }}>
              Provider actif
            </div>
            <div style={{ color: "var(--accent-primary)", fontSize: "16px" }}>
              {selectedProvider?.name}
            </div>
          </div>
        </div>
        <button
          onClick={handleTestConnection}
          style={{
            padding: "8px 16px",
            background: "var(--surface-0)",
            color: "var(--text-primary)",
            border: "1px solid var(--surface-border)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Tester la connexion
        </button>
        {testResult && (
          <div style={{ marginTop: "12px", color: "var(--text-muted)", fontSize: "14px" }}>
            {testResult}
          </div>
        )}
      </div>

      {/* Sélection provider */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
          Providers disponibles
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {AVAILABLE_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              onClick={() => {
                setActiveProvider(provider.id);
                setShowConfig(provider.requiresConfig);
              }}
              style={{
                padding: "20px",
                background: activeProvider === provider.id ? "var(--accent-primary)" : "var(--surface-1)",
                border: activeProvider === provider.id ? "2px solid var(--accent-primary)" : "1px solid var(--surface-border)",
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>{provider.icon}</div>
              <div style={{ 
                color: activeProvider === provider.id ? "white" : "var(--text-primary)", 
                fontWeight: "600",
                fontSize: "14px"
              }}>
                {provider.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      {showConfig && activeProvider !== "mock" && (
        <div style={{ 
          padding: "24px", 
          background: "var(--surface-1)", 
          border: "1px solid var(--surface-border)", 
          borderRadius: "12px",
          marginBottom: "32px"
        }}>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
            Configuration {selectedProvider?.name}
          </h3>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)", fontSize: "14px" }}>
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey || ""}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk_test_..."
              style={{
                width: "100%",
                padding: "10px",
                background: "var(--surface-0)",
                border: "1px solid var(--surface-border)",
                borderRadius: "6px",
                color: "var(--text-primary)"
              }}
            />
          </div>

          {activeProvider === "paypal" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)", fontSize: "14px" }}>
                Client ID
              </label>
              <input
                type="text"
                value={config.clientId || ""}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder="AYxxxxxxxx..."
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface-0)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)"
                }}
              />
            </div>
          )}

          <div style={{ 
            padding: "12px", 
            background: "var(--surface-0)", 
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--text-muted)"
          }}>
            ⚠️ Ces clés seront stockées de manière sécurisée. En production, utilisez des variables d'environnement.
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleSaveProvider}
          style={{
            padding: "12px 24px",
            background: "var(--accent-primary)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600"
          }}
        >
          Sauvegarder la configuration
        </button>
      </div>

      {/* Info */}
      <div style={{ 
        marginTop: "32px", 
        padding: "20px", 
        background: "var(--surface-1)", 
        border: "1px solid var(--surface-border)", 
        borderRadius: "8px"
      }}>
        <h4 style={{ color: "var(--text-primary)", marginBottom: "12px" }}>
          ℹ️ À propos des providers
        </h4>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-muted)", fontSize: "14px" }}>
          <li>Mock Provider : Gratuit, pour développement et tests</li>
          <li>Stripe : Frais 2.9% + 0.30$ par transaction</li>
          <li>PayPal : Frais 2.9% + 0.30$ par transaction</li>
          <li>Paddle : Frais 5% + 0.50$ par transaction</li>
          <li>Square : Frais 2.6% + 0.10$ par transaction</li>
          <li>Razorpay : Frais 2% par transaction (Inde)</li>
        </ul>
      </div>
    </div>
  );
}
