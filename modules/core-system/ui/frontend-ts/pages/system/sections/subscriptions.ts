// @ts-nocheck
import { sectionCard, el } from "../../_shared/uiBlocks";

interface Subscription {
  id: string;
  name: string;
  provider: string;
  type: "payment" | "storage" | "auth" | "email" | "analytics" | "sms";
  status: "active" | "inactive" | "error" | "configuring";
  config: {
    apiKey?: string;
    secretKey?: string;
    region?: string;
    endpoint?: string;
  };
  freemiumFallback: boolean;
  monthlyUsage?: {
    requests: number;
    storage: number;
    cost: number;
  };
  connectedAt?: string;
}

// Données exemple (à remplacer par vraies données)
const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "stripe",
    name: "Stripe",
    provider: "stripe",
    type: "payment",
    status: "active",
    config: { apiKey: "sk_test_***" },
    freemiumFallback: true,
    monthlyUsage: { requests: 1250, storage: 0, cost: 45.50 },
    connectedAt: "2025-01-15",
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    provider: "aws",
    type: "storage",
    status: "active",
    config: { region: "us-east-1", apiKey: "AKIA***" },
    freemiumFallback: true,
    monthlyUsage: { requests: 50000, storage: 125, cost: 12.30 },
    connectedAt: "2025-01-10",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    provider: "sendgrid",
    type: "email",
    status: "inactive",
    config: {},
    freemiumFallback: true,
    connectedAt: undefined,
  },
];

const AVAILABLE_PROVIDERS = [
  { id: "stripe", name: "Stripe", type: "payment", logo: "💳" },
  { id: "aws-s3", name: "AWS S3", type: "storage", logo: "☁️" },
  { id: "sendgrid", name: "SendGrid", type: "email", logo: "📧" },
  { id: "auth0", name: "Auth0", type: "auth", logo: "🔐" },
  { id: "twilio", name: "Twilio", type: "sms", logo: "📱" },
  { id: "google-analytics", name: "Google Analytics", type: "analytics", logo: "📊" },
];

