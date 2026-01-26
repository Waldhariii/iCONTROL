/**
 * ICONTROL_CP_SUBSCRIPTION_V2
 * Billing & subscriptions (visual-only).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createBarChart } from "/src/core/ui/charts";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createGovernanceFooter, createTwoColumnLayout, createDemoDataBanner, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";
import { formatDate } from "/src/core/utils/dateFormat";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

type PlanRow = { plan: string; status: "ACTIVE" | "TRIAL" | "PAST_DUE"; mrr: string; tenants: number };
type PaymentRow = { date: string; amount: string; status: "PAID" | "FAILED" | "PENDING"; ref: string };

const DEMO_PLANS: PlanRow[] = [
  { plan: "ENTERPRISE", status: "ACTIVE", mrr: "$84,000", tenants: 18 },
  { plan: "PRO", status: "ACTIVE", mrr: "$32,500", tenants: 44 },
  { plan: "TRIAL", status: "TRIAL", mrr: "$0", tenants: 12 },
  { plan: "LEGACY", status: "PAST_DUE", mrr: "$4,200", tenants: 3 }
];

const DEMO_PAYMENTS: PaymentRow[] = [
  { date: "2024-10-12", amount: "$12,400", status: "PAID", ref: "INV-1042" },
  { date: "2024-10-05", amount: "$9,100", status: "PAID", ref: "INV-1039" },
  { date: "2024-09-28", amount: "$7,900", status: "FAILED", ref: "INV-1034" },
  { date: "2024-09-14", amount: "$6,200", status: "PAID", ref: "INV-1028" }
];

export function renderSubscription(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Abonnements",
    subtitle: "Plans et facturation",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const plans = isCpDemoEnabled() ? DEMO_PLANS : DEMO_PLANS;
  const payments = isCpDemoEnabled() ? DEMO_PAYMENTS : DEMO_PAYMENTS;

  const demoBanner = createDemoDataBanner();
  if (demoBanner) content.appendChild(demoBanner);
  const kpis = createKpiStrip([
    { label: "MRR", value: "$120,500", tone: "ok" },
    { label: "ARR", value: "$1.44M", tone: "info" },
    { label: "Plans actifs", value: String(plans.filter((p) => p.status === "ACTIVE").length), tone: "ok" },
    { label: "Past due", value: String(plans.filter((p) => p.status === "PAST_DUE").length), tone: "warn" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: plansCard, body: plansBody } = createSectionCard({
    title: "Plans",
    description: "Statuts et MRR (gouverné)"
  });

  if (plans.length === 0) {
    plansBody.appendChild(createEmptyStateCard({
      title: "Aucun plan",
      message: "Aucune donnée de plan disponible."
    }));
  } else {
    const columns: TableColumn<PlanRow>[] = [
      { key: "plan", label: "Plan", sortable: true },
      { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "ACTIVE" ? "ok" : v === "PAST_DUE" ? "warn" : "info") },
      { key: "mrr", label: "MRR", sortable: true },
      { key: "tenants", label: "Tenants", sortable: true }
    ];
    plansBody.appendChild(createDataTable({ columns, data: plans, pagination: true, pageSize: 6 }));
  }

  const { card: detailCard, body: detailBody } = createSectionCard({
    title: "Détails abonnement",
    description: "Vue synthétique (lecture seule)"
  });
  detailBody.appendChild(createRow("Plan actif", "ENTERPRISE"));
  detailBody.appendChild(createRow("Prochaine facture", "2024-11-01"));
  detailBody.appendChild(createRow("Status facturation", "OK"));
  detailBody.appendChild(createBarChart([18, 22, 30, 28, 26, 35, 42, 39]));

  grid.appendChild(plansCard);
  grid.appendChild(detailCard);

  const { card: paymentsCard, body: paymentsBody } = createSectionCard({
    title: "Historique paiements",
    description: "Lecture seule"
  });
  const paymentColumns: TableColumn<PaymentRow>[] = [
    { key: "date", label: "Date", sortable: true, render: (v) => formatDate(String(v)) },
    { key: "amount", label: "Montant", sortable: true },
    { key: "status", label: "Statut", sortable: true, render: (v) => createBadge(String(v), v === "PAID" ? "ok" : v === "FAILED" ? "err" : "warn") },
    { key: "ref", label: "Ref", sortable: true }
  ];
  paymentsBody.appendChild(createDataTable({ columns: paymentColumns, data: payments, pagination: true, pageSize: 6 }));
  content.appendChild(paymentsCard);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}

function createRow(label: string, value: string): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; justify-content:space-between; gap:12px; font-size:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "color: var(--ic-mutedText, #a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = "color: var(--ic-text, #e7ecef); font-weight: 600;";
  row.appendChild(left);
  row.appendChild(right);
  return row;
}
