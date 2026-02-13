// @ts-nocheck
import { sectionCard, el } from "../../_shared/uiBlocks";

export function renderSystemOverview(host: HTMLElement): void {
  const card = sectionCard("Vue d'ensemble système", "Statistiques et santé globale de l'infrastructure");

  // KPIs principaux
  const kpisContainer = el("div");
  kpisContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  `;

  const kpis = [
    { 
      label: "Tenants actifs", 
      value: "127", 
      trend: "+12%",
      trendUp: true,
      icon: "🏢",
      color: "#5a8fff" 
    },
    { 
      label: "Utilisateurs totaux", 
      value: "2,847", 
      trend: "+8%",
      trendUp: true,
      icon: "👥",
      color: "#10b981" 
    },
    { 
      label: "Stockage utilisé", 
      value: "342 GB", 
      trend: "78%",
      trendUp: false,
      icon: "💾",
      color: "#f59e0b" 
    },
    { 
      label: "Requêtes API/jour", 
      value: "1.2M", 
      trend: "+15%",
      trendUp: true,
      icon: "⚡",
      color: "#8b5cf6" 
    },
  ];

  kpis.forEach(kpi => {
    const kpiCard = el("div");
    kpiCard.style.cssText = `
      background: var(--surface-1, #171c22);
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    `;

    kpiCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <div style="font-size: 13px; color: var(--text-muted, #9aa3ad); margin-bottom: 8px;">${kpi.label}</div>
          <div style="font-size: 32px; font-weight: 700; color: ${kpi.color};">${kpi.value}</div>
        </div>
        <div style="font-size: 32px; opacity: 0.3;">${kpi.icon}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: ${kpi.trendUp ? '#10b981' : '#ef4444'}; font-weight: 600; font-size: 13px;">
          ${kpi.trendUp ? '↑' : '↓'} ${kpi.trend}
        </span>
        <span style="font-size: 12px; color: var(--text-muted, #9aa3ad);">vs mois dernier</span>
      </div>
    `;

    kpisContainer.appendChild(kpiCard);
  });

  card.appendChild(kpisContainer);

  // Santé du système
  const healthSection = el("div");
  healthSection.style.cssText = `margin-bottom: 32px;`;

  const healthTitle = el("h3");
  healthTitle.textContent = "Santé du système";
  healthTitle.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    font-size: 18px;
    margin-bottom: 16px;
  `;
  healthSection.appendChild(healthTitle);

  const healthGrid = el("div");
  healthGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  `;

  const healthItems = [
    { name: "API Response Time", value: "45ms", status: "excellent", target: "< 100ms" },
    { name: "Database Query", value: "12ms", status: "excellent", target: "< 50ms" },
    { name: "CPU Usage", value: "34%", status: "good", target: "< 70%" },
    { name: "Memory Usage", value: "58%", status: "good", target: "< 80%" },
    { name: "Disk Space", value: "78%", status: "warning", target: "< 80%" },
    { name: "Uptime", value: "99.98%", status: "excellent", target: "> 99.9%" },
  ];

  healthItems.forEach(item => {
    const healthCard = el("div");
    healthCard.style.cssText = `
      background: var(--surface-1, #171c22);
      border: 1px solid var(--surface-border, #262d35);
      border-radius: 8px;
      padding: 16px;
    `;

    const statusColors = {
      excellent: "#10b981",
      good: "#3b82f6",
      warning: "#f59e0b",
      critical: "#ef4444",
    };

    healthCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 14px; color: var(--text-primary, #e6e9ee); font-weight: 500;">${item.name}</div>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColors[item.status]};"></div>
      </div>
      <div style="font-size: 24px; font-weight: 700; color: var(--text-primary, #e6e9ee); margin-bottom: 4px;">${item.value}</div>
      <div style="font-size: 11px; color: var(--text-muted, #9aa3ad);">Target: ${item.target}</div>
    `;

    healthGrid.appendChild(healthCard);
  });

  healthSection.appendChild(healthGrid);
  card.appendChild(healthSection);

  // Activité récente
  const activitySection = el("div");

  const activityTitle = el("h3");
  activityTitle.textContent = "Activité récente";
  activityTitle.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    font-size: 18px;
    margin-bottom: 16px;
  `;
  activitySection.appendChild(activityTitle);

  const activityList = el("div");
  activityList.style.cssText = `
    background: var(--surface-1, #171c22);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 8px;
    overflow: hidden;
  `;

  const activities = [
    { time: "Il y a 5 min", event: "Nouveau tenant créé", user: "admin@icontrol.app", icon: "🏢" },
    { time: "Il y a 12 min", event: "Plan ENTERPRISE activé", user: "system", icon: "⬆️" },
    { time: "Il y a 1h", event: "Backup automatique complété", user: "system", icon: "💾" },
    { time: "Il y a 2h", event: "47 nouveaux utilisateurs", user: "system", icon: "👥" },
    { time: "Il y a 3h", event: "Stripe webhook reçu", user: "system", icon: "💳" },
  ];

  activities.forEach((activity, index) => {
    const activityItem = el("div");
    activityItem.style.cssText = `
      padding: 16px 20px;
      border-bottom: ${index < activities.length - 1 ? '1px solid var(--surface-border, #262d35)' : 'none'};
      display: flex;
      gap: 16px;
      align-items: center;
    `;

    activityItem.innerHTML = `
      <div style="font-size: 24px;">${activity.icon}</div>
      <div style="flex: 1;">
        <div style="color: var(--text-primary, #e6e9ee); font-weight: 500; margin-bottom: 4px;">${activity.event}</div>
        <div style="font-size: 12px; color: var(--text-muted, #9aa3ad);">${activity.user} • ${activity.time}</div>
      </div>
    `;

    activityList.appendChild(activityItem);
  });

  activitySection.appendChild(activityList);
  card.appendChild(activitySection);

  host.appendChild(card);
}