export function renderSubscriptionsSection(host: HTMLElement): void {
  const card = sectionCard("Abonnements & Providers", "Gérer les services externes connectés");

  // KPIs
  const kpisContainer = el("div");
  kpisContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  `;

  const activeCount = SUBSCRIPTIONS.filter(s => s.status === "active").length;
  const totalCost = SUBSCRIPTIONS.reduce((sum, s) => sum + (s.monthlyUsage?.cost || 0), 0);

  const kpis = [
    { label: "Abonnements actifs", value: activeCount.toString(), color: "#5a8fff" },
    { label: "Total disponibles", value: AVAILABLE_PROVIDERS.length.toString(), color: "#9aa3ad" },
    { label: "Coût mensuel", value: `${totalCost.toFixed(2)} CAD`, color: "#f59e0b" },
    { label: "Avec fallback", value: SUBSCRIPTIONS.filter(s => s.freemiumFallback).length.toString(), color: "#10b981" },
  ];

  kpis.forEach(kpi => {
    const kpiCard = el("div");
    kpiCard.style.cssText = `
      background: var(--surface-1, #171c22);
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 8px;
      padding: 16px;
    `;
    kpiCard.innerHTML = `
      <div style="font-size: 12px; color: var(--text-muted, #9aa3ad); margin-bottom: 8px;">${kpi.label}</div>
      <div style="font-size: 28px; font-weight: 700; color: ${kpi.color};">${kpi.value}</div>
    `;
    kpisContainer.appendChild(kpiCard);
  });

  card.appendChild(kpisContainer);

  // Toolbar
  const toolbar = el("div");
  toolbar.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `;

  const filterButtons = el("div");
  filterButtons.style.cssText = `display: flex; gap: 8px;`;

  ["Tous", "Actifs", "Inactifs"].forEach(filter => {
    const btn = el("button");
    btn.textContent = filter;
    btn.style.cssText = `
      padding: 8px 16px;
      background: ${filter === "Tous" ? "var(--accent-primary, #5a8fff)" : "var(--surface-0, #12161b)"};
      color: ${filter === "Tous" ? "white" : "var(--text-muted, #9aa3ad)"};
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    `;
    filterButtons.appendChild(btn);
  });

  const addBtn = el("button");
  addBtn.textContent = "+ Ajouter un abonnement";
  addBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--accent-primary, #5a8fff);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  `;
  addBtn.onclick = () => {
    alert("Modal d'ajout d'abonnement (à implémenter)");
  };

  toolbar.appendChild(filterButtons);
  toolbar.appendChild(addBtn);
  card.appendChild(toolbar);

  // Liste des abonnements actifs
  const activeSection = el("div");
  activeSection.style.cssText = `margin-bottom: 32px;`;
  
  const activeTitle = el("h3");
  activeTitle.textContent = "Abonnements connectés";
  activeTitle.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    font-size: 18px;
    margin-bottom: 16px;
  `;
  activeSection.appendChild(activeTitle);

  const activeGrid = el("div");
  activeGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
  `;

  SUBSCRIPTIONS.forEach(sub => {
    const subCard = createSubscriptionCard(sub);
    activeGrid.appendChild(subCard);
  });

  activeSection.appendChild(activeGrid);
  card.appendChild(activeSection);

  // Providers disponibles
  const availableSection = el("div");
  
  const availableTitle = el("h3");
  availableTitle.textContent = "Providers disponibles";
  availableTitle.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    font-size: 18px;
    margin-bottom: 16px;
  `;
  availableSection.appendChild(availableTitle);

  const availableGrid = el("div");
  availableGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  `;

  AVAILABLE_PROVIDERS.forEach(provider => {
    const providerCard = el("div");
    providerCard.style.cssText = `
      background: var(--surface-1, #171c22);
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    `;

    providerCard.onmouseenter = () => {
      providerCard.style.borderColor = "var(--accent-primary, #5a8fff)";
      providerCard.style.transform = "translateY(-2px)";
    };

    providerCard.onmouseleave = () => {
      providerCard.style.borderColor = "var(--surface-border, #262d35)";
      providerCard.style.transform = "translateY(0)";
    };

    providerCard.onclick = () => {
      alert(`Connecter ${provider.name} (modal à implémenter)`);
    };

    providerCard.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">${provider.logo}</div>
      <div style="font-weight: 600; color: var(--text-primary, #e6e9ee); margin-bottom: 4px;">${provider.name}</div>
      <div style="font-size: 12px; color: var(--text-muted, #9aa3ad);">${provider.type}</div>
    `;

    availableGrid.appendChild(providerCard);
  });

  availableSection.appendChild(availableGrid);
  card.appendChild(availableSection);

  host.appendChild(card);
}

function createSubscriptionCard(sub: Subscription): HTMLElement {
  const card = el("div");
  card.style.cssText = `
    background: var(--surface-1, #171c22);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 10px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  card.onmouseenter = () => {
    card.style.borderColor = "var(--accent-primary, #5a8fff)";
    card.style.transform = "translateY(-2px)";
  };

  card.onmouseleave = () => {
    card.style.borderColor = "var(--surface-border, #262d35)";
    card.style.transform = "translateY(0)";
  };

  card.onclick = () => {
    alert(`Éditer ${sub.name} (modal à implémenter)`);
  };

  // Header
  const header = el("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  `;

  const titleDiv = el("div");
  const title = el("h4");
  title.textContent = sub.name;
  title.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    margin: 0 0 4px 0;
    font-size: 18px;
  `;
  const typeLabel = el("span");
  typeLabel.textContent = sub.type;
  typeLabel.style.cssText = `
    font-size: 12px;
    color: var(--text-muted, #9aa3ad);
  `;
  titleDiv.appendChild(title);
  titleDiv.appendChild(typeLabel);

  const statusBadge = el("span");
  statusBadge.textContent = sub.status;
  const statusColors = {
    active: "#10b981",
    inactive: "#6b7280",
    error: "#ef4444",
    configuring: "#f59e0b",
  };
  statusBadge.style.cssText = `
    background: ${statusColors[sub.status]};
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  `;

  header.appendChild(titleDiv);
  header.appendChild(statusBadge);
  card.appendChild(header);

  // Stats
  if (sub.monthlyUsage) {
    const stats = el("div");
    stats.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-border, #262d35);
    `;

    const statItems = [
      { label: "Requêtes", value: sub.monthlyUsage.requests.toLocaleString() },
      { label: "Storage", value: `${sub.monthlyUsage.storage} GB` },
      { label: "Coût", value: `${sub.monthlyUsage.cost} CAD` },
    ];

    statItems.forEach(stat => {
      const statEl = el("div");
      statEl.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted, #9aa3ad);">${stat.label}</div>
        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary, #e6e9ee); margin-top: 4px;">${stat.value}</div>
      `;
      stats.appendChild(statEl);
    });

    card.appendChild(stats);
  }

  // Fallback indicator
  if (sub.freemiumFallback) {
    const fallback = el("div");
    fallback.style.cssText = `
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--surface-0, #12161b);
      border-radius: 6px;
      font-size: 12px;
      color: var(--text-muted, #9aa3ad);
    `;
    fallback.innerHTML = `✓ Fallback Freemium activé`;
    card.appendChild(fallback);
  }

  return card;
}
