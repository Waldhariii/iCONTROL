/**
 * ICONTROL_CP_TENANTS_V1
 * Page Tenants — Gestion des tenants avec tableaux, KPI et graphiques
 * 
 * Utilise les mêmes composants visuels que l'APP (tableaux, KPI, toolbars)
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { showToast } from "/src/core/ui/toast";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createDonutChart } from "/src/core/ui/charts";
import { createGovernanceFooter, createTwoColumnLayout, createDemoDataBanner, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { TenantService } from "../../core/control-plane/services/tenantService";
import { LocalStorageProvider } from "../../core/control-plane/storage";
import { AuditService } from "../../core/control-plane/services/auditService";
import type { Tenant } from "../../core/control-plane/types";

type TenantsData = {
  tenants: Tenant[];
  kpi: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  lastUpdated: string;
};

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-CA").format(value);
}

export async function renderTenants(root: HTMLElement): Promise<void> {
  const renderLoading = () => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(getSafeMode());
    const { shell, content } = createPageShell({
      title: "Organisation",
      subtitle: "Tenants — isolation, statut et santé",
      safeMode: safeModeValue,
      statusBadge: { label: "CHARGEMENT", tone: "info" }
    });

    const demoBanner = createDemoDataBanner();
    if (demoBanner) content.appendChild(demoBanner);
    const { card: skeletonCard, body: skeletonBody } = createSectionCard({
      title: "Chargement...",
      description: "Récupération des données tenants"
    });
    skeletonBody.innerHTML = "<div style='padding:20px;text-align:center;opacity:0.7;'>Chargement en cours...</div>";
    content.appendChild(skeletonCard);
    root.appendChild(shell);
  };

  const renderData = (data: TenantsData, errors: { tenants?: string }) => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(getSafeMode());
    const { shell, content } = createPageShell({
      title: "Organisation",
      subtitle: "Tenants — isolation, statut et santé",
      safeMode: safeModeValue,
      statusBadge: {
        label: data.kpi.active > 0 ? "ACTIF" : "AUCUN",
        tone: data.kpi.active > 0 ? "ok" : "neutral"
      },
      actions: [
        {
          label: "➕ Demander un tenant",
          primary: true,
          onClick: () => {
            showToast({ status: "info", message: "Action gouvernée — demande transmise." });
          }
        }
      ]
    });

    const demoBanner = createDemoDataBanner();
    if (demoBanner) content.appendChild(demoBanner);
    const kpis = createKpiStrip([
      { label: "Total tenants", value: formatNumber(data.kpi.total), tone: data.kpi.total > 0 ? "ok" : "neutral" },
      { label: "Actifs", value: formatNumber(data.kpi.active), tone: data.kpi.active > 0 ? "ok" : "warn" },
      { label: "Suspendus", value: formatNumber(data.kpi.suspended), tone: data.kpi.suspended > 0 ? "err" : "ok" },
      { label: "Inactifs", value: formatNumber(data.kpi.inactive), tone: data.kpi.inactive > 0 ? "warn" : "ok" }
    ]);
    content.appendChild(kpis);

    const grid = createTwoColumnLayout();
    content.appendChild(grid);

    // Tableau Tenants
    const { card: tenantsCard, body: tenantsBody } = createSectionCard({
      title: "Liste des Tenants",
      description: "Tableau complet avec recherche et filtres"
    });

    if (errors.tenants) {
      tenantsBody.appendChild(createErrorState({
        code: "ERR_TENANTS_FETCH",
        message: errors.tenants
      }));
      grid.appendChild(tenantsCard);
      grid.appendChild(createDetailsPanel(null));
      content.appendChild(createGovernanceFooter(data.lastUpdated));
      root.appendChild(shell);
      return;
    }

    if (data.tenants.length === 0) {
      tenantsBody.appendChild(createEmptyStateCard({
        title: "Aucun tenant",
        message: "Aucun tenant n'a été créé pour le moment.",
        action: {
          label: "Proposer un tenant",
          onClick: () => {}
        }
      }));
    } else {
      const tableState = { search: "", status: "" };

      const { element: toolbar, searchInput } = createToolbar({
        onSearch: (query) => {
          tableState.search = query;
          renderTable();
        },
        searchPlaceholder: "Rechercher un tenant...",
        filters: [
          {
            label: "Statut",
            options: [
              { value: "", label: "Tous" },
              { value: "ACTIVE", label: "Actif" },
              { value: "SUSPENDED", label: "Suspendu" },
              { value: "INACTIVE", label: "Inactif" }
            ],
            value: tableState.status,
            onChange: (value) => {
              tableState.status = value;
              renderTable();
            }
          }
        ]
      });

      tenantsBody.appendChild(toolbar);

      const tableContainer = document.createElement("div");
      tenantsBody.appendChild(tableContainer);

      const columns: TableColumn<Tenant>[] = [
        { key: "tenantId", label: "ID", sortable: true },
        {
          key: "status",
          label: "Statut",
          sortable: true,
          render: (value) => {
            const status = String(value);
            const tone = status === "ACTIVE" ? "ok" : status === "SUSPENDED" ? "err" : "warn";
            return createBadge(status, tone);
          }
        },
        { key: "planId", label: "Plan", sortable: true },
        {
          key: "createdAt",
          label: "Créé le",
          sortable: true,
          render: (value) => formatDateTime(formatTenantDate(value))
        },
        {
          key: "limits",
          label: "Limites",
          render: (value) => {
            const limits = value as Tenant["limits"];
            return `Users: ${limits.maxUsers}, Storage: ${limits.maxStorageGb}GB, API: ${limits.apiRateLimit}/h`;
          }
        }
      ];

      let selected: Tenant | null = data.tenants[0] || null;

      const renderDetail = (tenant: Tenant | null) => {
        const panel = createDetailsPanel(tenant);
        if (grid.children.length > 1) {
          grid.replaceChild(panel, grid.children[1]);
        } else {
          grid.appendChild(panel);
        }
      };

      function renderTable(): void {
        tableContainer.innerHTML = "";
        let filtered = [...data.tenants];

        if (tableState.search) {
          const query = tableState.search.toLowerCase();
          filtered = filtered.filter(t =>
            t.tenantId.toLowerCase().includes(query) ||
            t.planId.toLowerCase().includes(query) ||
            t.status.toLowerCase().includes(query)
          );
        }

        if (tableState.status) {
          filtered = filtered.filter(t => t.status === tableState.status);
        }

        const table = createDataTable({
          columns,
          data: filtered,
          searchable: false, // Already handled by toolbar
          sortable: true,
          pagination: true,
          pageSize: 10,
          onRowClick: (row) => {
            selected = row;
            renderDetail(row);
          },
          actions: (row) => [
            {
              label: "Voir",
              onClick: () => renderDetail(row)
            },
            {
              label: row.status === "ACTIVE" ? "Suspendre" : "Activer",
              onClick: () => {
                showToast({ status: "info", message: "Action gouvernée — demande transmise." });
              }
            }
          ]
        });

        tableContainer.appendChild(table);
      }

      renderTable();
      renderDetail(selected);
    }

    const { card: lastUpdatedCard, body: lastUpdatedBody } = createSectionCard({
      title: "Métadonnées",
      description: "Informations de mise à jour"
    });
    lastUpdatedBody.appendChild(createKpiRow("Dernière mise à jour", formatDateTime(data.lastUpdated)));
    content.appendChild(lastUpdatedCard);
    grid.appendChild(tenantsCard);
    if (grid.children.length === 1) {
      grid.appendChild(createDetailsPanel(null));
    }
    content.appendChild(createGovernanceFooter(data.lastUpdated));
    root.appendChild(shell);
  };

  async function loadAndRender(): Promise<void> {
    try {
      const storage = new LocalStorageProvider("icontrol_cp_");
      const audit = new AuditService(storage);
      const tenantService = new TenantService(storage, audit);

      const tenants = await tenantService.listTenants();
      const kpi = {
        total: tenants.length,
        active: tenants.filter(t => t.status === "ACTIVE").length,
        suspended: tenants.filter(t => t.status === "SUSPENDED").length,
        inactive: tenants.filter(t => t.status === "INACTIVE").length
      };

      const demoTenants: Tenant[] = [
        { tenantId: "alpha-hq", planId: "ENTERPRISE", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 1000, maxStorageGb: 2000, apiRateLimit: 100000 }, region: "eu-west", safeModePolicy: "COMPAT", retentionPolicy: "30D" },
        { tenantId: "bravo-lab", planId: "PRO", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 120, maxStorageGb: 200, apiRateLimit: 50000 }, region: "us-east", safeModePolicy: "COMPAT", retentionPolicy: "30D" },
        { tenantId: "charlie-gov", planId: "PRO", status: "SUSPENDED", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 80, maxStorageGb: 120, apiRateLimit: 25000 }, region: "eu-central", safeModePolicy: "STRICT", retentionPolicy: "90D" },
        { tenantId: "delta-ops", planId: "FREE", status: "INACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 8, maxStorageGb: 10, apiRateLimit: 2000 }, region: "apac", safeModePolicy: "OFF", retentionPolicy: "14D" },
        { tenantId: "echo-edge", planId: "ENTERPRISE", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 1500, maxStorageGb: 2500, apiRateLimit: 200000 }, region: "us-west", safeModePolicy: "COMPAT", retentionPolicy: "365D" }
      ];
      const finalTenants = tenants.length === 0 && isCpDemoEnabled() ? demoTenants : tenants;
      const finalKpi = finalTenants.length === 0 ? kpi : {
        total: finalTenants.length,
        active: finalTenants.filter(t => t.status === "ACTIVE").length,
        suspended: finalTenants.filter(t => t.status === "SUSPENDED").length,
        inactive: finalTenants.filter(t => t.status === "INACTIVE").length
      };

      renderData({
        tenants: finalTenants,
        kpi: finalKpi,
        lastUpdated: new Date().toISOString()
      }, {});
    } catch (e) {
      renderData({
        tenants: [],
        kpi: { total: 0, active: 0, suspended: 0, inactive: 0 },
        lastUpdated: new Date().toISOString()
      }, { tenants: String(e) });
    }
  }

  function demoDate(): number {
    return Date.now();
  }

  function createDetailsPanel(tenant: Tenant | null): HTMLElement {
    const { card, body } = createSectionCard({
      title: "Détails du tenant",
      description: "Panneau de contexte (lecture seule)"
    });

    if (!tenant) {
      body.appendChild(createEmptyStateCard({
        title: "Aucun tenant sélectionné",
        message: "Sélectionnez un tenant pour afficher les détails."
      }));
      return card;
    }

    body.appendChild(createKpiRow("Tenant ID", tenant.tenantId));
    body.appendChild(createKpiRow("Plan", tenant.planId));
    body.appendChild(createKpiRow("Statut", tenant.status, tenant.status === "ACTIVE" ? "ok" : tenant.status === "SUSPENDED" ? "err" : "warn"));
    body.appendChild(createKpiRow("Créé", formatDateTime(formatTenantDate(tenant.createdAt))));
    body.appendChild(createKpiRow("Mis à jour", formatDateTime(formatTenantDate(tenant.updatedAt))));

    const divider = document.createElement("div");
    divider.style.cssText = "margin:10px 0; height:1px; background: var(--ic-border, #2b3136);";
    body.appendChild(divider);

    body.appendChild(createDonutChart([
      { label: "CPU", value: 54, color: "var(--ic-accent2)" },
      { label: "Storage", value: 28, color: "var(--ic-success)" },
      { label: "Queue", value: 18, color: "var(--ic-warn)" }
    ]));

    const note = document.createElement("div");
    note.textContent = "Actions gouvernées disponibles via le Core (lecture seule).";
    note.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
    body.appendChild(note);

    return card;
  }

  renderLoading();
  await loadAndRender();
}

function formatTenantDate(value: unknown): string {
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}
