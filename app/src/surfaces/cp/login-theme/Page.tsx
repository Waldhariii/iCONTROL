import React from "react";
import { useThemeAdminState } from "./queries";
import { useThemeAdminCommands } from "./commands";
import type { AppKind } from "@/platform/theme/types";
import { getRole } from "@/runtime/rbac";
import { buildActorContext } from "@/platform/securityContext";
import { guardAdminGlobalTheme } from "@/platform/guards/adminGuards";

const BASE_FIELDS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "--app-bg-primary", label: "App background", placeholder: "#0f1115" },
  { key: "--app-bg-secondary", label: "Background secondary", placeholder: "#0a0c10" },
  { key: "--app-bg-gradient", label: "Background gradient", placeholder: "linear-gradient(...)" },
  { key: "--surface-0", label: "Surface 0", placeholder: "#151a1f" },
  { key: "--surface-1", label: "Surface 1", placeholder: "#171c22" },
  { key: "--surface-border", label: "Surface border", placeholder: "#262d35" },
  { key: "--text-primary", label: "Text primary", placeholder: "#e6e9ee" },
  { key: "--text-muted", label: "Text muted", placeholder: "#9aa3ad" },
  { key: "--accent-primary", label: "Accent primary", placeholder: "#5a8fff" },
  { key: "--accent-glow", label: "Accent glow", placeholder: "rgba(90,143,255,0.25)" },
];

const CP_LOGIN_FIELDS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: "--cp-login-page-bg", label: "Login page background", placeholder: "var(--app-bg-primary)" },
  { key: "--cp-login-panel-bg", label: "Login panel background", placeholder: "var(--surface-0)" },
  { key: "--cp-login-card-bg", label: "Login card background", placeholder: "var(--surface-1)" },
  { key: "--cp-login-input-bg", label: "Login input background", placeholder: "#101419" },
  { key: "--cp-login-button-bg", label: "Login button", placeholder: "var(--accent-primary)" },
];

export default function LoginThemePage() {
  const { tenantId, overrides, modePreference, setModePreference } = useThemeAdminState();
  const { saveOverrides, resetOverrides, setModePreference: applyMode } = useThemeAdminCommands();
  const [appKind, setAppKind] = React.useState<AppKind>("CP");
  const [status, setStatus] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>(() => overrides.theme?.CP ?? {});
  const decision = React.useMemo(() => {
    const runtimeRole = getRole();
    const mappedRole =
      runtimeRole === "ADMIN" || runtimeRole === "SYSADMIN" || runtimeRole === "DEVELOPER"
        ? "admin"
        : "viewer";
    const actor = buildActorContext({ tenantId, role: mappedRole });
    return guardAdminGlobalTheme(actor);
  }, [tenantId]);

  React.useEffect(() => {
    const next = overrides.theme?.[appKind] ?? {};
    setForm({ ...next });
  }, [overrides, appKind]);

  const fields = appKind === "CP" ? [...BASE_FIELDS, ...CP_LOGIN_FIELDS] : BASE_FIELDS;

  const onChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setStatus("Sauvegarde en cours...");
    await saveOverrides(appKind, form);
    setStatus("✅ Thème global sauvegardé.");
    setTimeout(() => setStatus(null), 2500);
  };

  const onReset = async () => {
    setStatus("Réinitialisation...");
    await resetOverrides(appKind);
    setStatus("✅ Thème réinitialisé.");
    setTimeout(() => setStatus(null), 2500);
  };

  const onModeChange = (value: "dark" | "light" | "auto") => {
    setModePreference(value);
    applyMode(value);
  };

  if (!decision.allow) {
    return (
      <div className="ic-theme-page">
        <section className="ic-theme-card">
          <h1 className="ic-theme-title">Accès refusé</h1>
          <p className="ic-theme-note">
            Cette section nécessite la capacité <b>canAdminGlobalTheme</b>.
          </p>
          <p className="ic-theme-note">Code: {decision.reasonCode}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="ic-theme-page">
      <header className="ic-theme-header">
        <h1 className="ic-theme-title">Theme Studio</h1>
        <p className="ic-theme-subtitle">
          Thème global du fabricant pour tous les tenants. Aucun hardcoding — uniquement des tokens CSS.
        </p>
      </header>

      <section className="ic-theme-card">
        <div className="ic-theme-row">
          <div className="ic-theme-stack">
            <span className="ic-theme-label">App cible</span>
            <select
              className="ic-theme-select"
              value={appKind}
              onChange={(e) => setAppKind(e.target.value as AppKind)}
            >
              <option value="CP">Control Plane (Admin)</option>
              <option value="APP">Application Client</option>
            </select>
          </div>

          <div className="ic-theme-stack">
            <span className="ic-theme-label">Mode utilisateur</span>
            <select
              className="ic-theme-select"
              value={modePreference}
              onChange={(e) => onModeChange(e.target.value as "dark" | "light" | "auto")}
            >
              <option value="dark">Sombre</option>
              <option value="light">Clair</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="ic-theme-stack">
            <span className="ic-theme-label">Tenant actif</span>
            <div className="ic-theme-pill">{tenantId}</div>
          </div>
        </div>

        <div className="ic-theme-grid">
          {fields.map((field) => (
            <label key={field.key} className="ic-theme-field">
              <span className="ic-theme-field-label">{field.label}</span>
              <input
                className="ic-theme-input"
                value={form[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
              <span className="ic-theme-field-hint">{field.key}</span>
            </label>
          ))}
        </div>

        <div className="ic-theme-actions">
          <button className="ic-theme-btn ic-theme-btn--primary" onClick={onSave}>
            Sauvegarder
          </button>
          <button className="ic-theme-btn" onClick={onReset}>
            Réinitialiser
          </button>
          {status ? <span className="ic-theme-status">{status}</span> : null}
        </div>
      </section>

      <section className="ic-theme-card ic-theme-card--note">
        <h2 className="ic-theme-section-title">À propos</h2>
        <p className="ic-theme-note">
          Les couleurs définies ici s’appliquent à tous les tenants. Les utilisateurs peuvent choisir
          leur mode sombre, clair ou automatique sans modifier ces tokens.
        </p>
      </section>
    </div>
  );
}
