import React from "react";
import { useThemeAdminState } from "./queries";
import { useThemeAdminCommands } from "./commands";
import type { AppKind } from "@/platform/theme/types";
import { canWriteTheme } from "@/runtime/rbac";
import { buildActorContext } from "@/platform/securityContext";
import { guardAdminGlobalTheme } from "@/platform/guards/adminGuards";
import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";
import { LocalStorageProvider } from "@/core/control-plane/storage";

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
  const [density, setDensity] = React.useState<"normal" | "compact" | "dense">("normal");
  const [densitySaving, setDensitySaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>(() => overrides.theme?.CP ?? {});
  const storage = React.useMemo(() => new LocalStorageProvider(""), []);
  const decision = React.useMemo(() => {
    const mappedRole = canWriteTheme() ? "admin" : "viewer";
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

  const isColorField = (key: string) =>
    key.includes("bg") ||
    key.includes("surface") ||
    key.includes("text") ||
    key.includes("accent") ||
    key.includes("border");

  const toHex = (value: string | undefined) => {
    if (!value) return "";
    const v = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      const r = v[1], g = v[2], b = v[3];
      return (`#${r}${r}${g}${g}${b}${b}`).toUpperCase();
    }
    return "";
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

  const applyDensityClass = (mode: "normal" | "compact" | "dense") => {
    const root = document.documentElement;
    root.classList.remove("ic-density-compact", "ic-density-dense");
    if (mode === "compact") root.classList.add("ic-density-compact");
    if (mode === "dense") root.classList.add("ic-density-dense");
  };

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const API_BASE = getApiBase();
        const s = getSession();
        const userId = String((s as any)?.username || (s as any)?.userId || "");
        const role = String((s as any)?.role || "USER").toUpperCase();
        const res = await fetch(`${API_BASE}/api/cp/prefs/cp_density`, {
          headers: {
            "x-tenant-id": tenantId,
            "x-user-id": userId,
            "x-user-role": role,
          },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { success: boolean; data?: { value?: string } | null };
        const mode = json?.data?.value;
        if (!alive) return;
        if (mode === "compact" || mode === "dense" || mode === "normal") {
          setDensity(mode);
          applyDensityClass(mode);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const saveDensity = async (next: "normal" | "compact" | "dense") => {
    setDensity(next);
    applyDensityClass(next);
    try {
      setDensitySaving(true);
      const API_BASE = getApiBase();
      const s = getSession();
      const userId = String((s as any)?.username || (s as any)?.userId || "");
      const role = String((s as any)?.role || "USER").toUpperCase();
      await fetch(`${API_BASE}/api/cp/prefs/cp_density`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": userId,
          "x-user-role": role,
        },
        body: JSON.stringify({ value: next }),
      });
      try {
        const storageKey = `icontrol:cp:density:${tenantId}:${userId || "anonymous"}`;
        storage.setItem(storageKey, next);
      } catch {}
    } finally {
      setDensitySaving(false);
    }
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

          <div className="ic-theme-stack">
            <span className="ic-theme-label">Densité globale CP</span>
            <select
              className="ic-theme-select"
              value={density}
              onChange={(e) => saveDensity(e.target.value as "normal" | "compact" | "dense")}
            >
              <option value="normal">Normal</option>
              <option value="compact">Compact</option>
              <option value="dense">Super compact</option>
            </select>
            <span className="ic-theme-field-hint">{densitySaving ? "Enregistrement..." : "Appliqué"}</span>
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
              {isColorField(field.key) ? (
                <div className="ic-theme-palette-wrap">
                  <div className="ic-theme-palette-head">
                    <input
                      type="color"
                      className="ic-theme-color-input"
                      value={toHex(form[field.key]) || "#000000"}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      aria-label="Couleur actuelle (sélecteur)"
                    />
                  </div>
                  <div className="ic-theme-palette">
                    <div className="ic-theme-palette-title">Couleurs</div>
                    <div className="ic-theme-palette-grid">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`ic-theme-swatch ${c.className}`}
                          onClick={() => onChange(field.key, c.value)}
                          aria-label={c.label}
                        />
                      ))}
                    </div>
                    <div className="ic-theme-palette-title">Dégradés</div>
                    <div className="ic-theme-palette-grid">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          className={`ic-theme-swatch ${g.className}`}
                          onClick={() => onChange(field.key, g.value)}
                          aria-label={g.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
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

const COLOR_PRESETS: Array<{ id: string; label: string; value: string; className: string }> = [
  { id: "c-charcoal", label: "Charcoal", value: "#0f1115", className: "ic-theme-swatch--charcoal" },
  { id: "c-slate", label: "Slate", value: "#141a22", className: "ic-theme-swatch--slate" },
  { id: "c-graphite", label: "Graphite", value: "#1f262f", className: "ic-theme-swatch--graphite" },
  { id: "c-ink", label: "Ink", value: "#0b0d10", className: "ic-theme-swatch--ink" },
  { id: "c-ice", label: "Ice", value: "#e6e9ee", className: "ic-theme-swatch--ice" },
  { id: "c-mist", label: "Mist", value: "#9aa3ad", className: "ic-theme-swatch--mist" },
  { id: "c-blue", label: "Blue", value: "#5a8fff", className: "ic-theme-swatch--blue" },
  { id: "c-cyan", label: "Cyan", value: "#2bd4f9", className: "ic-theme-swatch--cyan" },
  { id: "c-green", label: "Green", value: "#4ec9b0", className: "ic-theme-swatch--green" },
  { id: "c-amber", label: "Amber", value: "#f59e0b", className: "ic-theme-swatch--amber" },
  { id: "c-rose", label: "Rose", value: "#f472b6", className: "ic-theme-swatch--rose" },
  { id: "c-purple", label: "Purple", value: "#7b5cff", className: "ic-theme-swatch--purple" },
];

const GRADIENT_PRESETS: Array<{ id: string; label: string; value: string; className: string }> = [
  { id: "g-ocean", label: "Ocean", value: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #38bdf8 100%)", className: "ic-theme-swatch--ocean" },
  { id: "g-nebula", label: "Nebula", value: "linear-gradient(135deg, #111827 0%, #5b21b6 60%, #f472b6 100%)", className: "ic-theme-swatch--nebula" },
  { id: "g-forest", label: "Forest", value: "linear-gradient(135deg, #0b1510 0%, #14532d 55%, #34d399 100%)", className: "ic-theme-swatch--forest" },
  { id: "g-ember", label: "Ember", value: "linear-gradient(135deg, #1f2937 0%, #b45309 55%, #f59e0b 100%)", className: "ic-theme-swatch--ember" },
  { id: "g-aurora", label: "Aurora", value: "linear-gradient(135deg, #0b1320 0%, #1d4ed8 45%, #22d3ee 100%)", className: "ic-theme-swatch--aurora" },
  { id: "g-sunrise", label: "Sunrise", value: "linear-gradient(135deg, #111827 0%, #fb7185 50%, #f97316 100%)", className: "ic-theme-swatch--sunrise" },
];
