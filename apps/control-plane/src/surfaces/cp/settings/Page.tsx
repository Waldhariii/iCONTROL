import React from "react";
import { navigate } from "@/router";
// @ts-ignore
import catalog from "@config/ssot/ROUTE_CATALOG.json";
import { applyThemeModePreference, getStoredThemeModePreference, installAutoThemeModeListener } from "@/platform/theme/themeMode";
import { ICONTROL_KEYS } from "@/core/runtime/storageKeys";
import { webStorage } from "@/platform/storage/webStorage";
import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";
import { resolveRuntimeContext } from "@/platform/runtimeContext";

import { enforceCpEntitlementsSurface } from "../../../core/ports/cpSurfaceEnforcement.entitlements";
import { governedRedirect } from "../../../core/runtime/governedRedirect";

export function CpSettingsPage() {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const [navMode, setNavMode] = React.useState<"labels" | "icons">("labels");
  const [drawerDefaultOpen, setDrawerDefaultOpen] = React.useState<boolean>(true);
  const [dashPrefs, setDashPrefs] = React.useState<DashboardPrefs>(DASH_DEFAULTS);
  const [themeMode, setThemeMode] = React.useState<"dark" | "light" | "auto">("dark");
  const [language, setLanguage] = React.useState<string>("fr");
  const [density, setDensity] = React.useState<"normal" | "compact" | "dense">("normal");
  const [densitySaving, setDensitySaving] = React.useState<boolean>(false);
  const [motion, setMotion] = React.useState<"on" | "off">("on");
  const [notifications, setNotifications] = React.useState<"on" | "off">("on");
  const [shortcuts, setShortcuts] = React.useState<"on" | "off">("on");
  const [homeRoute, setHomeRoute] = React.useState<string>("#/dashboard");

  const NAV_MODE_KEY = "cp.nav.displayMode";
  const NAV_OPEN_KEY = "cp.nav.drawerOpen";
  const DASH_PREF_KEY = "cp.dashboard.prefs";

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
    try {
      const v = localStorage.getItem(NAV_MODE_KEY);
      if (v === "icons" || v === "labels") setNavMode(v);
      const d = localStorage.getItem(NAV_OPEN_KEY);
      if (d === "false") setDrawerDefaultOpen(false);
      if (d === "true") setDrawerDefaultOpen(true);
      const dp = localStorage.getItem(DASH_PREF_KEY);
      if (dp) {
        const parsed = JSON.parse(dp) as Partial<DashboardPrefs>;
        setDashPrefs({
          period: parsed.period === "24h" || parsed.period === "30d" ? parsed.period : "7d",
          hidden: Array.isArray(parsed.hidden) ? parsed.hidden.map(String) : [],
          gridOrder: Array.isArray(parsed.gridOrder) ? parsed.gridOrder.map(String) : [...DASH_DEFAULTS.gridOrder],
          chartOrder: Array.isArray(parsed.chartOrder) ? parsed.chartOrder.map(String) : [...DASH_DEFAULTS.chartOrder],
          tabsOrder: Array.isArray(parsed.tabsOrder) ? parsed.tabsOrder.map(String) : [],
          tabsHidden: Array.isArray(parsed.tabsHidden) ? parsed.tabsHidden.map(String) : []
        });
      }
      const tm = getStoredThemeModePreference();
      if (tm === "dark" || tm === "light" || tm === "auto") setThemeMode(tm);
      const lang = webStorage.get(ICONTROL_KEYS.settings.language);
      if (lang) setLanguage(lang);
      const m = webStorage.get(ICONTROL_KEYS.settings.motion);
      if (m === "off" || m === "on") setMotion(m);
      const n = webStorage.get(ICONTROL_KEYS.settings.notifications);
      if (n === "off" || n === "on") setNotifications(n);
      const s = webStorage.get(ICONTROL_KEYS.settings.shortcuts);
      if (s === "off" || s === "on") setShortcuts(s);
      const h = webStorage.get(ICONTROL_KEYS.settings.home);
      if (h && h.startsWith("#/")) setHomeRoute(h);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      if (motion === "off") document.documentElement.classList.add("ic-motion-off");
      else document.documentElement.classList.remove("ic-motion-off");
    } catch {}
  }, [motion]);

  const applyNavMode = (mode: "labels" | "icons") => {
    setNavMode(mode);
    try {
      localStorage.setItem(NAV_MODE_KEY, mode);
    } catch {}
    window.dispatchEvent(new CustomEvent("cp-settings:nav-mode", { detail: mode }));
  };

  const applyDrawerDefault = (open: boolean) => {
    setDrawerDefaultOpen(open);
    try {
      localStorage.setItem(NAV_OPEN_KEY, open ? "true" : "false");
    } catch {}
    window.dispatchEvent(new CustomEvent("cp-settings:drawer-open", { detail: open }));
  };

  const resetDisplay = () => {
    try {
      localStorage.removeItem(NAV_MODE_KEY);
      localStorage.removeItem(NAV_OPEN_KEY);
    } catch {}
    setNavMode("labels");
    setDrawerDefaultOpen(true);
    window.dispatchEvent(new CustomEvent("cp-settings:nav-mode", { detail: "labels" }));
    window.dispatchEvent(new CustomEvent("cp-settings:drawer-open", { detail: true }));
  };

  const writeDashPrefs = (next: DashboardPrefs) => {
    setDashPrefs(next);
    try {
      localStorage.setItem(DASH_PREF_KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new CustomEvent("cp-settings:dashboard-prefs", { detail: next }));
  };

  const toggleDashHidden = (id: string) => {
    const set = new Set(dashPrefs.hidden);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    writeDashPrefs({ ...dashPrefs, hidden: Array.from(set) });
  };

  const toggleTabHidden = (id: string) => {
    const set = new Set(dashPrefs.tabsHidden);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    writeDashPrefs({ ...dashPrefs, tabsHidden: Array.from(set) });
  };

  const moveOrderItem = (key: "gridOrder" | "chartOrder" | "tabsOrder", id: string, dir: -1 | 1) => {
    const list = (dashPrefs[key] || []).slice();
    if (!list.includes(id)) list.push(id);
    const idx = list.indexOf(id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= list.length) return;
    const copy = list.slice();
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    writeDashPrefs({ ...dashPrefs, [key]: copy });
  };

  const updateDashPeriod = (period: "24h" | "7d" | "30d") => {
    writeDashPrefs({ ...dashPrefs, period });
  };

  const resetDashPrefs = () => {
    writeDashPrefs({ ...DASH_DEFAULTS });
  };

  const orderByPrefs = <T extends { id: string }>(items: T[], order: string[]) => {
    if (!order || order.length === 0) return items;
    const index = new Map(order.map((item, i) => [item, i]));
    return items.slice().sort((a, b) => {
      const ai = index.has(a.id) ? (index.get(a.id) as number) : 9999;
      const bi = index.has(b.id) ? (index.get(b.id) as number) : 9999;
      if (ai !== bi) return ai - bi;
      return a.id.localeCompare(b.id);
    });
  };

  const titleizeRouteId = (routeId: string) =>
    routeId
      .replace(/^cp\./, "")
      .replace(/_cp$/, "")
      .replace(/_app$/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      .join(" ");

  const dashboardTabs = React.useMemo(() => {
    const routes = (catalog as any)?.routes ?? [];
    return routes
      .filter((r: any) => r && r.app_surface === "CP")
      .map((r: any) => {
        const nav = (r && typeof r.nav_visibility === "object") ? r.nav_visibility : null;
        if (!nav || nav.dashboard_tabs !== true) return null;
        const id = String(r.route_id || "");
        const label = titleizeRouteId(id || r.path || "");
        return { id, label };
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  }, []);

  const dashboardHomeOptions = React.useMemo(() => {
    const routes = (catalog as any)?.routes ?? [];
    return routes
      .filter((r: any) => r && r.app_surface === "CP")
      .filter((r: any) => typeof r.path === "string" && r.path.startsWith("#/"))
      .filter((r: any) => !String(r.route_id || "").includes("login"))
      .map((r: any) => {
        const id = String(r.route_id || r.path || "");
        const label = titleizeRouteId(id || r.path || "");
        return { id: String(r.path), label };
      })
      .filter((r: any) => r && r.id && r.label)
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }, []);

  const applyThemeMode = (mode: "dark" | "light" | "auto") => {
    setThemeMode(mode);
    applyThemeModePreference(mode);
    if (mode === "auto") installAutoThemeModeListener();
  };

  const applyLanguage = (next: string) => {
    const val = next || "fr";
    setLanguage(val);
    webStorage.set(ICONTROL_KEYS.settings.language, val);
    try {
      document.documentElement.lang = val;
    } catch {}
  };

  const applyMotion = (next: "on" | "off") => {
    setMotion(next);
    webStorage.set(ICONTROL_KEYS.settings.motion, next);
    if (next === "off") document.documentElement.classList.add("ic-motion-off");
    else document.documentElement.classList.remove("ic-motion-off");
  };

  const applyNotifications = (next: "on" | "off") => {
    setNotifications(next);
    webStorage.set(ICONTROL_KEYS.settings.notifications, next);
  };

  const applyShortcuts = (next: "on" | "off") => {
    setShortcuts(next);
    webStorage.set(ICONTROL_KEYS.settings.shortcuts, next);
    try {
      document.documentElement.dataset["icShortcuts"] = next;
    } catch {}
  };

  const applyHomeRoute = (next: string) => {
    const val = next || "#/dashboard";
    setHomeRoute(val);
    webStorage.set(ICONTROL_KEYS.settings.home, val);
  };

  const applyDensityClass = (mode: "normal" | "compact" | "dense") => {
    const root = document.documentElement;
    root.classList.remove("ic-density-compact", "ic-density-dense");
    if (mode === "compact") root.classList.add("ic-density-compact");
    if (mode === "dense") root.classList.add("ic-density-dense");
  };

  const loadDensity = React.useCallback(async () => {
    try {
      const ctx = resolveRuntimeContext({ fallbackAppKind: "CP" });
      const tenantId = ctx.tenantId || "default";
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
      if (mode === "compact" || mode === "dense" || mode === "normal") {
        setDensity(mode);
        applyDensityClass(mode);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void loadDensity();
  }, [loadDensity]);

  const saveDensity = async (next: "normal" | "compact" | "dense") => {
    setDensity(next);
    applyDensityClass(next);
    try {
      setDensitySaving(true);
      const ctx = resolveRuntimeContext({ fallbackAppKind: "CP" });
      const tenantId = ctx.tenantId || "default";
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
        localStorage.setItem(storageKey, next);
      } catch {}
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
          Personnalisation de l’application par l’utilisateur.
        </p>
      </header>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Préférences utilisateur</h2>
          <p className="ic-settings-card-desc">
            Gère les paramètres personnels, l’interface et les préférences de compte.
          </p>
        </div>
        <div className="ic-settings-card-actions">
          <button className="ic-settings-btn" onClick={() => navigate("#/account")}>
            Ouvrir mon compte
          </button>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Affichage de l’interface</h2>
          <p className="ic-settings-card-desc">
            Personnalise le mode de navigation et l’ouverture par défaut du menu.
          </p>
          <div className="ic-settings-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Menu latéral</div>
              <select
                className="ic-settings-select"
                value={navMode}
                onChange={(e) => applyNavMode(e.target.value === "icons" ? "icons" : "labels")}
              >
                <option value="labels">Libellés seulement</option>
                <option value="icons">Icônes seulement</option>
              </select>
              <div className="ic-settings-inline-meta">
                Affichage exclusif: jamais icône + texte en même temps.
              </div>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Ouverture du menu</div>
              <select
                className="ic-settings-select"
                value={drawerDefaultOpen ? "open" : "closed"}
                onChange={(e) => applyDrawerDefault(e.target.value !== "closed")}
              >
                <option value="open">Ouvert par défaut</option>
                <option value="closed">Fermé par défaut</option>
              </select>
              <div className="ic-settings-inline-meta">
                Le menu garde le dernier état et respecte ta préférence.
              </div>
            </div>
          </div>
        </div>
        <div className="ic-settings-card-actions">
          <button className="ic-settings-btn" onClick={resetDisplay}>
            Réinitialiser l’affichage
          </button>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Thème & interface</h2>
          <p className="ic-settings-card-desc">
            Choisis le mode visuel, la langue et la densité d’affichage.
          </p>
          <div className="ic-settings-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Mode d’affichage</div>
              <select
                className="ic-settings-select"
                value={themeMode}
                onChange={(e) => applyThemeMode((e.target.value as any) || "dark")}
              >
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
                <option value="auto">Auto (système)</option>
              </select>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Langue</div>
              <select
                className="ic-settings-select"
                value={language}
                onChange={(e) => applyLanguage(e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Densité</div>
              <select
                className="ic-settings-select"
                value={density}
                onChange={(e) => saveDensity((e.target.value as any) || "normal")}
              >
                <option value="normal">Standard</option>
                <option value="compact">Compact</option>
                <option value="dense">Dense</option>
              </select>
              <div className="ic-settings-inline-meta">
                {densitySaving ? "Sauvegarde en cours…" : "Préférence appliquée à ton profil CP."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Fonctions & environnement</h2>
          <p className="ic-settings-card-desc">
            Active ou désactive les animations, notifications et raccourcis.
          </p>
          <div className="ic-settings-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Animations</div>
              <select
                className="ic-settings-select"
                value={motion}
                onChange={(e) => applyMotion(e.target.value === "off" ? "off" : "on")}
              >
                <option value="on">Actives</option>
                <option value="off">Désactivées</option>
              </select>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Notifications</div>
              <select
                className="ic-settings-select"
                value={notifications}
                onChange={(e) => applyNotifications(e.target.value === "off" ? "off" : "on")}
              >
                <option value="on">Actives</option>
                <option value="off">Désactivées</option>
              </select>
              <div className="ic-settings-inline-meta">
                Les toasts seront masqués si désactivés.
              </div>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Raccourcis clavier</div>
              <select
                className="ic-settings-select"
                value={shortcuts}
                onChange={(e) => applyShortcuts(e.target.value === "off" ? "off" : "on")}
              >
                <option value="on">Actifs</option>
                <option value="off">Désactivés</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Page d’accueil</h2>
          <p className="ic-settings-card-desc">
            Définit la page ouverte par défaut (clic sur le logo ou retour accueil).
          </p>
          <div className="ic-settings-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Route</div>
              <select
                className="ic-settings-select"
                value={homeRoute}
                onChange={(e) => applyHomeRoute(e.target.value)}
              >
                {dashboardHomeOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="ic-settings-card">
        <div className="ic-settings-card-body">
          <h2 className="ic-settings-card-title">Dashboard — préférences</h2>
          <p className="ic-settings-card-desc">
            Choisis les widgets visibles, leur ordre, et les onglets affichés sur le Dashboard.
          </p>

          <div className="ic-settings-summary-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Période par défaut</div>
              <select
                className="ic-settings-select"
                value={dashPrefs.period}
                onChange={(e) => updateDashPeriod((e.target.value as any) || "7d")}
              >
                <option value="24h">24 heures</option>
                <option value="7d">Derniers 7 jours</option>
                <option value="30d">30 jours</option>
              </select>
            </div>
          </div>

          <div className="ic-settings-summary-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Widgets — visibilité</div>
              <ul className="ic-settings-list">
                {DASH_WIDGETS.map((w) => {
                  const checked = !dashPrefs.hidden.includes(w.id);
                  return (
                    <li key={w.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDashHidden(w.id)}
                        />{" "}
                        {w.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Ordre — widgets principaux</div>
              <ul className="ic-settings-list">
                {orderByPrefs(DASH_GRID_WIDGETS, dashPrefs.gridOrder).map((w) => (
                  <li key={w.id}>
                    {w.label}{" "}
                    <button
                      type="button"
                      className="ic-settings-pill"
                      onClick={() => moveOrderItem("gridOrder", w.id, -1)}
                    >
                      ↑
                    </button>{" "}
                    <button
                      type="button"
                      className="ic-settings-pill"
                      onClick={() => moveOrderItem("gridOrder", w.id, 1)}
                    >
                      ↓
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ic-settings-summary-grid">
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Ordre — graphiques</div>
              <ul className="ic-settings-list">
                {orderByPrefs(DASH_CHART_WIDGETS, dashPrefs.chartOrder).map((w) => (
                  <li key={w.id}>
                    {w.label}{" "}
                    <button
                      type="button"
                      className="ic-settings-pill"
                      onClick={() => moveOrderItem("chartOrder", w.id, -1)}
                    >
                      ↑
                    </button>{" "}
                    <button
                      type="button"
                      className="ic-settings-pill"
                      onClick={() => moveOrderItem("chartOrder", w.id, 1)}
                    >
                      ↓
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ic-settings-summary-item">
              <div className="ic-settings-summary-label">Onglets Dashboard</div>
              <ul className="ic-settings-list">
                {orderByPrefs(dashboardTabs, dashPrefs.tabsOrder).map((t) => {
                  const checked = !dashPrefs.tabsHidden.includes(t.id);
                  return (
                    <li key={t.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTabHidden(t.id)}
                        />{" "}
                        {t.label}
                      </label>{" "}
                      <button
                        type="button"
                        className="ic-settings-pill"
                        onClick={() => moveOrderItem("tabsOrder", t.id, -1)}
                      >
                        ↑
                      </button>{" "}
                      <button
                        type="button"
                        className="ic-settings-pill"
                        onClick={() => moveOrderItem("tabsOrder", t.id, 1)}
                      >
                        ↓
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <div className="ic-settings-card-actions">
          <button className="ic-settings-btn" onClick={resetDashPrefs}>
            Réinitialiser le Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}

type DashboardPrefs = {
  period: "24h" | "7d" | "30d";
  hidden: string[];
  gridOrder: string[];
  chartOrder: string[];
  tabsOrder: string[];
  tabsHidden: string[];
};

const DASH_DEFAULTS: DashboardPrefs = {
  period: "7d",
  hidden: [],
  gridOrder: ["health", "activity", "errors", "modules"],
  chartOrder: ["consumption", "incidents"],
  tabsOrder: [],
  tabsHidden: []
};

const DASH_WIDGETS = [
  { id: "kpi_hero", label: "KPIs (CPU / Latence)" },
  { id: "health", label: "Santé système" },
  { id: "activity", label: "Activité" },
  { id: "errors", label: "Erreurs" },
  { id: "modules", label: "Modules" },
  { id: "consumption", label: "Trafic / Consommation API" },
  { id: "incidents", label: "Incidents & Santé" },
  { id: "events", label: "Événements récents" }
];

const DASH_GRID_WIDGETS = [
  { id: "health", label: "Santé système" },
  { id: "activity", label: "Activité" },
  { id: "errors", label: "Erreurs" },
  { id: "modules", label: "Modules" }
];

const DASH_CHART_WIDGETS = [
  { id: "consumption", label: "Trafic / Consommation API" },
  { id: "incidents", label: "Incidents & Santé" }
];
