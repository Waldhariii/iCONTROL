/**
 * ICONTROL_CP_SUBSCRIPTION_V2
 * SSOT Abonnements — PageShell + Tabs + KPI + listes + analyse
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";
import { createContextualEmptyState } from "/src/core/ui/emptyState";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showToast } from "/src/core/ui/toast";
import { getRole } from "/src/runtime/rbac";
import { getMountEl } from "/src/router";
import { SUBSCRIPTION_TYPES } from "/src/core/subscriptions/subscriptionTypes";
import {
  getActiveSubscriptions,
  activateSubscription,
  deactivateSubscription,
  isSubscriptionActive
} from "/src/core/subscriptions/subscriptionManager";

type SubTab = "freemium" | "subscriptions" | "analysis";

type SubCategory =
  | "Infrastructure"
  | "Sécurité"
  | "OCR"
  | "Monitoring"
  | "Connecteurs"
  | "Analytics"
  | "IA"
  | "Stockage"
  | "Audit";

type SubscriptionItem = {
  id: string;
  name: string;
  category: SubCategory;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "AVAILABLE";
  plan: "FREE" | "PRO" | "ENTERPRISE";
  scope: "SYSTEM" | "APP";
  activatedAt?: string;
  expiresAt?: string;
  notes?: string;
};

type SubscriptionData = {
  freemium: {
    enabled: true;
    coreGuaranteed: true;
    modulesFree: Array<{ name: string; status: "ON" | "OFF"; note?: string }>;
  };
  items: SubscriptionItem[];
  analytics: {
    totalActive: number;
    totalExpired: number;
    totalAvailable: number;
    adoptionRatePct: number;
    topCategories: Array<{ category: SubCategory; active: number; available: number }>;
  };
  lastUpdated: string;
};

export async function renderSubscription(root: HTMLElement): Promise<void> {
  currentRoot = root;
  const renderLoading = () => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(getSafeMode());
    const { shell, content } = createPageShell({
      title: "Abonnements",
      subtitle: "Gestion freemium et modules optionnels (sans interruption du core gratuit)",
      safeMode: safeModeValue,
      statusBadge: { label: "FREEMIUM: ACTIF", tone: "ok" }
    });

    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      width: 100%;
    `;
    for (let i = 0; i < 4; i += 1) {
      const skeleton = document.createElement("div");
      skeleton.style.cssText = `
        height: 120px;
        border: 1px solid var(--ic-border, #2b3136);
        background: rgba(255,255,255,0.03);
        border-radius: 10px;
      `;
      grid.appendChild(skeleton);
    }
    content.appendChild(grid);
    root.appendChild(shell);
  };

  renderLoading();

  const { data, errors } = await getSubscriptionData();
  const currentTab = getCurrentTab();
  renderData(root, data, errors, currentTab);
}

function renderData(
  root: HTMLElement,
  data: SubscriptionData,
  errors: { data?: string; analytics?: string },
  tab: SubTab
): void {
  root.innerHTML = coreBaseStyles();
  const safeModeValue = mapSafeMode(getSafeMode());
  const canManage = canManageSubscriptions(getRole());
  const { shell, content } = createPageShell({
    title: "Abonnements",
    subtitle: "Gestion freemium et modules optionnels (sans interruption du core gratuit)",
    safeMode: safeModeValue,
    statusBadge: { label: "FREEMIUM: ACTIF", tone: "ok" }
  });

  const tabs = createTabs(tab);
  content.appendChild(tabs);

  if (tab === "freemium") {
    renderFreemiumTab(content, data, safeModeValue);
  } else if (tab === "subscriptions") {
    renderSubscriptionsTab(content, data, errors, safeModeValue, canManage);
  } else {
    renderAnalysisTab(content, data, errors);
  }

  root.appendChild(shell);
}

function renderFreemiumTab(content: HTMLElement, data: SubscriptionData, safeMode: "OFF" | "COMPAT" | "STRICT"): void {
  const { card: statusCard, body: statusBody } = createSectionCard({
    title: "État Freemium",
    description: "Core gratuit garanti — modules premium optionnels"
  });
  statusBody.appendChild(createBadge("CORE GRATUIT GARANTI", "ok"));
  const note = document.createElement("div");
  note.style.cssText = "font-size: 13px; color: var(--ic-mutedText, #a7b0b7);";
  note.textContent = "Le socle fonctionne sans abonnement. Les modules payants remplacent/améliorent sans casser le core.";
  statusBody.appendChild(note);
  statusBody.appendChild(createKpiRow("Mode Freemium", "Actif"));
  statusBody.appendChild(createKpiRow("Core", "Garanti"));
  statusBody.appendChild(createKpiRow("SAFE_MODE", safeMode === "STRICT" ? "Activations verrouillées" : safeMode === "COMPAT" ? "Compatibilité priorisée" : "Mode normal"));
  statusBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));
  content.appendChild(statusCard);

  const { card: modulesCard, body: modulesBody } = createSectionCard({
    title: "Modules gratuits",
    description: "Modules inclus dans le core gratuit"
  });
  if (data.freemium.modulesFree.length === 0) {
    modulesBody.appendChild(createContextualEmptyState("subscriptions", {
      onAdd: () => refreshSubscription(),
      onClearFilter: () => refreshSubscription()
    }));
  } else {
    data.freemium.modulesFree.forEach((mod) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 0; border-bottom: 1px solid var(--ic-border, #2b3136);";
      const label = document.createElement("div");
      label.textContent = mod.name;
      label.style.cssText = "font-size: 13px; color: var(--ic-text, #e7ecef);";
      const right = document.createElement("div");
      right.style.cssText = "display:flex; gap:8px; align-items:center;";
      right.appendChild(createBadge(mod.status === "ON" ? "ON" : "OFF", mod.status === "ON" ? "ok" : "neutral"));
      if (mod.note) {
        const noteEl = document.createElement("span");
        noteEl.textContent = mod.note;
        noteEl.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
        right.appendChild(noteEl);
      }
      row.appendChild(label);
      row.appendChild(right);
      modulesBody.appendChild(row);
    });
  }
  content.appendChild(modulesCard);
}

function renderSubscriptionsTab(
  content: HTMLElement,
  data: SubscriptionData,
  errors: { data?: string; analytics?: string },
  safeMode: "OFF" | "COMPAT" | "STRICT",
  canManage: boolean
): void {
  const kpiGrid = document.createElement("div");
  kpiGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
  `;

  const { card: kpiActive, body: kpiActiveBody } = createSectionCard({
    title: "Actifs",
    description: "Abonnements actifs"
  });
  kpiActiveBody.appendChild(createKpiRow("Total", formatNumber(data.analytics.totalActive), data.analytics.totalActive > 0 ? "ok" : "neutral"));
  kpiGrid.appendChild(kpiActive);

  const { card: kpiExpired, body: kpiExpiredBody } = createSectionCard({
    title: "Expirés",
    description: "Abonnements expirés"
  });
  kpiExpiredBody.appendChild(createKpiRow("Total", formatNumber(data.analytics.totalExpired), data.analytics.totalExpired > 0 ? "err" : "neutral"));
  kpiGrid.appendChild(kpiExpired);

  const { card: kpiAvailable, body: kpiAvailableBody } = createSectionCard({
    title: "Disponibles",
    description: "Modules disponibles"
  });
  kpiAvailableBody.appendChild(createKpiRow("Total", formatNumber(data.analytics.totalAvailable)));
  kpiGrid.appendChild(kpiAvailable);

  const { card: kpiAdoption, body: kpiAdoptionBody } = createSectionCard({
    title: "Taux adoption",
    description: "Activation des modules"
  });
  kpiAdoptionBody.appendChild(createKpiRow("Adoption", `${data.analytics.adoptionRatePct}%`, data.analytics.adoptionRatePct > 60 ? "ok" : data.analytics.adoptionRatePct > 30 ? "warn" : "neutral"));
  kpiGrid.appendChild(kpiAdoption);

  content.appendChild(kpiGrid);

  const toolbarState = {
    search: "",
    category: "",
    status: ""
  };

  const { element: toolbar, searchInput } = createToolbar({
    searchPlaceholder: "Rechercher un module...",
    onSearch: (value) => {
      toolbarState.search = value.toLowerCase().trim();
      renderTable();
    },
    filters: [
      {
        label: "Catégorie",
        options: [
          { label: "Toutes", value: "" },
          ...getDistinctCategories(data.items).map((cat) => ({ label: cat, value: cat }))
        ],
        onChange: (value) => {
          toolbarState.category = value;
          renderTable();
        }
      },
      {
        label: "Statut",
        options: [
          { label: "Tous", value: "" },
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "INACTIVE", value: "INACTIVE" },
          { label: "EXPIRED", value: "EXPIRED" },
          { label: "AVAILABLE", value: "AVAILABLE" }
        ],
        onChange: (value) => {
          toolbarState.status = value;
          renderTable();
        }
      }
    ],
    actions: [
      {
        label: "+ Ajouter",
        primary: true,
        onClick: () => {
          if (!canManage || safeMode === "STRICT") {
            showToast({ status: "warning", message: "Action bloquée par SAFE_MODE ou RBAC." });
            return;
          }
          showAddSubscriptionPrompt(() => refreshSubscription());
        }
      },
      {
        label: "Exporter CSV",
        onClick: () => {
          showToast({ status: "info", message: "Export CSV en préparation (mode démo)." });
        }
      }
    ]
  });

  content.appendChild(toolbar);

  if (errors.data) {
    content.appendChild(createErrorState({ code: "ERR_SUBSCRIPTIONS_FETCH", message: errors.data }));
  }

  const tableContainer = document.createElement("div");
  content.appendChild(tableContainer);

  const columns: TableColumn<SubscriptionItem>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (value) => {
        const div = document.createElement("div");
        div.textContent = String(value);
        div.style.cssText = "font-weight: 600; color: var(--ic-text, #e7ecef);";
        return div;
      }
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (value) => createBadge(String(value), "neutral")
    },
    {
      key: "scope",
      label: "Scope",
      sortable: true
    },
    {
      key: "plan",
      label: "Plan",
      sortable: true,
      render: (value) => createBadge(String(value), value === "ENTERPRISE" ? "accent" : value === "PRO" ? "info" : "neutral")
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (value) => {
        const status = String(value);
        const tone = status === "ACTIVE" ? "ok" : status === "EXPIRED" ? "err" : status === "AVAILABLE" ? "info" : "neutral";
        return createBadge(status, tone);
      }
    }
  ];

  function renderTable() {
    tableContainer.innerHTML = "";
    const filtered = data.items.filter((item) => {
      const matchCategory = !toolbarState.category || item.category === toolbarState.category;
      const matchStatus = !toolbarState.status || item.status === toolbarState.status;
      const q = toolbarState.search;
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return matchCategory && matchStatus && matchSearch;
    });

    const table = createDataTable({
      columns,
      data: filtered,
      searchable: false,
      sortable: true,
      pagination: true,
      pageSize: 10,
      actions: (row) => {
        const actions = [];
        const blocked = safeMode === "STRICT" || !canManage;
        if (row.status === "ACTIVE") {
          actions.push({
            label: blocked ? "Désactiver (bloqué)" : "Désactiver",
            style: "warning",
            onClick: () => {
              if (blocked) {
                showToast({ status: "warning", message: "Action bloquée par SAFE_MODE ou RBAC." });
                return;
              }
              handleDeactivate(row);
            }
          });
        } else if (row.status === "AVAILABLE" || row.status === "INACTIVE") {
          actions.push({
            label: blocked ? "Activer (bloqué)" : "Activer",
            style: "primary",
            onClick: () => {
              if (blocked) {
                showToast({ status: "warning", message: "Action bloquée par SAFE_MODE ou RBAC." });
                return;
              }
              handleActivate(row);
            }
          });
        }
        actions.push({
          label: "Détails",
          onClick: () => {
            showToast({ status: "info", message: `Détails de ${row.name} (mode démo).` });
          }
        });
        return actions;
      }
    });
    tableContainer.appendChild(table);

    if (filtered.length === 0) {
      tableContainer.appendChild(createContextualEmptyState("subscriptions", {
        onAdd: () => showAddSubscriptionPrompt(() => refreshSubscription()),
        onClearFilter: () => {
          toolbarState.category = "";
          toolbarState.status = "";
          toolbarState.search = "";
          if (searchInput) searchInput.value = "";
          renderTable();
        }
      }));
    }
  }

  renderTable();
}

function renderAnalysisTab(content: HTMLElement, data: SubscriptionData, errors: { analytics?: string }): void {
  const { card: kpiCard, body: kpiBody } = createSectionCard({
    title: "Vue KPI",
    description: "Indicateurs globaux d'adoption"
  });
  kpiBody.appendChild(createKpiRow("Adoption", `${data.analytics.adoptionRatePct}%`, data.analytics.adoptionRatePct > 60 ? "ok" : data.analytics.adoptionRatePct > 30 ? "warn" : "neutral"));
  kpiBody.appendChild(createKpiRow("Actifs", formatNumber(data.analytics.totalActive), data.analytics.totalActive > 0 ? "ok" : "neutral"));
  kpiBody.appendChild(createKpiRow("Disponibles", formatNumber(data.analytics.totalAvailable)));
  kpiBody.appendChild(createKpiRow("Expirés", formatNumber(data.analytics.totalExpired), data.analytics.totalExpired > 0 ? "err" : "neutral"));
  kpiBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));
  content.appendChild(kpiCard);

  const { card: categoriesCard, body: categoriesBody } = createSectionCard({
    title: "Top catégories",
    description: "Catégories les plus actives"
  });
  if (errors.analytics) {
    categoriesBody.appendChild(createErrorState({ code: "ERR_ANALYTICS_FETCH", message: errors.analytics }));
  }
  data.analytics.topCategories.forEach((entry) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; align-items:center; gap:12px;";
    const label = document.createElement("div");
    label.textContent = entry.category;
    label.style.cssText = "width: 140px; font-size: 12px; color: var(--ic-text, #e7ecef);";
    const barWrap = document.createElement("div");
    barWrap.style.cssText = "flex:1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden;";
    const ratio = entry.available > 0 ? Math.min(100, Math.round((entry.active / entry.available) * 100)) : 0;
    const bar = document.createElement("div");
    bar.style.cssText = `height: 100%; width: ${ratio}%; background: var(--ic-accent, #7b2cff);`;
    barWrap.appendChild(bar);
    const numbers = document.createElement("div");
    numbers.textContent = `${entry.active}/${entry.available}`;
    numbers.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(numbers);
    categoriesBody.appendChild(row);
  });
  content.appendChild(categoriesCard);

  const { card: matrixCard, body: matrixBody } = createSectionCard({
    title: "Matrice fonctionnalités",
    description: "Synthèse par catégorie"
  });
  const table = document.createElement("div");
  table.style.cssText = "display:flex; flex-direction:column; gap:8px;";
  data.analytics.topCategories.forEach((entry) => {
    const row = document.createElement("div");
    row.style.cssText = "display:grid; grid-template-columns: 160px 80px 100px 1fr; gap: 12px; align-items:center; padding: 8px; border: 1px solid var(--ic-border, #2b3136); border-radius: 8px;";
    row.innerHTML = `
      <div style="font-size:12px;color:var(--ic-text,#e7ecef);">${entry.category}</div>
      <div style="font-size:12px;color:var(--ic-text,#e7ecef);">${entry.active}</div>
      <div style="font-size:12px;color:var(--ic-mutedText,#a7b0b7);">${entry.available}</div>
      <div style="font-size:12px;color:var(--ic-mutedText,#a7b0b7);">${getCategoryHint(entry.category)}</div>
    `;
    table.appendChild(row);
  });
  matrixBody.appendChild(table);
  content.appendChild(matrixCard);
}

function createTabs(active: SubTab): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";
  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: "freemium", label: "Freemium" },
    { id: "subscriptions", label: "Abonnements" },
    { id: "analysis", label: "Analyse" }
  ];
  tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = tab.id === active;
    btn.textContent = tab.label;
    btn.style.cssText = `
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid ${isActive ? "var(--ic-border, #2b3136)" : "transparent"};
      background: ${isActive ? "var(--ic-card, #1a1d1f)" : "transparent"};
      color: ${isActive ? "var(--ic-text, #e7ecef)" : "var(--ic-mutedText, #a7b0b7)"};
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    `;
    btn.onclick = () => setTab(tab.id);
    container.appendChild(btn);
  });
  return container;
}

function setTab(tab: SubTab): void {
  window.location.hash = `#/subscription?tab=${tab}`;
}

function getCurrentTab(): SubTab {
  const hash = window.location.hash || "";
  const query = hash.split("?")[1] || "";
  const search = new URLSearchParams(query);
  const tab = search.get("tab") as SubTab | null;
  if (tab === "freemium" || tab === "subscriptions" || tab === "analysis") {
    return tab;
  }
  return "freemium";
}

function mapSafeMode(value: string): "OFF" | "COMPAT" | "STRICT" {
  if (value === "STRICT") return "STRICT";
  if (value === "COMPAT") return "COMPAT";
  return "OFF";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-CA").format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

function createKpiRow(label: string, value: string, tone?: "ok" | "warn" | "err" | "neutral"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = `font-size: 13px; font-weight: 600; color: ${tone === "err" ? "var(--ic-error, #f48771)" : tone === "warn" ? "var(--ic-warn, #f59e0b)" : tone === "ok" ? "var(--ic-success, #4ec9b0)" : "var(--ic-text, #e7ecef)"};`;
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function getCategoryHint(category: SubCategory): string {
  switch (category) {
    case "OCR":
      return "Améliore classification / scan";
    case "Monitoring":
      return "SLO + alerting";
    case "Sécurité":
      return "RBAC avancé + audit export";
    case "Infrastructure":
      return "Disponibilité + scaling";
    case "Connecteurs":
      return "Intégrations tierces";
    case "Analytics":
      return "Insights + rapports";
    case "IA":
      return "Assistance et suggestions";
    case "Stockage":
      return "Rétention et archivage";
    case "Audit":
      return "Historique et conformité";
    default:
      return "Optimisation progressive";
  }
}

function canManageSubscriptions(role: string): boolean {
  const allowed = ["ADMIN", "SYSADMIN", "DEVELOPER", "MASTER"];
  return allowed.includes(String(role || "").toUpperCase());
}

function buildDemoSubscriptionData(): SubscriptionData {
  const activeSubs = getActiveSubscriptions();
  const items = SUBSCRIPTION_TYPES.map((type): SubscriptionItem => {
    const active = activeSubs.find((s) => s.subscriptionTypeId === type.id && s.status === "active");
    const expired = active?.expiresAt ? new Date(active.expiresAt) < new Date() : false;
    const status: SubscriptionItem["status"] = active
      ? expired
        ? "EXPIRED"
        : "ACTIVE"
      : "AVAILABLE";
    return {
      id: type.id,
      name: type.name,
      category: mapCategory(type.id, type.name, type.category),
      status,
      plan: type.category === "core" ? "ENTERPRISE" : "PRO",
      scope: type.category === "core" ? "SYSTEM" : "APP",
      activatedAt: active?.activatedAt,
      expiresAt: active?.expiresAt
    };
  });
  const extra = readStoredDemoItems();
  const merged = items.concat(extra);

  const totalActive = merged.filter((i) => i.status === "ACTIVE").length;
  const totalExpired = merged.filter((i) => i.status === "EXPIRED").length;
  const totalAvailable = merged.filter((i) => i.status === "AVAILABLE").length;
  const adoptionRatePct = merged.length > 0 ? Math.round((totalActive / merged.length) * 100) : 0;
  const topCategories = buildCategoryStats(merged);

  return {
    freemium: {
      enabled: true,
      coreGuaranteed: true,
      modulesFree: [
        { name: "Core runtime", status: "ON", note: "Socle stable" },
        { name: "RBAC basique", status: "ON", note: "Rôles essentiels" },
        { name: "Audit minimal", status: "ON", note: "Historique 7j" },
        { name: "Monitoring basique", status: "ON", note: "Métriques clés" }
      ]
    },
    items: merged,
    analytics: {
      totalActive,
      totalExpired,
      totalAvailable,
      adoptionRatePct,
      topCategories
    },
    lastUpdated: new Date().toISOString()
  };
}

async function fetchJsonSafe<T = any>(url: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: String(error) };
  }
}

async function getSubscriptionData(): Promise<{ data: SubscriptionData; errors: { data?: string; analytics?: string } }> {
  const demo = buildDemoSubscriptionData();
  const errors: { data?: string; analytics?: string } = {};

  const dataRes = await fetchJsonSafe<any>("/api/cp/subscriptions");
  const analyticsRes = await fetchJsonSafe<any>("/api/cp/subscriptions/analytics");

  let items = demo.items;
  if (dataRes.ok && Array.isArray(dataRes.data)) {
    items = dataRes.data.map((item: any) => ({
      id: String(item.id || item.subscriptionTypeId || item.name),
      name: String(item.name || item.label || "Module"),
      category: mapCategory(String(item.id || item.name || ""), String(item.name || ""), String(item.category || "")),
      status: mapStatus(item.status),
      plan: mapPlan(item.plan),
      scope: item.scope === "APP" ? "APP" : "SYSTEM",
      activatedAt: item.activatedAt,
      expiresAt: item.expiresAt,
      notes: item.notes
    })) as SubscriptionItem[];
    items = items.concat(readStoredDemoItems());
  } else {
    errors.data = dataRes.error || "Impossible de charger /api/cp/subscriptions";
  }

  let analytics = demo.analytics;
  if (analyticsRes.ok && analyticsRes.data) {
    const raw = analyticsRes.data;
    analytics = {
      totalActive: Number(raw.totalActive ?? demo.analytics.totalActive),
      totalExpired: Number(raw.totalExpired ?? demo.analytics.totalExpired),
      totalAvailable: Number(raw.totalAvailable ?? demo.analytics.totalAvailable),
      adoptionRatePct: Number(raw.adoptionRatePct ?? demo.analytics.adoptionRatePct),
      topCategories: Array.isArray(raw.topCategories) ? raw.topCategories.map((entry: any) => ({
        category: mapCategory(String(entry.category || ""), String(entry.category || ""), ""),
        active: Number(entry.active ?? 0),
        available: Number(entry.available ?? 0)
      })) : demo.analytics.topCategories
    };
  } else {
    errors.analytics = analyticsRes.error || "Impossible de charger /api/cp/subscriptions/analytics";
  }

  return {
    data: {
      freemium: demo.freemium,
      items,
      analytics,
      lastUpdated: new Date().toISOString()
    },
    errors
  };
}

function mapStatus(value: any): SubscriptionItem["status"] {
  const v = String(value || "").toUpperCase();
  if (v === "ACTIVE") return "ACTIVE";
  if (v === "EXPIRED") return "EXPIRED";
  if (v === "INACTIVE") return "INACTIVE";
  return "AVAILABLE";
}

function mapPlan(value: any): SubscriptionItem["plan"] {
  const v = String(value || "").toUpperCase();
  if (v === "ENTERPRISE") return "ENTERPRISE";
  if (v === "PRO") return "PRO";
  return "FREE";
}

function mapCategory(id: string, name: string, category: string): SubCategory {
  const key = `${id} ${name} ${category}`.toLowerCase();
  if (key.includes("security") || key.includes("sécurité")) return "Sécurité";
  if (key.includes("ocr")) return "OCR";
  if (key.includes("monitor")) return "Monitoring";
  if (key.includes("connect") || key.includes("api")) return "Connecteurs";
  if (key.includes("analytic")) return "Analytics";
  if (key.includes("ia") || key.includes("ai")) return "IA";
  if (key.includes("storage") || key.includes("stockage")) return "Stockage";
  if (key.includes("audit")) return "Audit";
  return category === "core" ? "Infrastructure" : "Analytics";
}

function buildCategoryStats(items: SubscriptionItem[]): Array<{ category: SubCategory; active: number; available: number }> {
  const map = new Map<SubCategory, { active: number; available: number }>();
  items.forEach((item) => {
    const entry = map.get(item.category) || { active: 0, available: 0 };
    if (item.status === "ACTIVE") entry.active += 1;
    if (item.status === "AVAILABLE") entry.available += 1;
    map.set(item.category, entry);
  });
  return Array.from(map.entries()).map(([category, stats]) => ({
    category,
    active: stats.active,
    available: stats.available
  }));
}

function handleActivate(item: SubscriptionItem): void {
  const active = isSubscriptionActive(item.id);
  if (active) {
    showToast({ status: "info", message: `${item.name} est déjà actif.` });
    return;
  }
  activateSubscription(item.id, "Console", undefined, { source: "cp" });
  showToast({ status: "success", message: `Abonnement "${item.name}" activé.` });
  refreshSubscription();
}

function handleDeactivate(item: SubscriptionItem): void {
  const activeSubs = getActiveSubscriptions();
  const active = activeSubs.find((sub) => sub.subscriptionTypeId === item.id && sub.status === "active");
  if (!active) {
    showToast({ status: "warning", message: `${item.name} n'est pas actif.` });
    return;
  }
  deactivateSubscription(active.id);
  showToast({ status: "warning", message: `Abonnement "${item.name}" désactivé.` });
  refreshSubscription();
}

function showAddSubscriptionPrompt(onDone: () => void): void {
  const name = window.prompt("Nom du module:");
  if (!name) return;
  const plan = window.prompt("Plan (FREE/PRO/ENTERPRISE):", "PRO");
  const category = window.prompt("Catégorie (Infrastructure/Sécurité/OCR/...):", "Infrastructure");
  const scope = window.prompt("Scope (SYSTEM/APP):", "SYSTEM");
  const newItem: SubscriptionItem = {
    id: `custom-${Date.now()}`,
    name,
    category: mapCategory(category || "", category || "", ""),
    status: "AVAILABLE",
    plan: mapPlan(plan),
    scope: scope === "APP" ? "APP" : "SYSTEM"
  };
  const existing = JSON.parse(localStorage.getItem("icontrol_demo_subscriptions") || "[]") as SubscriptionItem[];
  existing.push(newItem);
  localStorage.setItem("icontrol_demo_subscriptions", JSON.stringify(existing));
  showToast({ status: "success", message: "Module ajouté (démo)." });
  onDone();
}

function getDistinctCategories(items: SubscriptionItem[]): SubCategory[] {
  return Array.from(new Set(items.map((item) => item.category))).sort();
}

function readStoredDemoItems(): SubscriptionItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem("icontrol_demo_subscriptions") || "[]") as SubscriptionItem[];
    if (!Array.isArray(stored)) return [];
    return stored.map((item) => ({
      ...item,
      category: mapCategory(item.id || "", item.name || "", item.category || ""),
      status: mapStatus(item.status),
      plan: mapPlan(item.plan),
      scope: item.scope === "APP" ? "APP" : "SYSTEM"
    }));
  } catch {
    return [];
  }
}

let currentRoot: HTMLElement | null = null;

function getRenderRoot(): HTMLElement {
  return currentRoot || getMountEl();
}

function refreshSubscription(): void {
  const target = getRenderRoot();
  if (target) {
    void renderSubscription(target);
  }
}
