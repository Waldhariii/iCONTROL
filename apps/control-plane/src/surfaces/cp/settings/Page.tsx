import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { navigate } from "@/router";
import {
  canAccessBranding,
  canAccessThemeStudio,
  canAccessTenants,
  canAccessProviders,
  canAccessPolicies,
  canAccessSecurity
} from "@/runtime/rbac";
import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";

import { enforceCpEntitlementsSurface } from "../../../core/ports/cpSurfaceEnforcement.entitlements";
import { governedRedirect } from "../../../core/runtime/governedRedirect";

export function CpSettingsPage() {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const { tenantId } = useTenantContext();
  const [summary, setSummary] = React.useState<{ tenants: number; providers: number; policies: number; security: number; updatedAt: string } | null>(null);
  const [providers, setProviders] = React.useState<Array<{ id: string; name: string; type: string; status: string }>>([]);
  const [policies, setPolicies] = React.useState<Array<{ id: string; name: string; status: string }>>([]);
  const [security, setSecurity] = React.useState<Array<{ id: string; name: string; status: string }>>([]);
  const [tenants, setTenants] = React.useState<Array<{ id: string; name: string; plan: string }>>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [density, setDensity] = React.useState<"normal" | "compact" | "dense">("normal");
  const [densitySaving, setDensitySaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Dev-friendly: allow settings surface to render in local dev without full identity bootstrap.
        const isLocalDev =
          ((import.meta as any)?.env?.DEV === true) ||
          (typeof window !== "undefined" &&
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"));
        if (isLocalDev) {
          setAllowed(true);
          return;
        }
      } catch {}
      const result = await enforceCpEntitlementsSurface({ appKind: "CP" });
      if (!alive) return;
      setAllowed(result.allow);
      if (!result.allow) governedRedirect({ kind: "blocked", reason: result.reasonCode });
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    const API_BASE = getApiBase();
    const fetchJson = async <T,>(path: string): Promise<T> => {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} on ${path}`);
      }
      return res.json() as Promise<T>;
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryRes, providersRes, policiesRes, securityRes, tenantsRes] = await Promise.all([
          fetchJson<{ success: boolean; data: { tenants: number; providers: number; policies: number; security: number; updatedAt: string } }>("/api/cp/settings-summary"),
          fetchJson<{ success: boolean; data: Array<{ id: string; name: string; type: string; status: string }> }>("/api/cp/providers"),
          fetchJson<{ success: boolean; data: Array<{ id: string; name: string; status: string }> }>("/api/cp/policies"),
          fetchJson<{ success: boolean; data: Array<{ id: string; name: string; status: string }> }>("/api/cp/security"),
          fetchJson<{ success: boolean; data: Array<{ id: string; name: string; plan: string }> }>("/api/tenants"),
        ]);

        if (!alive) return;
        setSummary(summaryRes.data);
        setProviders(providersRes.data);
        setPolicies(policiesRes.data);
        setSecurity(securityRes.data);
        setTenants(tenantsRes.data);
      } catch (err) {
        if (!alive) return;
        setError(String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tenantId]);

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

  const applyDensityClass = (mode: "normal" | "compact" | "dense") => {
    const root = document.documentElement;
    root.classList.remove("ic-density-compact", "ic-density-dense");
    if (mode === "compact") root.classList.add("ic-density-compact");
    if (mode === "dense") root.classList.add("ic-density-dense");
  };

  const saveDensity = async (next: "normal" | "compact" | "dense") => {
    setDensity(next);
    applyDensityClass(next);
    try {
      setDensitySaving(true);
      try {
        const s = getSession();
        const user = String((s as any)?.username || (s as any)?.userId || "anonymous");
        const storageKey = `icontrol:cp:density:${tenantId}:${user}`;
        localStorage.setItem(storageKey, next);
      } catch {}
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
    } finally {
      setDensitySaving(false);
    }
  };

  if (allowed !== true) {
    return (
      <div className="ic-settings-page">
        <header className="ic-settings-header">
          <h1 className="ic-settings-title">CP / SETTINGS</h1>
          <p className="ic-settings-subtitle">Accès refusé ou identité runtime manquante.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-settings-page">
      <header className="ic-settings-header">
        <h1 className="ic-settings-title">CP / SETTINGS</h1>
        <p className="ic-settings-subtitle">
          Configuration centrale du Control Plane. Tous les changements sont gouvernés et traçables.
        </p>
      </header>

      {canAccessThemeStudio() ? (
        <section className="ic-settings-card ic-settings-card--highlight">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Theme Studio</h2>
          <p className="ic-settings-card-desc">
            Définis les tokens de thème globaux (CP + App Client) sans hardcoding. Mode sombre/clair/auto.
          </p>
        </div>
        <div className="ic-settings-card-actions">
          <button className="ic-settings-btn ic-settings-btn--primary" onClick={() => navigate("#/theme-studio")}>
            Ouvrir Theme Studio
          </button>
        </div>
      </section>
      ) : null}

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Densité globale</h2>
          <p className="ic-settings-card-desc">
            Ajuste la densité de toutes les tables et listes CP (normal, compact, super compact).
          </p>
        </div>
        <div className="ic-settings-card-actions">
          <select
            className="ic-settings-select"
            value={density}
            onChange={(e) => saveDensity(e.target.value as "normal" | "compact" | "dense")}
          >
            <option value="normal">Normal</option>
            <option value="compact">Compact</option>
            <option value="dense">Super compact</option>
          </select>
          <span className="ic-settings-inline-meta">
            {densitySaving ? "Enregistrement..." : "Appliqué"}
          </span>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Résumé opérationnel</h2>
          <p className="ic-settings-card-desc">Vue synthèse des éléments gouvernés.</p>
        </div>
        {error ? (
          <div className="ic-settings-alert">Erreur de chargement: {error}</div>
        ) : (
          <div className="ic-settings-summary-grid">
            <div className="ic-settings-summary-item">
              <span className="ic-settings-summary-label">Tenants</span>
              <span className="ic-settings-summary-value">{summary?.tenants ?? "—"}</span>
            </div>
            <div className="ic-settings-summary-item">
              <span className="ic-settings-summary-label">Providers</span>
              <span className="ic-settings-summary-value">{summary?.providers ?? "—"}</span>
            </div>
            <div className="ic-settings-summary-item">
              <span className="ic-settings-summary-label">Policies</span>
              <span className="ic-settings-summary-value">{summary?.policies ?? "—"}</span>
            </div>
            <div className="ic-settings-summary-item">
              <span className="ic-settings-summary-label">Sécurité</span>
              <span className="ic-settings-summary-value">{summary?.security ?? "—"}</span>
            </div>
            <div className="ic-settings-summary-item ic-settings-summary-item--wide">
              <span className="ic-settings-summary-label">Dernière mise à jour</span>
              <span className="ic-settings-summary-value">{summary?.updatedAt ?? "—"}</span>
            </div>
          </div>
        )}
      </section>

      <section className="ic-settings-grid">
        {canAccessTenants() ? (
          <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Tenants</h3>
            <p className="ic-settings-card-desc">
              Gestion des tenants, plans et états d’activation.
            </p>
            <div className="ic-settings-inline-meta">
              <span>{tenants.length} tenant(s)</span>
            </div>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/tenants")}>
              Ouvrir les tenants
            </button>
          </div>
        </article>
        ) : null}

        {canAccessBranding() ? (
          <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Branding</h3>
            <p className="ic-settings-card-desc">
              Palette et identité visuelle pour le tenant actif. Changements contrôlés par gouvernance.
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/branding")}>
              Ouvrir Branding
            </button>
          </div>
        </article>
        ) : null}

        {canAccessSecurity() ? (
          <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Sécurité</h3>
            <p className="ic-settings-card-desc">
              Règles de sécurité, MFA, rotation de clés et politiques critiques.
            </p>
            <ul className="ic-settings-list">
              {security.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="ic-settings-pill">{item.status}</span>
                </li>
              ))}
              {!loading && security.length === 0 ? <li>Aucune règle</li> : null}
            </ul>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/security")}>
              Ouvrir Sécurité
            </button>
          </div>
        </article>
        ) : null}

        <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Utilisateurs & Rôles</h3>
            <p className="ic-settings-card-desc">
              Gestion des comptes, permissions et accès aux modules d’administration.
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/users")}>
              Gérer les utilisateurs
            </button>
          </div>
        </article>

        <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Entitlements</h3>
            <p className="ic-settings-card-desc">
              Activation des fonctionnalités, modules et capacités par plan ou tenant.
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/entitlements")}>
              Configurer
            </button>
          </div>
        </article>

        {canAccessPolicies() ? (
          <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Policies</h3>
            <p className="ic-settings-card-desc">
              Règles de gouvernance et décisions d’accès.
            </p>
            <ul className="ic-settings-list">
              {policies.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="ic-settings-pill">{item.status}</span>
                </li>
              ))}
              {!loading && policies.length === 0 ? <li>Aucune policy</li> : null}
            </ul>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/policies")}>
              Ouvrir Policies
            </button>
          </div>
        </article>
        ) : null}

        <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Pages & Routes</h3>
            <p className="ic-settings-card-desc">
              Catalogue des pages, routes et menus. Activation gouvernée par la console.
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/pages")}>
              Ouvrir le catalogue
            </button>
          </div>
        </article>

        <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Audit & Logs</h3>
            <p className="ic-settings-card-desc">
              Traçabilité complète des actions critiques et événements système.
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/audit")}>
              Consulter l’audit
            </button>
          </div>
        </article>

        {canAccessProviders() ? (
          <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Providers</h3>
            <p className="ic-settings-card-desc">
              Providers actifs (storage, OCR, messaging, paiements).
            </p>
            <ul className="ic-settings-list">
              {providers.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="ic-settings-pill">{item.status}</span>
                </li>
              ))}
              {!loading && providers.length === 0 ? <li>Aucun provider</li> : null}
            </ul>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/providers")}>
              Gérer les providers
            </button>
          </div>
        </article>
        ) : null}

        <article className="ic-settings-card">
          <div className="ic-settings-card-body">
            <h3 className="ic-settings-card-title">Intégrations</h3>
            <p className="ic-settings-card-desc">
              Providers et connexions externes (storage, OCR, messaging, paiements).
            </p>
          </div>
          <div className="ic-settings-card-actions">
            <button className="ic-settings-btn" onClick={() => navigate("#/integrations")}>
              Ouvrir
            </button>
          </div>
        </article>
      </section>

      <section className="ic-settings-footer">
        <div className="ic-settings-meta">
          <span className="ic-settings-meta-label">Tenant actif</span>
          <span className="ic-settings-meta-value">{tenantId}</span>
        </div>
        <div className="ic-settings-meta">
          <span className="ic-settings-meta-label">Mode</span>
          <span className="ic-settings-meta-value">Control Plane</span>
        </div>
      </section>
    </div>
  );
}
