import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { useBrandingQuery } from "./queries";
import { useBrandingCommands } from "./commands";
import { canAccessBranding, canWriteBranding } from "@/runtime/rbac";

export default function BrandingPage() {
  const { tenantId } = useTenantContext();
  const { data, isLoading, error, refresh } = useBrandingQuery();
  const { updateBranding } = useBrandingCommands();

  const [logoUrl, setLogoUrl] = React.useState("");
  const [primaryColor, setPrimaryColor] = React.useState("#3b82f6");
  const [message, setMessage] = React.useState<string | null>(null);
  const canWrite = canAccessBranding() && canWriteBranding();

  React.useEffect(() => {
    if (!data) return;
    setLogoUrl(data.logo_url || "");
    setPrimaryColor(data.primary_color || "#3b82f6");
  }, [data]);

  const onSave = async () => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setMessage(null);
    const res = await updateBranding({ logo_url: logoUrl, primary_color: primaryColor });
    if (!res.ok) {
      setMessage(`Erreur: ${res.code}`);
      return;
    }
    await refresh();
    setMessage("✅ Branding sauvegardé.");
  };

  if (!canAccessBranding()) {
    return (
      <div className="ic-admin-page">
        <header className="ic-admin-header">
          <h1 className="ic-admin-title">CP / BRANDING</h1>
          <p className="ic-admin-subtitle">Accès refusé.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-admin-page">
      <header className="ic-admin-header">
        <h1 className="ic-admin-title">CP / BRANDING</h1>
        <p className="ic-admin-subtitle">Identité visuelle du tenant actif.</p>
      </header>

      <section className="ic-admin-meta">
        <div className="ic-admin-pill">
          <span>Tenant actif</span>
          <strong>{tenantId}</strong>
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Paramètres</h2>
        {error ? <div className="ic-admin-alert">Erreur: {error}</div> : null}
        <div className="ic-admin-form">
          <input
            className="ic-admin-input"
            placeholder="Logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            disabled={!canWrite}
          />
          <input
            className="ic-admin-input"
            placeholder="#3b82f6"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            disabled={!canWrite}
          />
          <button className="ic-admin-btn ic-admin-btn--primary" onClick={onSave} disabled={isLoading || !canWrite}>
            Sauvegarder
          </button>
        </div>
        {message ? <div className="ic-admin-message">{message}</div> : null}
      </section>
    </div>
  );
}
