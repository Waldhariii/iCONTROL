import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { useCpPref } from "@/platform/prefs/useCpPref";
import { useProvidersQuery } from "./queries";
import { useProvidersCommands } from "./commands";
import { Sparkline } from "./components/Sparkline";
import { canAccessProviders, canWriteProviders } from "@/runtime/rbac";
import { getSession } from "@/localAuth";
import { getApiBase } from "@/core/runtime/apiBase";
import styles from "./ProvidersPage.module.css";

const DEFAULT_DAYS = 14;

type SortSpec = {
  key: "id" | "name" | "type" | "status" | "health";
  dir: "asc" | "desc";
};

type ProvidersPrefs = {
  type: string;
  status: string;
  health: string;
  search: string;
  sort: SortSpec[];
  days: number;
  compact: "normal" | "compact" | "dense";
  syncDensity?: boolean;
};

function getHashState() {
  const hash = window.location.hash || "#/providers";
  const [path, query] = hash.split("?");
  const safePath = path || "#/providers";
  const params = new URLSearchParams(query || "");
  return { path: safePath, params };
}

function buildHash(path: string, params: URLSearchParams) {
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

const DEFAULT_PREFS: ProvidersPrefs = {
  type: "all",
  status: "all",
  health: "all",
  search: "",
  sort: [{ key: "name", dir: "asc" }],
  days: DEFAULT_DAYS,
  compact: "normal",
  syncDensity: true,
};

export default function ProvidersPage() {
  const { tenantId } = useTenantContext();
  const [prefs, setPrefs, { loading: prefsLoading }] = useCpPref<ProvidersPrefs>("providers_ui", DEFAULT_PREFS);
  const hasHydrated = !prefsLoading;
  const { data, isLoading, error, refresh, metrics } = useProvidersQuery(prefs?.days ?? DEFAULT_DAYS);
  const { createProvider, updateProvider, deleteProvider } = useProvidersCommands();

  const [form, setForm] = React.useState({
    id: "",
    name: "",
    type: "storage",
    status: "ACTIVE",
    health_status: "OK",
    fallback_provider_id: "",
    config_json: "{}",
  });
  const [statusMap, setStatusMap] = React.useState<Record<string, string>>({});
  const [healthMap, setHealthMap] = React.useState<Record<string, string>>({});
  const [fallbackMap, setFallbackMap] = React.useState<Record<string, string>>({});
  const [configMap, setConfigMap] = React.useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const filterType = prefs?.type ?? "all";
  const filterStatus = prefs?.status ?? "all";
  const filterHealth = prefs?.health ?? "all";
  const filterSearch = prefs?.search ?? "";
  const sortSpecs = prefs?.sort ?? [{ key: "name" as const, dir: "asc" as const }];
  const days = prefs?.days ?? DEFAULT_DAYS;
  const compact = prefs?.compact ?? "normal";
  const syncDensity = prefs?.syncDensity ?? true;
  const setFilterType = (v: string) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, type: v }));
  const setFilterStatus = (v: string) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, status: v }));
  const setFilterHealth = (v: string) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, health: v }));
  const setFilterSearch = (v: string) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, search: v }));
  const setSortSpecs = (v: SortSpec[] | ((prev: SortSpec[]) => SortSpec[])) =>
    setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, sort: typeof v === "function" ? v(p?.sort ?? DEFAULT_PREFS.sort) : v }));
  const setDays = (v: number) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, days: v }));
  const setCompact = (v: "normal" | "compact" | "dense") => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, compact: v }));
  const setSyncDensity = (v: boolean) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, syncDensity: v }));
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const canWrite = canAccessProviders() && canWriteProviders();

  const applyGlobalDensity = React.useCallback(async () => {
    try {
      if (!syncDensity) return;
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
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data?: { value?: string } };
        const mode = json?.data?.value;
        if (mode === "compact" || mode === "dense" || mode === "normal") {
          setCompact(mode);
        }
      }
    } catch {
      // ignore
    }
  }, [syncDensity, tenantId]);

  React.useEffect(() => {
    const applyFromHash = () => {
      const { params } = getHashState();
      const type = params.get("type");
      const status = params.get("status");
      const health = params.get("health");
      const search = params.get("q");
      const sort = params.get("sort");
      const dir = params.get("dir");
      if (type) setFilterType(type);
      if (status) setFilterStatus(status);
      if (health) setFilterHealth(health);
      if (search) setFilterSearch(search);
      if (sort) {
        const allowedKeys: SortSpec["key"][] = ["id", "name", "type", "status", "health"];
        const keys = sort
          .split(",")
          .map((k) => k.trim())
          .filter((k): k is SortSpec["key"] => allowedKeys.includes(k as SortSpec["key"]));
        const dirs = (dir || "").split(",").filter(Boolean) as SortSpec["dir"][];
        if (keys.length) {
          const next: SortSpec[] = keys.map((key, i) => ({
            key,
            dir: dirs[i] === "desc" ? "desc" : "asc",
          }));
          setSortSpecs(next);
        }
      }
      const daysParam = Number(params.get("days"));
      if (!Number.isNaN(daysParam) && daysParam >= 3 && daysParam <= 30) {
        setDays(daysParam);
      }
    };

    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  /* Prefs persistence handled by useCpPref */

  React.useEffect(() => {
    if (syncDensity) {
      void applyGlobalDensity();
    }
  }, [syncDensity, applyGlobalDensity]);

  React.useEffect(() => {
    if (!hasHydrated) return;
    const { path, params } = getHashState();
    if (filterType !== "all") params.set("type", filterType); else params.delete("type");
    if (filterStatus !== "all") params.set("status", filterStatus); else params.delete("status");
    if (filterHealth !== "all") params.set("health", filterHealth); else params.delete("health");
    if (filterSearch) params.set("q", filterSearch); else params.delete("q");
    if (days !== DEFAULT_DAYS) params.set("days", String(days)); else params.delete("days");
    const sortKeys = sortSpecs.map((s) => s.key).join(",");
    const sortDirs = sortSpecs.map((s) => s.dir).join(",");
    params.set("sort", sortKeys);
    params.set("dir", sortDirs);
    const nextHash = buildHash(path, params);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }, [filterType, filterStatus, filterHealth, filterSearch, sortSpecs, hasHydrated]);

  const filteredData = React.useMemo(() => {
    const search = filterSearch.trim().toLowerCase();
    const filtered = data.filter((row) => {
      if (filterType !== "all" && row.type !== filterType) return false;
      if (filterStatus !== "all" && row.status !== filterStatus) return false;
      if (filterHealth !== "all" && row.health_status !== filterHealth) return false;
      if (!search) return true;
      return (
        row.id.toLowerCase().includes(search) ||
        row.name.toLowerCase().includes(search) ||
        row.type.toLowerCase().includes(search)
      );
    });
    const compare = (a: string, b: string) => (a || "").localeCompare(b || "", "fr", { sensitivity: "base" });
    return filtered.sort((a, b) => {
      for (const spec of sortSpecs) {
        let res = 0;
        if (spec.key === "id") res = compare(a.id, b.id);
        if (spec.key === "name") res = compare(a.name, b.name);
        if (spec.key === "type") res = compare(a.type, b.type);
        if (spec.key === "status") res = compare(a.status, b.status);
        if (spec.key === "health") res = compare(a.health_status ?? "UNKNOWN", b.health_status ?? "UNKNOWN");
        if (res !== 0) return spec.dir === "asc" ? res : -res;
      }
      return 0;
    });
  }, [data, filterType, filterStatus, filterHealth, filterSearch, sortSpecs]);

  const toggleSort = (key: SortSpec["key"], shiftKey: boolean) => {
    setSortSpecs((prev) => {
      const existingIndex = prev.findIndex((spec) => spec.key === key);
      if (existingIndex === -1) {
        return shiftKey ? [...prev, { key, dir: "asc" }] : [{ key, dir: "asc" }];
      }
      const existing = prev[existingIndex];
      if (!existing) return prev;
      const nextDir = existing.dir === "asc" ? "desc" : "asc";
      const next = [...prev];
      const updated: SortSpec = { ...existing, dir: nextDir };
      next[existingIndex] = updated;
      return shiftKey ? next : [updated];
    });
  };

  const sortIndicator = (key: SortSpec["key"]) => {
    const index = sortSpecs.findIndex((spec) => spec.key === key);
    if (index === -1) return "";
    const spec = sortSpecs[index];
    if (!spec) return "";
    const dir = spec.dir === "asc" ? "▲" : "▼";
    return `${dir}${index + 1}`;
  };

  const resetSort = () => {
    setSortSpecs([{ key: "name", dir: "asc" }]);
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setFilterHealth("all");
    setFilterSearch("");
    setDays(DEFAULT_DAYS);
  };

  const providerStats = React.useMemo(() => {
    const stats = {
      total: data.length,
      active: 0,
      disabled: 0,
      experimental: 0,
      healthOk: 0,
      healthWarn: 0,
      healthErr: 0,
      healthUnknown: 0,
      fallback: 0,
      missingConfig: 0,
      invalidConfig: 0,
      byType: {} as Record<string, number>,
    };
    data.forEach((row) => {
      stats.byType[row.type] = (stats.byType[row.type] ?? 0) + 1;
      if (row.status === "ACTIVE") stats.active += 1;
      if (row.status === "DISABLED") stats.disabled += 1;
      if (row.status === "EXPERIMENTAL") stats.experimental += 1;
      if (row.health_status === "OK") stats.healthOk += 1;
      if (row.health_status === "WARN") stats.healthWarn += 1;
      if (row.health_status === "ERR") stats.healthErr += 1;
      if (row.health_status === "UNKNOWN" || !row.health_status) stats.healthUnknown += 1;
      if (row.fallback_provider_id) stats.fallback += 1;
      if (!row.config_json) {
        stats.missingConfig += 1;
      } else {
        try {
          JSON.parse(row.config_json);
        } catch {
          stats.invalidConfig += 1;
        }
      }
    });
    return stats;
  }, [data]);

  const onSaveConfig = async (rowId: string) => {
    const row = data.find((r) => r.id === rowId);
    if (!row) return;
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setBusyId(rowId);
    setMessage(null);
    const res = await updateProvider({
      id: row.id,
      name: row.name,
      type: row.type,
      status: statusMap[row.id] ?? row.status,
      health_status: healthMap[row.id] ?? row.health_status ?? "UNKNOWN",
      fallback_provider_id: fallbackMap[row.id] ?? row.fallback_provider_id ?? "",
      config_json: configMap[row.id] ?? row.config_json ?? "{}",
    });
    if (res.ok) {
      await refresh();
      setMessage("✅ Config mise à jour.");
    } else {
      setMessage(`Erreur: ${res.code}${res.reason ? ` (${res.reason})` : ""}`);
    }
    setBusyId(null);
  };

  React.useEffect(() => {
    const next: Record<string, string> = {};
    const nextHealth: Record<string, string> = {};
    const nextFallback: Record<string, string> = {};
    const nextConfig: Record<string, string> = {};
    data.forEach((row) => {
      next[row.id] = row.status;
      nextHealth[row.id] = row.health_status ?? "UNKNOWN";
      nextFallback[row.id] = row.fallback_provider_id ?? "";
      nextConfig[row.id] = row.config_json ?? "{}";
    });
    setStatusMap(next);
    setHealthMap(nextHealth);
    setFallbackMap(nextFallback);
    setConfigMap(nextConfig);
  }, [data]);

  const onCreate = async () => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setMessage(null);
    const res = await createProvider({ ...form });
    if (res.ok) {
      setForm({
        id: "",
        name: "",
        type: "storage",
        status: "ACTIVE",
        health_status: "OK",
        fallback_provider_id: "",
        config_json: "{}",
      });
      await refresh();
      setMessage("✅ Provider créé.");
    } else {
      setMessage(`Erreur: ${res.code}${res.reason ? ` (${res.reason})` : ""}`);
    }
  };

  const onUpdate = async (rowId: string) => {
    const row = data.find((r) => r.id === rowId);
    if (!row) return;
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setBusyId(rowId);
    setMessage(null);
    const res = await updateProvider({
      id: row.id,
      name: row.name,
      type: row.type,
      status: statusMap[row.id] ?? row.status,
      health_status: healthMap[row.id] ?? row.health_status ?? "UNKNOWN",
      fallback_provider_id: fallbackMap[row.id] ?? row.fallback_provider_id ?? "",
      config_json: configMap[row.id] ?? row.config_json ?? "{}",
    });
    if (res.ok) {
      await refresh();
      setMessage("✅ Provider mis à jour.");
    } else {
      setMessage(`Erreur: ${res.code}${res.reason ? ` (${res.reason})` : ""}`);
    }
    setBusyId(null);
  };

  const onDelete = async (rowId: string) => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    const ok = window.confirm("Supprimer ce provider?");
    if (!ok) return;
    setBusyId(rowId);
    setMessage(null);
    const res = await deleteProvider({ id: rowId });
    if (res.ok) {
      await refresh();
      setMessage("✅ Provider supprimé.");
    } else {
      setMessage(`Erreur: ${res.code}${res.reason ? ` (${res.reason})` : ""}`);
    }
    setBusyId(null);
  };

  if (!canAccessProviders()) {
    return (
      <div className="ic-admin-page">
        <header className="ic-admin-header">
          <h1 className="ic-admin-title">CP / PROVIDERS</h1>
          <p className="ic-admin-subtitle">Accès refusé.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-admin-page">
      <header className="ic-admin-header">
        <h1 className="ic-admin-title">CP / PROVIDERS</h1>
        <p className="ic-admin-subtitle">Gestion des providers activés par le fabricant.</p>
      </header>

      <section className="ic-admin-meta">
        <div className="ic-admin-pill">
          <span>Tenant actif</span>
          <strong>{tenantId}</strong>
        </div>
        <div className="ic-admin-pill">
          <span>Total</span>
          <strong>{isLoading ? "…" : data.length}</strong>
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Insights providers</h2>
        <div className="gallery-grid">
          <div className="gallery-card">
            <div className="gallery-card-title">Statuts</div>
            <div className="gallery-card-body">
              {isLoading
                ? "Chargement..."
                : `Actifs: ${providerStats.active} • Désactivés: ${providerStats.disabled} • Expérimentaux: ${providerStats.experimental}`}
            </div>
          </div>
          <div className="gallery-card">
            <div className="gallery-card-title">Santé</div>
            <div className="gallery-card-body">
              {isLoading
                ? "Chargement..."
                : `OK: ${providerStats.healthOk} • WARN: ${providerStats.healthWarn} • ERR: ${providerStats.healthErr} • UNKNOWN: ${providerStats.healthUnknown}`}
            </div>
          </div>
          <div className="gallery-card">
            <div className="gallery-card-title">Fallback</div>
            <div className="gallery-card-body">
              {isLoading
                ? "Chargement..."
                : `${providerStats.fallback}/${providerStats.total} providers avec fallback`}
            </div>
          </div>
          <div className="gallery-card">
            <div className="gallery-card-title">Config JSON</div>
            <div className="gallery-card-body">
              {isLoading
                ? "Chargement..."
                : `Manquants: ${providerStats.missingConfig} • Invalides: ${providerStats.invalidConfig}`}
            </div>
          </div>
          <div className="gallery-card">
            <div className="gallery-card-title">Types</div>
            <div className="gallery-card-body">
              {isLoading
                ? "Chargement..."
                : Object.entries(providerStats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => `${type}: ${count}`)
                    .join(" • ")}
            </div>
          </div>
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Ajouter un provider</h2>
        <div className="ic-admin-form">
          <input
            className="ic-admin-input"
            placeholder="ID (optionnel)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <input
            className="ic-admin-input"
            placeholder="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="ic-admin-select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            disabled={!canWrite}
          >
            <option value="storage">Storage</option>
            <option value="ocr">OCR</option>
            <option value="messaging">Messaging</option>
            <option value="payments">Payments</option>
            <option value="generic">Generic</option>
          </select>
          <select
            className="ic-admin-select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            disabled={!canWrite}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
            <option value="EXPERIMENTAL">EXPERIMENTAL</option>
          </select>
          <select
            className="ic-admin-select"
            value={form.health_status}
            onChange={(e) => setForm({ ...form, health_status: e.target.value })}
            disabled={!canWrite}
          >
            <option value="OK">OK</option>
            <option value="WARN">WARN</option>
            <option value="ERR">ERR</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
          <input
            className="ic-admin-input"
            placeholder="Fallback provider ID"
            value={form.fallback_provider_id}
            onChange={(e) => setForm({ ...form, fallback_provider_id: e.target.value })}
            disabled={!canWrite}
          />
          <textarea
            className="ic-admin-textarea"
            placeholder='{"region":"us-east"}'
            value={form.config_json}
            onChange={(e) => setForm({ ...form, config_json: e.target.value })}
            disabled={!canWrite}
          />
          <button className="ic-admin-btn ic-admin-btn--primary" onClick={onCreate} disabled={!canWrite}>
            Créer
          </button>
        </div>
        {message ? <div className="ic-admin-message">{message}</div> : null}
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Providers existants</h2>
        {error ? <div className="ic-admin-alert">Erreur: {error}</div> : null}
        <div className="ic-admin-filters">
          <input
            className="ic-admin-input ic-admin-input--inline"
            placeholder="Rechercher (id, nom, type)"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <select
            className="ic-admin-select ic-admin-select--inline"
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value="7">Période: 7j</option>
            <option value="14">Période: 14j</option>
            <option value="30">Période: 30j</option>
          </select>
          <select
            className="ic-admin-select ic-admin-select--inline"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Type: tous</option>
            <option value="storage">Storage</option>
            <option value="ocr">OCR</option>
            <option value="messaging">Messaging</option>
            <option value="payments">Payments</option>
            <option value="generic">Generic</option>
          </select>
          <select
            className="ic-admin-select ic-admin-select--inline"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Status: tous</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
            <option value="EXPERIMENTAL">EXPERIMENTAL</option>
          </select>
          <select
            className="ic-admin-select ic-admin-select--inline"
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value)}
          >
            <option value="all">Health: tous</option>
            <option value="OK">OK</option>
            <option value="WARN">WARN</option>
            <option value="ERR">ERR</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>
        <div className="ic-admin-filter-actions">
          <label className="ic-admin-toggle">
            <span>Mode</span>
            <select
              className="ic-admin-select ic-admin-select--inline"
              value={compact}
              onChange={(e) => setCompact(e.target.value as "normal" | "compact" | "dense")}
              disabled={syncDensity}
            >
              <option value="normal">Normal</option>
              <option value="compact">Compact</option>
              <option value="dense">Super compact</option>
            </select>
          </label>
          <label className="ic-admin-toggle">
            <input
              type="checkbox"
              checked={syncDensity}
              onChange={(e) => setSyncDensity(e.target.checked)}
            />
            <span>Sync densité globale</span>
          </label>
          <button className="ic-admin-btn" onClick={resetSort}>
            Reset tri
          </button>
          <button className="ic-admin-btn" onClick={resetFilters}>
            Reset filtres
          </button>
        </div>
        <div className="ic-admin-filter-chips">
          <button
            className={`ic-admin-chip-btn ${filterStatus === "ACTIVE" ? "is-active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === "ACTIVE" ? "all" : "ACTIVE")}
          >
            Actifs
          </button>
          <button
            className={`ic-admin-chip-btn ${filterStatus === "EXPERIMENTAL" ? "is-active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === "EXPERIMENTAL" ? "all" : "EXPERIMENTAL")}
          >
            Experimental
          </button>
          <button
            className={`ic-admin-chip-btn ${filterHealth === "ERR" ? "is-active" : ""}`}
            onClick={() => setFilterHealth(filterHealth === "ERR" ? "all" : "ERR")}
          >
            Health ERR
          </button>
          <button
            className={`ic-admin-chip-btn ${filterHealth === "WARN" ? "is-active" : ""}`}
            onClick={() => setFilterHealth(filterHealth === "WARN" ? "all" : "WARN")}
          >
            Health WARN
          </button>
          <button
            className={`ic-admin-chip-btn ${filterStatus === "DISABLED" ? "is-active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === "DISABLED" ? "all" : "DISABLED")}
          >
            Désactivés
          </button>
          <button className="ic-admin-chip-btn" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>
        {sortSpecs.length ? (
          <div className="ic-admin-sort-chips">
            {sortSpecs.map((spec, index) => (
              <span key={`${spec.key}-${index}`} className="ic-admin-chip">
                {spec.key} {spec.dir === "asc" ? "▲" : "▼"} {index + 1}
                <button
                  className="ic-admin-chip-remove"
                  onClick={() =>
                    setSortSpecs((prev) => {
                      const next = prev.filter((_, i) => i !== index);
                      return next.length ? next : [{ key: "name", dir: "asc" }];
                    })
                  }
                  aria-label="Retirer ce tri"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div
          className={`ic-admin-table ic-admin-table--sticky ${
            compact === "compact"
              ? "ic-admin-table--compact"
              : compact === "dense"
                ? "ic-admin-table--dense"
                : ""
          }`}
        >
          <div className="ic-admin-row ic-admin-row--head ic-admin-row--providers-adv">
            <button className="ic-admin-sort" onClick={(e) => toggleSort("id", e.shiftKey)}>
              ID {sortIndicator("id")}
            </button>
            <button className="ic-admin-sort" onClick={(e) => toggleSort("name", e.shiftKey)}>
              Nom {sortIndicator("name")}
            </button>
            <button className="ic-admin-sort" onClick={(e) => toggleSort("type", e.shiftKey)}>
              Type {sortIndicator("type")}
            </button>
            <button className="ic-admin-sort" onClick={(e) => toggleSort("status", e.shiftKey)}>
              Status {sortIndicator("status")}
            </button>
            <button className="ic-admin-sort" onClick={(e) => toggleSort("health", e.shiftKey)}>
              Health {sortIndicator("health")}
            </button>
            <span>Fallback</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="ic-admin-row ic-admin-row--providers-adv">
              <span>Chargement...</span>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            filteredData.map((row) => {
              const healthValue = healthMap[row.id] ?? row.health_status ?? "UNKNOWN";
              const statusValue = statusMap[row.id] ?? row.status;
              const isExpanded = expandedId === row.id;
              return (
                <div key={row.id} className="ic-admin-row-group">
                  <div className="ic-admin-row ic-admin-row--providers-adv">
                    <span>{row.id}</span>
                    <span>{row.name}</span>
                    <span className="ic-admin-chip">{row.type}</span>
                    <span>
                      <select
                        className="ic-admin-select ic-admin-select--inline"
                        value={statusValue}
                        onChange={(e) => setStatusMap({ ...statusMap, [row.id]: e.target.value })}
                        disabled={!canWrite}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DISABLED">DISABLED</option>
                        <option value="EXPERIMENTAL">EXPERIMENTAL</option>
                      </select>
                    </span>
                    <span className={`ic-admin-badge ic-admin-badge--${healthValue.toLowerCase()}`}>
                      {healthValue}
                    </span>
                    <span>
                      <input
                        className="ic-admin-input ic-admin-input--inline"
                        value={fallbackMap[row.id] ?? row.fallback_provider_id ?? ""}
                        onChange={(e) => setFallbackMap({ ...fallbackMap, [row.id]: e.target.value })}
                        placeholder="none"
                        disabled={!canWrite}
                      />
                    </span>
                    <span className="ic-admin-actions">
                      <button
                        className="ic-admin-btn"
                        onClick={() => onUpdate(row.id)}
                        disabled={busyId === row.id || !canWrite}
                      >
                        Mettre à jour
                      </button>
                      <button
                        className="ic-admin-btn"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        disabled={busyId === row.id}
                      >
                        {isExpanded ? "Fermer" : "Config"}
                      </button>
                      <button
                        className="ic-admin-btn ic-admin-btn--danger"
                        onClick={() => onDelete(row.id)}
                        disabled={busyId === row.id || !canWrite}
                      >
                        Supprimer
                      </button>
                    </span>
                  </div>
                  {isExpanded ? (
                    <div className="ic-admin-row-detail">
                      <div className="ic-admin-row-detail-header">
                        <span>Configuration JSON</span>
                        <div className="ic-admin-row-detail-tools">
                          <span
                            className={`ic-admin-badge ${
                              (() => {
                                try {
                                  JSON.parse(configMap[row.id] ?? row.config_json ?? "{}");
                                  return "ic-admin-badge--ok";
                                } catch {
                                  return "ic-admin-badge--err";
                                }
                              })()
                            }`}
                          >
                            {(() => {
                              try {
                                JSON.parse(configMap[row.id] ?? row.config_json ?? "{}");
                                return "JSON OK";
                              } catch {
                                return "JSON ERR";
                              }
                            })()}
                          </span>
                          <button
                            className="ic-admin-btn"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(configMap[row.id] ?? row.config_json ?? "{}");
                                const pretty = JSON.stringify(parsed, null, 2);
                                setConfigMap({ ...configMap, [row.id]: pretty });
                              } catch {
                                setMessage("JSON invalide: format non applicable.");
                              }
                            }}
                            disabled={busyId === row.id}
                          >
                            Formater
                          </button>
                          <button
                            className="ic-admin-btn ic-admin-btn--primary"
                            onClick={() => onSaveConfig(row.id)}
                            disabled={busyId === row.id || !canWrite}
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="ic-admin-textarea"
                        value={configMap[row.id] ?? row.config_json ?? "{}"}
                        onChange={(e) => setConfigMap({ ...configMap, [row.id]: e.target.value })}
                        disabled={!canWrite}
                      />
                      <div className="ic-admin-row-metrics">
                        <div className="ic-admin-mini-chart">
                          <span className="ic-admin-mini-label">Activity ({DEFAULT_DAYS}j)</span>
                          {(() => {
                            const series = metrics?.series?.[row.id];
                            const labels = metrics?.labels ?? [];
                            if (!series) {
                              return <span className="ic-admin-mini-empty">Aucune donnée</span>;
                            }
                            return <Sparkline values={series} labels={labels} />;
                          })()}
                        </div>
                      </div>
                      <div className="ic-admin-mini-chart">
                        <div
                          className={`ic-admin-mini-bar ic-admin-mini-bar--${statusValue.toLowerCase()}`}
                        />
                        <div
                          className={`ic-admin-mini-bar ic-admin-mini-bar--${healthValue.toLowerCase()}`}
                        />
                        <span className="ic-admin-mini-text">
                          Status: {statusValue} • Health: {healthValue}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          {!isLoading && filteredData.length === 0 ? (
            <div className="ic-admin-empty">Aucun provider.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
