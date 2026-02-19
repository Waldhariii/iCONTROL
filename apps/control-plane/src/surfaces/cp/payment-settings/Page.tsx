import React from "react";
import { useCpPref } from "@/platform/prefs/useCpPref";
import styles from "./PaymentSettingsPage.module.css";

const AVAILABLE_PROVIDERS = [
  { id: "mock", name: "Mock Provider (Dev)", icon: "🧪", requiresConfig: false },
  { id: "stripe", name: "Stripe", icon: "💳", requiresConfig: true },
  { id: "paypal", name: "PayPal", icon: "🅿️", requiresConfig: true },
  { id: "paddle", name: "Paddle", icon: "🚣", requiresConfig: true },
  { id: "square", name: "Square", icon: "⬛", requiresConfig: true },
  { id: "razorpay", name: "Razorpay", icon: "💰", requiresConfig: true },
];

export default function PaymentSettingsPage() {
  const [providerPref, setProviderPref] = useCpPref<string>("payment_provider", "mock");
  const [configPref, setConfigPref] = useCpPref<Record<string, string>>("payment_config", {});
  const activeProvider = providerPref ?? "mock";
  const setActiveProvider = (v: string) => setProviderPref(v);
  const config = configPref ?? {};
  const setConfig = (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
    setConfigPref(typeof v === "function" ? v(config) : v);
  const [showConfig, setShowConfig] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSaveProvider = () => {
    setProviderPref(activeProvider);
    setConfigPref(config);
    setMessage("✅ Configuration sauvegardée");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setTestResult("⏳ Test en cours...");
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
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Provider Configuration</h1>
        <p className={styles.subtitle}>Choisissez et configurez votre fournisseur de paiement</p>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.activeBlock}>
        <div className={styles.activeRow}>
          <span className={styles.activeIcon}>{selectedProvider?.icon}</span>
          <div>
            <div className={styles.activeLabel}>Provider actif</div>
            <div className={styles.activeName}>{selectedProvider?.name}</div>
          </div>
        </div>
        <button type="button" onClick={handleTestConnection} className={styles.btnSecondary}>
          Tester la connexion
        </button>
        {testResult && <div className={styles.testResult}>{testResult}</div>}
      </div>

      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Providers disponibles</h2>
        <div className={styles.providersGrid}>
          {AVAILABLE_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveProvider(provider.id);
                setShowConfig(provider.requiresConfig);
              }}
              onKeyDown={(e) => e.key === "Enter" && (setActiveProvider(provider.id), setShowConfig(provider.requiresConfig))}
              className={activeProvider === provider.id ? `${styles.providerCard} ${styles.providerCardActive}` : styles.providerCard}
            >
              <div className={styles.providerIcon}>{provider.icon}</div>
              <div className={activeProvider === provider.id ? styles.providerNameActive : styles.providerName}>
                {provider.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfig && activeProvider !== "mock" && (
        <div className={styles.configBlock}>
          <h3 className={styles.configH3}>Configuration {selectedProvider?.name}</h3>
          <div className={styles.field}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              value={config.apiKey || ""}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk_test_..."
              className={styles.input}
            />
          </div>
          {activeProvider === "paypal" && (
            <div className={styles.field}>
              <label className={styles.label}>Client ID</label>
              <input
                type="text"
                value={config.clientId || ""}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder="AYxxxxxxxx..."
                className={styles.input}
              />
            </div>
          )}
          <div className={styles.hint}>
            ⚠️ Ces clés seront stockées de manière sécurisée. En production, utilisez des variables d'environnement.
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={handleSaveProvider} className={styles.btnPrimary}>
          Sauvegarder la configuration
        </button>
      </div>

      <div className={styles.infoBlock}>
        <h4 className={styles.infoH4}>ℹ️ À propos des providers</h4>
        <ul className={styles.infoList}>
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
