// @ts-nocheck
import { sectionCard, el } from "../../_shared/uiBlocks";

export function renderPlansSection(host: HTMLElement): void {
  const card = sectionCard("Plans & Abonnements", "Gérer les plans FREE, PRO, ENTERPRISE");

  // Charger les plans depuis TENANT_FEATURE_MATRIX
  let plans: any[] = [];
  try {
    // @ts-ignore
    const matrix = require("@config/ssot/TENANT_FEATURE_MATRIX.json");
    const templates = matrix?.templates || {};
    plans = Object.entries(templates).map(([key, value]: [string, any]) => ({
      id: key.toLowerCase(),
      name: key,
      displayName: value.plan || key,
      enabledModules: value.enabled_modules || [],
      enabledPages: value.enabled_pages || [],
      enabledCapabilities: value.enabled_capabilities || [],
      limits: value.limits || {},
      auditRequired: value.audit_required || false,
    }));
  } catch (e) {
    console.error("Failed to load plans:", e);
  }

  // KPIs
  const kpisContainer = el("div");
  kpisContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  `;

  const kpis = [
    { label: "Plans actifs", value: plans.length.toString() },
    { label: "Pages max", value: Math.max(...plans.map(p => p.enabledPages?.length || 0)).toString() },
    { label: "Capabilities total", value: plans.reduce((sum, p) => sum + (p.enabledCapabilities?.length || 0), 0).toString() },
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
      <div style="font-size: 28px; font-weight: 700; color: var(--accent-primary, #5a8fff);">${kpi.value}</div>
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

  const searchInput = el("input") as HTMLInputElement;
  searchInput.type = "text";
  searchInput.placeholder = "Rechercher un plan...";
  searchInput.style.cssText = `
    padding: 10px 16px;
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 6px;
    background: var(--surface-0, #12161b);
    color: var(--text-primary, #e6e9ee);
    width: 300px;
  `;

  const addBtn = el("button");
  addBtn.textContent = "+ Ajouter un plan";
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
    alert("Modal d'ajout de plan (à implémenter)");
  };

  toolbar.appendChild(searchInput);
  toolbar.appendChild(addBtn);
  card.appendChild(toolbar);

  // Liste des plans
  const plansGrid = el("div");
  plansGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  `;

  plans.forEach(plan => {
    const planCard = el("div");
    planCard.style.cssText = `
      background: var(--surface-1, #171c22);
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 10px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    planCard.onmouseenter = () => {
      planCard.style.borderColor = "var(--accent-primary, #5a8fff)";
      planCard.style.transform = "translateY(-2px)";
    };

    planCard.onmouseleave = () => {
      planCard.style.borderColor = "var(--surface-border, #262d35)";
      planCard.style.transform = "translateY(0)";
    };

    planCard.onclick = () => {
      alert(`Éditer le plan ${plan.name} (modal à implémenter)`);
    };

    // Header
    const header = el("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;

    const title = el("h3");
    title.textContent = plan.displayName;
    title.style.cssText = `
      color: var(--text-primary, #e6e9ee);
      margin: 0;
      font-size: 20px;
    `;

    const badge = el("span");
    badge.textContent = plan.name;
    badge.style.cssText = `
      background: var(--accent-primary, #5a8fff);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    `;

    header.appendChild(title);
    header.appendChild(badge);
    planCard.appendChild(header);

    // Stats
    const stats = el("div");
    stats.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
    `;

    const statItems = [
      { label: "Modules", value: plan.enabledModules?.length || 0 },
      { label: "Pages", value: plan.enabledPages?.length || 0 },
      { label: "Utilisateurs", value: plan.limits?.users === null ? "∞" : plan.limits?.users || 0 },
      { label: "Tenants", value: plan.limits?.tenants === null ? "∞" : plan.limits?.tenants || 0 },
    ];

    statItems.forEach(stat => {
      const statEl = el("div");
      statEl.style.cssText = `
        background: var(--surface-0, #12161b);
        padding: 10px;
        border-radius: 6px;
      `;
      statEl.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted, #9aa3ad);">${stat.label}</div>
        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary, #e6e9ee); margin-top: 4px;">${stat.value}</div>
      `;
      stats.appendChild(statEl);
    });

    planCard.appendChild(stats);

    // Capabilities
    const caps = el("div");
    caps.style.cssText = "margin-top: 16px;";
    const capsTitle = el("div");
    capsTitle.textContent = "Capabilities:";
    capsTitle.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted, #9aa3ad);
      margin-bottom: 8px;
    `;
    caps.appendChild(capsTitle);

    const capsList = (plan.enabledCapabilities || []).slice(0, 3);
    capsList.forEach((cap: string) => {
      const capBadge = el("span");
      capBadge.textContent = cap;
      capBadge.style.cssText = `
        display: inline-block;
        background: var(--surface-0, #12161b);
        color: var(--text-primary, #e6e9ee);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        margin-right: 6px;
        margin-bottom: 6px;
      `;
      caps.appendChild(capBadge);
    });

    if (plan.enabledCapabilities?.length > 3) {
      const more = el("span");
      more.textContent = `+${plan.enabledCapabilities.length - 3} more`;
      more.style.cssText = `
        font-size: 11px;
        color: var(--text-muted, #9aa3ad);
      `;
      caps.appendChild(more);
    }

    planCard.appendChild(caps);
    plansGrid.appendChild(planCard);
  });

  card.appendChild(plansGrid);
  host.appendChild(card);
}
