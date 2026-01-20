/**
 * ICONTROL_CP_ORGANIZATION_V3
 * Page Organisation pour l'application ADMINISTRATION (/cp)
 * Liste d'organisations isolées avec vue détail avec sidebar d'onglets
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { SUBSCRIPTION_TYPES, getSubscriptionsByCategory } from "/src/core/subscriptions/subscriptionTypes";
import { getActiveSubscriptions, activateSubscription, deactivateSubscription } from "/src/core/subscriptions/subscriptionManager";
import { showConfirmDialog } from "/src/core/ui/confirmDialog";
import { navigate, getCurrentHash } from "/src/runtime/navigate";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

// Type pour une organisation
type Organization = {
  id: string;
  name: string;
  admins: number;
  users: number;
  createdAt: string;
  region: string;
  timezone: string;
  language: string;
  multiTenant: boolean;
  status: "active" | "inactive" | "suspended";
};

// ... existing code ...

// Récupérer la liste des organisations depuis localStorage (ou API future)
function getOrganizations(): Organization[] {
  try {
    const stored = localStorage.getItem("icontrol_organizations_list");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  
  // Données par défaut - organisation principale uniquement
  return [
    {
      id: "ICONTROL-001",
      name: "iCONTROL",
      admins: 2,
      users: 5,
      createdAt: "2024-01-15",
      region: "Amérique du Nord",
      timezone: "America/Montreal",
      language: "Français",
      multiTenant: true,
      status: "active"
    }
  ];
}

function saveOrganizations(orgs: Organization[]): void {
  try {
    localStorage.setItem("icontrol_organizations_list", JSON.stringify(orgs));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des organisations:", e);
  }
}

function getOrganizationById(id: string): Organization | null {
  const orgs = getOrganizations();
  return orgs.find(o => o.id === id) || null;
}

function updateOrganization(id: string, updates: Partial<Organization>): void {
  const orgs = getOrganizations();
  const index = orgs.findIndex(o => o.id === id);
  if (index >= 0) {
    orgs[index] = { ...orgs[index], ...updates };
    saveOrganizations(orgs);
  }
}

function showToast(message: string, type: "success" | "error" | "warning" | "info" = "success"): void {
  const colors = {
    success: { bg: "rgba(78,201,176,0.15)", border: "#4ec9b0", text: "#4ec9b0" },
    error: { bg: "rgba(244,135,113,0.15)", border: "#f48771", text: "#f48771" },
    warning: { bg: "rgba(220,220,170,0.15)", border: "#dcdcaa", text: "#dcdcaa" },
    info: { bg: "rgba(59,130,246,0.15)", border: "#3b82f6", text: "#3b82f6" }
  };
  
  const color = colors[type];
  const toast = document.createElement("div");
  toast.style.minWidth = "0";
  toast.style.boxSizing = "border-box";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    background: ${color.bg};
    border: 1px solid ${color.border};
    border-left: 4px solid ${color.border};
    border-radius: 8px;
    color: ${color.text};
    font-weight: 600;
    z-index: 10001;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// Calculer l'état du système pour une organisation (2 niveaux: OK et WARN)
function getOrgSystemStatus(organization: Organization): { status: "ok" | "warn"; message: string } {
  if (organization.status === "active" && organization.users > 0) {
    return { status: "ok", message: "Système opérationnel" };
  } else if (organization.status === "active" && organization.users === 0) {
    return { status: "warn", message: "Aucun utilisateur configuré" };
  } else if (organization.status === "inactive") {
    return { status: "warn", message: "Organisation inactive" };
  } else {
    return { status: "warn", message: "Organisation suspendue" };
  }
}

// Calculer le health score d'une organisation (0-100%)
async function calculateHealthScore(organization: Organization): Promise<{ score: number; color: string; label: string }> {
  let score = 100;
  
  // Facteur 1: Statut organisation (-30 si inactive, -50 si suspendue)
  if (organization.status === "inactive") score -= 30;
  if (organization.status === "suspended") score -= 50;
  
  // Facteur 2: Utilisateurs (-20 si aucun utilisateur)
  if (organization.users === 0) score -= 20;
  
  // Facteur 3: Métriques système (simulées pour l'instant)
  try {
    const { systemMetrics } = await import("../../core/monitoring/systemMetrics");
    const metrics = systemMetrics.getLatestMetrics();
    if (metrics) {
      const cpuPercent = metrics.performance.cpu.usage || 0;
      const memPercent = metrics.performance.memory.percentage || 0;
      
      // CPU: -10 si > 80%, -5 si > 70%
      if (cpuPercent > 80) score -= 10;
      else if (cpuPercent > 70) score -= 5;
      
      // Mémoire: -10 si > 85%, -5 si > 75%
      if (memPercent > 85) score -= 10;
      else if (memPercent > 75) score -= 5;
    }
  } catch {
    // Si métriques non disponibles, pas de pénalité
  }
  
  // Facteur 4: Erreurs récentes (simulé)
  try {
    const { readAuditLog } = await import("../../core/audit/auditLog");
    const logs = readAuditLog();
    const now = Date.now();
    const recentErrors = logs.filter(log => log.level === "ERR" && now - new Date(log.ts).getTime() < 3600000).length;
    
    // -5 par erreur récente (max -20)
    score -= Math.min(recentErrors * 5, 20);
  } catch {
    // Si logs non disponibles, pas de pénalité
  }
  
  // S'assurer que le score est entre 0 et 100
  score = Math.max(0, Math.min(100, score));
  
  // Déterminer couleur et label
  let color: string;
  let label: string;
  if (score >= 90) {
    color = "#34d399"; // Vert
    label = "Excellent";
  } else if (score >= 70) {
    color = "#f59e0b"; // Jaune
    label = "Bon";
  } else if (score >= 50) {
    color = "#f97316"; // Orange
    label = "Dégradé";
  } else {
    color = "#ef4444"; // Rouge
    label = "Critique";
  }
  
  return { score, color, label };
}

// Vérifier les limites de quota utilisateurs
function checkUserQuota(organization: Organization): { percentage: number; isWarning: boolean; isExceeded: boolean; message: string } {
  const MAX_USERS = 100; // Quota par défaut (à configurer par organisation)
  const percentage = (organization.users / MAX_USERS) * 100;
  const isWarning = percentage > 80 && percentage <= 100;
  const isExceeded = percentage > 100;
  
  let message = "";
  if (isExceeded) {
    message = `Quota dépassé: ${organization.users}/${MAX_USERS} utilisateurs (${Math.round(percentage)}%)`;
  } else if (isWarning) {
    message = `Limite proche: ${organization.users}/${MAX_USERS} utilisateurs (${Math.round(percentage)}%)`;
  }
  
  return { percentage, isWarning, isExceeded, message };
}

// Extraire l'ID de l'organisation depuis l'URL
function getOrgIdFromHash(): string | null {
  const hash = getCurrentHash();
  const match = hash.match(/organization[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

// Extraire l'onglet actif depuis l'URL
function getActiveTabFromHash(): string {
  const hash = getCurrentHash();
  const match = hash.match(/[?&]tab=([^&]+)/);
  return match ? match[1] : "overview";
}

// Rendre la liste des organisations
function renderOrganizationList(root: HTMLElement, cardContent: HTMLElement): void {
  // Afficher l'icône de notification quand on revient à la liste
  const notifButton = document.querySelector(".icontrol-cp-right-section");
  if (notifButton) {
    (notifButton as HTMLElement).style.display = "";
  }
  
  // Nettoyer la flèche de retour si elle existe
  const backArrow = document.querySelector("[style*='top: 56px'][style*='left: 16px']");
  if (backArrow) {
    backArrow.remove();
  }
  
  // Réinitialiser le titre du header (en cherchant directement dans le DOM)
  const headerTitle = document.querySelector(".icontrol-cp-brand-title");
  if (headerTitle) {
    (headerTitle as HTMLElement).textContent = "Console";
  }
  
  // Réinitialiser l'indicateur d'état système avec "iCONTROL" (système principal)
  const systemStatusIndicator = document.querySelector("#icontrol-system-status-indicator") as HTMLElement;
  if (systemStatusIndicator) {
    // Supprimer toutes les données d'organisation pour revenir au système principal
    delete systemStatusIndicator.dataset.displayName;
    delete systemStatusIndicator.dataset.orgStatus;
    delete systemStatusIndicator.dataset.orgMessage;
    
    // L'indicateur sera mis à jour par le système de santé automatiquement avec "iCONTROL"
    // On force une mise à jour en déclenchant un événement ou en appelant le callback
    import("../../core/monitoring/systemHealth").then(({ systemHealthMonitor }) => {
      const health = systemHealthMonitor.getCurrentHealth();
      const statusColors = {
        healthy: { bg: "rgba(78, 201, 176, 0.08)", color: "#4ec9b0", border: "rgba(78, 201, 176, 0.2)" },
        warning: { bg: "rgba(245, 158, 11, 0.08)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" },
        error: { bg: "rgba(244, 135, 113, 0.08)", color: "#f48771", border: "rgba(244, 135, 113, 0.2)" }
      };
      const statusConfig = statusColors[health.status];
      systemStatusIndicator.style.background = statusConfig.bg;
      systemStatusIndicator.style.color = statusConfig.color;
      systemStatusIndicator.style.border = `1px solid ${statusConfig.border}`;
      systemStatusIndicator.innerHTML = `<span>iCONTROL</span>`;
      systemStatusIndicator.classList.remove("status-healthy", "status-warning", "status-error");
      systemStatusIndicator.classList.add(`status-${health.status}`);
    }).catch(() => {
      // Fallback si le module n'est pas disponible
      systemStatusIndicator.innerHTML = `<span>iCONTROL</span>`;
    });
  }
  
  const orgs = getOrganizations();
  
  const listContainer = document.createElement("div");
  listContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px; padding: 24px;";
  
  if (orgs.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--ic-mutedText, #858585);">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Aucune organisation</div>
        <div style="font-size:14px;">Créez une nouvelle organisation pour commencer.</div>
      </div>
    `;
    cardContent.appendChild(listContainer);
    return;
  }
  
  // En-tête de tableau
  const header = document.createElement("div");
  header.style.cssText = `
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px;
    gap: 16px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--ic-border, #3e3e3e);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ic-mutedText, #858585);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  header.innerHTML = `
    <div>Organisation</div>
    <div style="text-align:center;">Statut / État</div>
    <div style="text-align:center;">Utilisateurs</div>
    <div style="text-align:center;">Région</div>
    <div style="text-align:center;">Créée le</div>
    <div style="text-align:center;">Santé</div>
    <div style="text-align:center;">Actions</div>
  `;
  listContainer.appendChild(header);
  
  // Lignes d'organisations (hauteur réduite)
  orgs.forEach(org => {
    const row = document.createElement("div");
    row.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px;
      gap: 16px;
      padding: 10px 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--ic-border, #3e3e3e);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      align-items: center;
    `;
    row.onmouseenter = () => {
      row.style.background = "rgba(255,255,255,0.05)";
      row.style.borderColor = "var(--ic-accent, #7b2cff)";
      row.style.transform = "translateX(4px)";
    };
    row.onmouseleave = () => {
      row.style.background = "rgba(255,255,255,0.02)";
      row.style.borderColor = "var(--ic-border, #3e3e3e)";
      row.style.transform = "translateX(0)";
    };
    
    const statusColor = org.status === "active" ? "#4ec9b0" : 
                       org.status === "inactive" ? "#858585" : "#f48771";
    const statusText = org.status === "active" ? "Actif" : 
                      org.status === "inactive" ? "Inactif" : "Suspendu";
    
    // État système de l'organisation (seulement 2 niveaux: OK et WARN)
    const orgSystemStatus = getOrgSystemStatus(org);
    const systemStatusColor = orgSystemStatus.status === "ok" ? "#4ec9b0" : "#f59e0b";
    const systemStatusIcon = orgSystemStatus.status === "ok" ? "✓" : "⚠";
    const systemStatusText = orgSystemStatus.status === "ok" ? "OK" : "WARN";
    
    // Vérifier quota utilisateurs
    const quotaInfo = checkUserQuota(org);
    const quotaBadge = quotaInfo.isExceeded 
      ? `<span style="padding:2px 6px;background:#ef444415;color:#ef4444;border-radius:4px;font-size:10px;font-weight:600;margin-left:4px;" title="${quotaInfo.message}">⚠ Quota</span>`
      : quotaInfo.isWarning
      ? `<span style="padding:2px 6px;background:#f59e0b15;color:#f59e0b;border-radius:4px;font-size:10px;font-weight:600;margin-left:4px;" title="${quotaInfo.message}">⚠ Limite</span>`
      : "";
    
    // Health score (chargé de manière asynchrone)
    const healthScoreCell = document.createElement("div");
    healthScoreCell.style.cssText = "text-align:center;";
    healthScoreCell.innerHTML = `<div style="color:var(--ic-mutedText,#858585);font-size:11px;">Chargement...</div>`;
    
    calculateHealthScore(org).then(health => {
      healthScoreCell.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="padding:4px 10px;background:${health.color}15;color:${health.color};border:1px solid ${health.color}40;border-radius:6px;font-size:12px;font-weight:700;min-width:50px;">
            ${health.score}%
          </div>
          <div style="font-size:10px;color:var(--ic-mutedText,#858585);">${health.label}</div>
        </div>
      `;
    });
    
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div>
          <div style="font-weight:600;color:var(--ic-text, #d4d4d4);font-size:14px;line-height:1.3;">${org.name}</div>
          <div style="font-size:11px;color:var(--ic-mutedText, #858585);font-family:monospace;line-height:1.2;">${org.id}</div>
        </div>
      </div>
      <div style="text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center;">
        <span style="padding:4px 8px;background:${statusColor}15;color:${statusColor};border-radius:4px;font-size:12px;font-weight:600;">
          ${statusText}
        </span>
        <span style="padding:3px 8px;background:${systemStatusColor}15;color:${systemStatusColor};border:1px solid ${systemStatusColor}40;border-radius:4px;font-size:10px;font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:help;" title="${orgSystemStatus.message}">
          <span style="font-size:12px;">${systemStatusIcon}</span>
          <span>${systemStatusText}</span>
        </span>
      </div>
      <div style="text-align:center;color:var(--ic-text, #d4d4d4);">
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
          <span style="font-weight:600;">${org.users}</span>
          <span style="color:var(--ic-mutedText, #858585);font-size:12px;">utilisateurs</span>
          ${quotaBadge}
        </div>
      </div>
      <div style="text-align:center;color:var(--ic-mutedText, #858585);font-size:14px;">${org.region}</div>
      <div style="text-align:center;color:var(--ic-mutedText, #858585);font-size:14px;">${org.createdAt}</div>
    `;
    
    // Ajouter la cellule health score
    const healthCell = document.createElement("div");
    healthCell.style.cssText = "text-align:center;";
    healthCell.appendChild(healthScoreCell);
    row.appendChild(healthCell);
    
    // Colonne Actions avec bouton "Entrer"
    const actionsCell = document.createElement("div");
    actionsCell.style.cssText = "display:flex;gap:8px;justify-content:center;align-items:center;";
    actionsCell.onclick = (e) => e.stopPropagation(); // Empêcher le clic sur la ligne
    
    const enterBtn = document.createElement("button");
    enterBtn.textContent = "Entrer";
    enterBtn.style.cssText = `
      padding: 6px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.2s;
    `;
    enterBtn.onmouseenter = () => {
      enterBtn.style.background = "#2563eb";
      enterBtn.style.transform = "scale(1.05)";
    };
    enterBtn.onmouseleave = () => {
      enterBtn.style.background = "#3b82f6";
      enterBtn.style.transform = "scale(1)";
    };
    enterBtn.onclick = async (e) => {
      e.stopPropagation();
      // Switcher le contexte vers cette organisation
      try {
        const { setTenantId } = await import("../../core/runtime/tenant");
        setTenantId(org.id);
        showToast(`Contexte changé vers l'organisation "${org.name}"`, "success");
      } catch (error) {
        console.error("Erreur lors du changement de contexte:", error);
        showToast(`Erreur lors du changement de contexte`, "error");
      }
      // Naviguer vers le détail de l'organisation
      navigate(`#/organization?id=${org.id}`);
    };
    
    const menuBtn = document.createElement("button");
    menuBtn.innerHTML = "⋮";
    menuBtn.style.cssText = `
      padding: 6px 10px;
      background: rgba(255,255,255,0.05);
      color: var(--ic-text, #e7ecef);
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    `;
    menuBtn.onmouseenter = () => {
      menuBtn.style.background = "rgba(255,255,255,0.1)";
    };
    menuBtn.onmouseleave = () => {
      menuBtn.style.background = "rgba(255,255,255,0.05)";
    };
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      // TODO: Afficher menu dropdown avec options (Voir détails, Modifier, Dupliquer, etc.)
      navigate(`#/organization?id=${org.id}`);
    };
    
    actionsCell.appendChild(enterBtn);
    actionsCell.appendChild(menuBtn);
    row.appendChild(actionsCell);
    
    // Clic sur la ligne = voir détails
    row.onclick = () => {
      navigate(`#/organization?id=${org.id}`);
    };
    
    listContainer.appendChild(row);
  });
  
  cardContent.appendChild(listContainer);
}

// Créer un graphique SVG pour les données de l'organisation
function createOrgChart(width: number, height: number, data: number[], color: string, label: string): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "padding: 12px; background: var(--ic-panel, #1a1d1f); border: 1px solid var(--ic-border, #2b3136); border-radius: 6px;";
  
  const title = document.createElement("div");
  title.textContent = label;
  title.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;";
  container.appendChild(title);
  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.cssText = "display: block;";
  
  if (data.length > 0) {
    const stepX = (width - 20) / (data.length - 1);
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;
    
    const points: string[] = [];
    data.forEach((val, index) => {
      const x = 10 + (index * stepX);
      const y = height - 20 - ((val - minVal) / range) * (height - 40);
      points.push(`${x},${y}`);
    });
    
    const path = `M ${points.join(" L ")}`;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", path);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.appendChild(line);
  }
  
  container.appendChild(svg);
  return container;
}

// Créer la vue d'ensemble avec graphiques
function createOverviewTab(org: Organization, contentContainer: HTMLElement): void {
  contentContainer.innerHTML = "";
  
  // Statistiques rapides
  const activeSubs = getActiveSubscriptions();
  const activeSubsCount = activeSubs.filter(s => s.status === "active").length;
  const totalSubs = SUBSCRIPTION_TYPES.length;
  
  const statsDiv = document.createElement("div");
  statsDiv.style.cssText = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;";
  statsDiv.innerHTML = `
    <div style="padding: 16px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Utilisateurs</div>
      <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${org.users}</div>
    </div>
    <div style="padding: 16px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Abonnements actifs</div>
      <div style="font-size: 24px; font-weight: 700; color: #34d399;">${activeSubsCount}/${totalSubs}</div>
    </div>
    <div style="padding: 16px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Mode système</div>
      <div style="font-size: 18px; font-weight: 700; color: ${activeSubsCount > 0 ? "#34d399" : "#f59e0b"};">${activeSubsCount > 0 ? "Premium" : "Gratuit"}</div>
    </div>
  `;
  contentContainer.appendChild(statsDiv);
  
  // Grille de graphiques 2x2
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 16px;
    height: calc(100vh - 500px);
    min-height: 400px;
  `;
  
  // Graphique 1: Utilisateurs actifs
  const usersData = [org.users, org.users + 1, org.users - 1, org.users, org.users + 2, org.users, org.users - 1];
  const usersChart = createOrgChart(300, 150, usersData, "#3b82f6", "Utilisateurs actifs");
  grid.appendChild(usersChart);
  
  // Graphique 2: Abonnements (actifs vs total)
  const subsData = [activeSubsCount, activeSubsCount + 1, activeSubsCount, activeSubsCount, activeSubsCount, activeSubsCount, activeSubsCount];
  const subsChart = createOrgChart(300, 150, subsData, "#34d399", "Abonnements actifs");
  grid.appendChild(subsChart);
  
  // Graphique 3: Utilisation des ressources
  const resourcesData = [78, 82, 75, 88, 80, 85, 83];
  const resourcesChart = createOrgChart(300, 150, resourcesData, "#f59e0b", "Utilisation ressources");
  grid.appendChild(resourcesChart);
  
  // Graphique 4: Performance système
  const perfData = [92, 88, 94, 90, 93, 89, 91];
  const perfChart = createOrgChart(300, 150, perfData, "#8b5cf6", "Performance système");
  grid.appendChild(perfChart);
  
  contentContainer.appendChild(grid);
}

// Créer l'onglet Informations générales
function createGeneralInfoTab(org: Organization, contentContainer: HTMLElement, orgId: string): void {
  // Calculer l'état du système pour cette organisation
  const orgSystemStatus = getOrgSystemStatus(org);
  const overallStatus = orgSystemStatus.status;
  const statusBg = overallStatus === "ok" ? "rgba(78, 201, 176, 0.1)" : "rgba(245, 158, 11, 0.1)";
  const statusBorder = overallStatus === "ok" ? "#4ec9b0" : "#f59e0b";
  const statusIcon = overallStatus === "ok" ? "✅" : "⚠️";
  const statusText = overallStatus === "ok" ? "Système Opérationnel" : "Système en Avertissement";
  const statusSubText = orgSystemStatus.message;
  
  contentContainer.innerHTML = `
    <!-- Header avec état du système en haut à droite -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div style="flex: 1;"></div>
      <div style="padding: 16px 20px; background: ${statusBg}; border-left: 4px solid ${statusBorder}; border-radius: 8px; min-width: 280px; max-width: 400px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">${statusIcon}</span>
          <div>
            <div style="font-weight: 600; color: var(--ic-text, #e7ecef); font-size: 16px; margin-bottom: 4px;">
              ${statusText}
            </div>
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 13px;">
              ${statusSubText}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:16px;">
      <div style="padding:14px;border:1px solid var(--ic-border, #3e3e3e);border-radius:8px;background:rgba(255,255,255,0.02);">
        <div style="font-weight:600;color:var(--ic-text, #d4d4d4);margin-bottom:12px;font-size:13px;">
          Informations générales
        </div>
        <div style="display:grid;gap:8px;">
          <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
            <span style="color:var(--ic-mutedText, #858585);">Nom</span>
            <input id="orgNameInput" type="text" value="${org.name}" style="padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--ic-border, #3e3e3e);border-radius:4px;color:var(--ic-text, #d4d4d4);font-size:14px;width:150px;text-align:right;">
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;align-items:center;">
            <span style="color:var(--ic-mutedText, #858585);font-size:13px;">Créée le</span>
            <span style="font-weight:600;font-size:13px;">${org.createdAt}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;align-items:center;">
            <span style="color:var(--ic-mutedText, #858585);font-size:13px;">Statut</span>
            <select id="orgStatusSelect" style="padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--ic-border, #3e3e3e);border-radius:4px;color:var(--ic-text, #d4d4d4);font-size:13px;">
              <option value="active" ${org.status === "active" ? "selected" : ""}>Actif</option>
              <option value="inactive" ${org.status === "inactive" ? "selected" : ""}>Inactif</option>
              <option value="suspended" ${org.status === "suspended" ? "selected" : ""}>Suspendu</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="saveGeneralBtn" style="padding:10px 20px;background:var(--ic-accent, #7b2cff);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;transition:all 0.2s;">
        Enregistrer les modifications
      </button>
    </div>
  `;
  
  const saveBtn = contentContainer.querySelector("#saveGeneralBtn") as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.onclick = () => {
      const nameInput = contentContainer.querySelector("#orgNameInput") as HTMLInputElement;
      const statusSelect = contentContainer.querySelector("#orgStatusSelect") as HTMLSelectElement;
      
      updateOrganization(orgId, {
        name: nameInput?.value || org.name,
        status: (statusSelect?.value as any) || org.status
      });
      showToast("✅ Informations modifiées avec succès", "success");
      
      setTimeout(() => {
        const newOrg = getOrganizationById(orgId);
        if (newOrg) {
          createGeneralInfoTab(newOrg, contentContainer, orgId);
        }
      }, 500);
    };
  }
}

// Type pour un utilisateur d'organisation
type OrgUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin?: string;
};

// Récupérer les utilisateurs d'une organisation
function getOrgUsers(orgId: string): OrgUser[] {
  try {
    const stored = localStorage.getItem(`icontrol_org_users_${orgId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  
  // Données par défaut pour l'organisation
  const defaultUsers: OrgUser[] = [
    {
      id: "user-001",
      username: "admin",
      email: "admin@example.com",
      role: "ADMIN",
      status: "active",
      createdAt: "2024-01-15",
      lastLogin: "2024-01-20"
    },
    {
      id: "user-002",
      username: "user1",
      email: "user1@example.com",
      role: "USER",
      status: "active",
      createdAt: "2024-01-16"
    },
    {
      id: "user-003",
      username: "user2",
      email: "user2@example.com",
      role: "USER",
      status: "inactive",
      createdAt: "2024-01-17"
    }
  ];
  
  saveOrgUsers(orgId, defaultUsers);
  return defaultUsers;
}

function saveOrgUsers(orgId: string, users: OrgUser[]): void {
  try {
    localStorage.setItem(`icontrol_org_users_${orgId}`, JSON.stringify(users));
    // Mettre à jour le nombre d'utilisateurs dans l'organisation
    const org = getOrganizationById(orgId);
    if (org) {
      updateOrganization(orgId, {
        users: users.length,
        admins: users.filter(u => u.role === "ADMIN" || u.role === "SYSADMIN").length
      });
    }
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des utilisateurs:", e);
  }
}

function getOrgUserById(orgId: string, userId: string): OrgUser | null {
  const users = getOrgUsers(orgId);
  return users.find(u => u.id === userId) || null;
}

function updateOrgUser(orgId: string, userId: string, updates: Partial<OrgUser>): void {
  const users = getOrgUsers(orgId);
  const index = users.findIndex(u => u.id === userId);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    saveOrgUsers(orgId, users);
  }
}

function addOrgUser(orgId: string, user: Omit<OrgUser, "id" | "createdAt">): void {
  const users = getOrgUsers(orgId);
  const newId = `user-${Date.now()}`;
  const newUser: OrgUser = {
    ...user,
    id: newId,
    createdAt: new Date().toISOString().split("T")[0]
  };
  users.push(newUser);
  saveOrgUsers(orgId, users);
}

function deleteOrgUser(orgId: string, userId: string): void {
  const users = getOrgUsers(orgId);
  const filtered = users.filter(u => u.id !== userId);
  saveOrgUsers(orgId, filtered);
}

// Extraire l'ID utilisateur depuis l'URL
function getUserIdFromHash(): string | null {
  const hash = getCurrentHash();
  const match = hash.match(/[?&]userId=([^&]+)/);
  return match ? match[1] : null;
}

// Créer l'onglet Utilisateurs avec liste
function createUsersTab(org: Organization, contentContainer: HTMLElement, orgId: string): void {
  const userId = getUserIdFromHash();
  
  if (userId) {
    // Afficher le détail d'un utilisateur
    createUserDetailView(orgId, userId, contentContainer);
  } else {
    // Afficher la liste des utilisateurs
    createUsersListView(orgId, contentContainer);
  }
}

// Créer la vue liste des utilisateurs
function createUsersListView(orgId: string, contentContainer: HTMLElement): void {
  const users = getOrgUsers(orgId);
  
  contentContainer.innerHTML = "";
  
  // En-tête avec statistiques
  const statsDiv = document.createElement("div");
  statsDiv.style.cssText = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;";
  statsDiv.innerHTML = `
    <div style="padding: 14px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Total</div>
      <div style="font-size: 20px; font-weight: 700; color: var(--ic-text, #d4d4d4);">${users.length}</div>
    </div>
    <div style="padding: 14px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Actifs</div>
      <div style="font-size: 20px; font-weight: 700; color: #4ec9b0;">${users.filter(u => u.status === "active").length}</div>
    </div>
    <div style="padding: 14px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);">
      <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Administrateurs</div>
      <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${users.filter(u => u.role === "ADMIN" || u.role === "SYSADMIN").length}</div>
    </div>
  `;
  contentContainer.appendChild(statsDiv);
  
  // En-tête de tableau
  const header = document.createElement("div");
  header.style.cssText = `
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 80px;
    gap: 16px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--ic-border, #3e3e3e);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ic-mutedText, #858585);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `;
  header.innerHTML = `
    <div>Utilisateur</div>
    <div>Rôle</div>
    <div>Email</div>
    <div style="text-align:center;">Statut</div>
    <div style="text-align:center;">Créé le</div>
    <div></div>
  `;
  contentContainer.appendChild(header);
  
  // Bouton Ajouter utilisateur
  const addBtnContainer = document.createElement("div");
  addBtnContainer.style.cssText = "display: flex; justify-content: flex-end; margin-bottom: 12px;";
  const addBtn = document.createElement("button");
  addBtn.innerHTML = "+ Ajouter un utilisateur";
  addBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-accent, #7b2cff);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  addBtn.onmouseenter = () => {
    addBtn.style.background = "#8b3cff";
    addBtn.style.transform = "translateY(-1px)";
  };
  addBtn.onmouseleave = () => {
    addBtn.style.background = "var(--ic-accent, #7b2cff)";
    addBtn.style.transform = "translateY(0)";
  };
  addBtn.onclick = () => {
    showAddUserModal(orgId, contentContainer);
  };
  addBtnContainer.appendChild(addBtn);
  contentContainer.appendChild(addBtnContainer);
  
  // Lignes d'utilisateurs
  if (users.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.style.cssText = "text-align: center; padding: 40px; color: var(--ic-mutedText, #858585);";
    emptyDiv.innerHTML = `
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Aucun utilisateur</div>
      <div style="font-size: 14px;">Ajoutez des utilisateurs à cette organisation.</div>
    `;
    contentContainer.appendChild(emptyDiv);
  } else {
    users.forEach(user => {
      const row = document.createElement("div");
      row.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 80px;
        gap: 16px;
        padding: 12px 16px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--ic-border, #3e3e3e);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        align-items: center;
        margin-bottom: 8px;
      `;
      
      row.onmouseenter = () => {
        row.style.background = "rgba(255,255,255,0.05)";
        row.style.borderColor = "var(--ic-accent, #7b2cff)";
        row.style.transform = "translateX(4px)";
      };
      row.onmouseleave = () => {
        row.style.background = "rgba(255,255,255,0.02)";
        row.style.borderColor = "var(--ic-border, #3e3e3e)";
        row.style.transform = "translateX(0)";
      };
      
      row.onclick = () => {
        const orgIdFromHash = getOrgIdFromHash();
        navigate(`#/organization?id=${orgIdFromHash}&tab=users&userId=${user.id}`);
      };
      
      const statusColor = user.status === "active" ? "#4ec9b0" : 
                         user.status === "inactive" ? "#858585" : "#f48771";
      const statusText = user.status === "active" ? "Actif" : 
                        user.status === "inactive" ? "Inactif" : "Suspendu";
      
      const roleColor = user.role === "ADMIN" || user.role === "SYSADMIN" ? "#3b82f6" : 
                       user.role === "DEVELOPER" ? "#8b5cf6" : "#858585";
      
      // Bouton supprimer
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.style.cssText = `
        padding: 4px 8px;
        background: rgba(244,135,113,0.15);
        color: #f48771;
        border: 1px solid #f48771;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      `;
      deleteBtn.onmouseenter = () => {
        deleteBtn.style.background = "rgba(244,135,113,0.25)";
        deleteBtn.style.transform = "scale(1.1)";
      };
      deleteBtn.onmouseleave = () => {
        deleteBtn.style.background = "rgba(244,135,113,0.15)";
        deleteBtn.style.transform = "scale(1)";
      };
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        showConfirmDialog({
          title: "Supprimer l'utilisateur",
          message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ? Cette action est irréversible.`,
          confirmText: "Supprimer",
          confirmColor: "danger",
          onConfirm: () => {
            deleteOrgUser(orgId, user.id);
            showToast(`✅ Utilisateur "${user.username}" supprimé avec succès`, "success");
            setTimeout(() => {
              createUsersListView(orgId, contentContainer);
            }, 300);
          }
        });
      };
      
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <div>
            <div style="font-weight:600;color:var(--ic-text, #d4d4d4);font-size:14px;line-height:1.3;">${user.username}</div>
            <div style="font-size:11px;color:var(--ic-mutedText, #858585);font-family:monospace;line-height:1.2;">${user.id}</div>
          </div>
        </div>
        <div>
          <span style="padding:4px 8px;background:${roleColor}15;color:${roleColor};border-radius:4px;font-size:12px;font-weight:600;">
            ${user.role}
          </span>
        </div>
        <div style="color:var(--ic-text, #d4d4d4);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.email}</div>
        <div style="text-align:center;">
          <span style="padding:4px 8px;background:${statusColor}15;color:${statusColor};border-radius:4px;font-size:12px;font-weight:600;">
            ${statusText}
          </span>
        </div>
        <div style="text-align:center;color:var(--ic-mutedText, #858585);font-size:13px;">${user.createdAt}</div>
        <div style="text-align:center;"></div>
      `;
      const lastCell = row.querySelector("div:last-child");
      if (lastCell) {
        lastCell.appendChild(deleteBtn);
      }
      
      contentContainer.appendChild(row);
    });
  }
}

// Modal pour ajouter un utilisateur
function showAddUserModal(orgId: string, contentContainer: HTMLElement): void {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: #1e1e1e;
    border: 1px solid #3e3e3e;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  `;
  
  modalContent.innerHTML = `
    <div style="font-size: 18px; font-weight: 700; color: #d4d4d4; margin-bottom: 20px;">
      Ajouter un utilisateur
    </div>
    
    <div style="display: grid; gap: 16px; margin-bottom: 24px;">
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Nom d'utilisateur *</label>
        <input id="newUsernameInput" type="text" placeholder="ex: john.doe" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Email *</label>
        <input id="newEmailInput" type="email" placeholder="ex: john.doe@example.com" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Rôle *</label>
        <select id="newRoleSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SYSADMIN">SYSADMIN</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Statut</label>
        <select id="newStatusSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
          <option value="active" selected>Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="cancelAddBtn" style="padding: 10px 20px; background: rgba(255,255,255,0.05); color: var(--ic-text, #d4d4d4); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
        Annuler
      </button>
      <button id="confirmAddBtn" style="padding: 10px 20px; background: var(--ic-accent, #7b2cff); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
        Ajouter
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  const cancelBtn = modalContent.querySelector("#cancelAddBtn") as HTMLButtonElement;
  const confirmBtn = modalContent.querySelector("#confirmAddBtn") as HTMLButtonElement;
  const usernameInput = modalContent.querySelector("#newUsernameInput") as HTMLInputElement;
  const emailInput = modalContent.querySelector("#newEmailInput") as HTMLInputElement;
  const roleSelect = modalContent.querySelector("#newRoleSelect") as HTMLSelectElement;
  const statusSelect = modalContent.querySelector("#newStatusSelect") as HTMLSelectElement;
  
  const closeModal = () => modal.remove();
  
  cancelBtn.onclick = closeModal;
  
  confirmBtn.onclick = () => {
    const username = usernameInput?.value.trim();
    const email = emailInput?.value.trim();
    const role = roleSelect?.value;
    const status = statusSelect?.value;
    
    if (!username || !email) {
      showToast("❌ Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUsers = getOrgUsers(orgId);
    if (existingUsers.some(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) {
      showToast("❌ Un utilisateur avec ce nom ou cet email existe déjà", "error");
      return;
    }
    
    addOrgUser(orgId, {
      username,
      email,
      role: role || "USER",
      status: (status as any) || "active"
    });
    
    showToast(`✅ Utilisateur "${username}" ajouté avec succès`, "success");
    closeModal();
    
    setTimeout(() => {
      createUsersListView(orgId, contentContainer);
    }, 300);
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

// Créer la vue détail d'un utilisateur
function createUserDetailView(orgId: string, userId: string, contentContainer: HTMLElement): void {
  const user = getOrgUserById(orgId, userId);
  
  if (!user) {
    contentContainer.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--ic-mutedText, #858585);">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Utilisateur non trouvé</div>
        <button id="backToList" style="margin-top:16px;padding:10px 20px;background:var(--ic-accent, #7b2cff);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          Retour à la liste
        </button>
      </div>
    `;
    const backBtn = contentContainer.querySelector("#backToList");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        navigate(`#/organization?id=${orgId}&tab=users`);
      });
    }
    return;
  }
  
  // Bouton retour
  const backBtn = document.createElement("button");
  backBtn.innerHTML = "← Retour à la liste";
  backBtn.style.cssText = `
    padding: 8px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--ic-border, #3e3e3e);
    border-radius: 6px;
    color: var(--ic-text, #d4d4d4);
    cursor: pointer;
    font-size: 13px;
    margin-bottom: 20px;
    transition: all 0.2s;
  `;
  backBtn.onmouseenter = () => {
    backBtn.style.background = "rgba(255,255,255,0.05)";
    backBtn.style.borderColor = "var(--ic-accent, #7b2cff)";
  };
  backBtn.onmouseleave = () => {
    backBtn.style.background = "rgba(255,255,255,0.02)";
    backBtn.style.borderColor = "var(--ic-border, #3e3e3e)";
  };
  backBtn.onclick = () => {
    navigate(`#/organization?id=${orgId}&tab=users`);
  };
  contentContainer.appendChild(backBtn);
  
  // Formulaire de modification
  const formDiv = document.createElement("div");
  formDiv.style.cssText = "padding: 20px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02);";
  
  formDiv.innerHTML = `
    <div style="font-size: 18px; font-weight: 700; color: var(--ic-text, #d4d4d4); margin-bottom: 20px;">
      Modifier l'utilisateur
    </div>
    
    <div style="display: grid; gap: 16px;">
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Nom d'utilisateur</label>
        <input id="userUsernameInput" type="text" value="${user.username}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px;">
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Email</label>
        <input id="userEmailInput" type="email" value="${user.email}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px;">
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Rôle</label>
        <select id="userRoleSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px;">
          <option value="USER" ${user.role === "USER" ? "selected" : ""}>USER</option>
          <option value="ADMIN" ${user.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          <option value="SYSADMIN" ${user.role === "SYSADMIN" ? "selected" : ""}>SYSADMIN</option>
          <option value="DEVELOPER" ${user.role === "DEVELOPER" ? "selected" : ""}>DEVELOPER</option>
        </select>
      </div>
      
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Statut</label>
        <select id="userStatusSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px;">
          <option value="active" ${user.status === "active" ? "selected" : ""}>Actif</option>
          <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inactif</option>
          <option value="suspended" ${user.status === "suspended" ? "selected" : ""}>Suspendu</option>
        </select>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px;">
        <div>
          <div style="font-size: 11px; color: var(--ic-mutedText, #858585);">Créé le</div>
          <div style="font-size: 13px; color: var(--ic-text, #d4d4d4); font-weight: 600;">${user.createdAt}</div>
        </div>
        ${user.lastLogin ? `
        <div>
          <div style="font-size: 11px; color: var(--ic-mutedText, #858585);">Dernière connexion</div>
          <div style="font-size: 13px; color: var(--ic-text, #d4d4d4); font-weight: 600;">${user.lastLogin}</div>
        </div>
        ` : ''}
      </div>
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
      <button id="cancelUserBtn" style="padding: 10px 20px; background: rgba(255,255,255,0.05); color: var(--ic-text, #d4d4d4); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
        Annuler
      </button>
      <button id="saveUserBtn" style="padding: 10px 20px; background: var(--ic-accent, #7b2cff); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
        Enregistrer
      </button>
    </div>
  `;
  
  contentContainer.appendChild(formDiv);
  
  // Event listeners
  const cancelBtn = contentContainer.querySelector("#cancelUserBtn") as HTMLButtonElement;
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      navigate(`#/organization?id=${orgId}&tab=users`);
    };
  }
  
  const saveBtn = contentContainer.querySelector("#saveUserBtn") as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.onclick = () => {
      const usernameInput = contentContainer.querySelector("#userUsernameInput") as HTMLInputElement;
      const emailInput = contentContainer.querySelector("#userEmailInput") as HTMLInputElement;
      const roleSelect = contentContainer.querySelector("#userRoleSelect") as HTMLSelectElement;
      const statusSelect = contentContainer.querySelector("#userStatusSelect") as HTMLSelectElement;
      
      updateOrgUser(orgId, userId, {
        username: usernameInput?.value || user.username,
        email: emailInput?.value || user.email,
        role: (roleSelect?.value as any) || user.role,
        status: (statusSelect?.value as any) || user.status
      });
      
      showToast("✅ Utilisateur modifié avec succès", "success");
      
      setTimeout(() => {
        navigate(`#/organization?id=${orgId}&tab=users`);
      }, 500);
    };
  }
}

// Type pour les pages disponibles
type PageAccess = {
  id: string;
  label: string;
  category: "core" | "administration" | "modules";
  required: boolean; // Pages obligatoires qui ne peuvent pas être désactivées
};

// Liste des pages disponibles
const AVAILABLE_PAGES: PageAccess[] = [
  // Pages core (obligatoires)
  { id: "dashboard", label: "Dashboard", category: "core", required: true },
  { id: "account", label: "Compte", category: "core", required: true },
  
  // Pages administration
  { id: "users", label: "Utilisateurs", category: "administration", required: false },
  { id: "management", label: "Management", category: "administration", required: false },
  { id: "settings", label: "Paramètres", category: "administration", required: false },
  { id: "system", label: "Système", category: "administration", required: false },
  { id: "logs", label: "Logs", category: "administration", required: false },
  { id: "subscription", label: "Abonnement", category: "administration", required: false },
  { id: "organization", label: "Organisation", category: "administration", required: false },
  { id: "twofactor", label: "2FA", category: "administration", required: false },
  { id: "sessions", label: "Sessions", category: "administration", required: false },
  { id: "backup", label: "Backup", category: "administration", required: false },
  { id: "featureflags", label: "Feature Flags", category: "administration", required: false },
  
  // Pages modules
  { id: "developer", label: "Développeur", category: "modules", required: false },
  { id: "dossiers", label: "Dossiers", category: "modules", required: false }
];

// Récupérer les pages actives pour une organisation
function getOrgActivePages(orgId: string): string[] {
  try {
    const stored = localStorage.getItem(`icontrol_org_pages_${orgId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  
  // Par défaut, toutes les pages sont actives sauf celles optionnelles
  const defaultPages = AVAILABLE_PAGES
    .filter(page => page.required || page.category === "core")
    .map(page => page.id);
  
  saveOrgActivePages(orgId, defaultPages);
  return defaultPages;
}

function saveOrgActivePages(orgId: string, pages: string[]): void {
  try {
    localStorage.setItem(`icontrol_org_pages_${orgId}`, JSON.stringify(pages));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des pages:", e);
  }
}

function isPageActiveForOrg(orgId: string, pageId: string): boolean {
  const activePages = getOrgActivePages(orgId);
  return activePages.includes(pageId);
}

function toggleOrgPage(orgId: string, pageId: string, active: boolean): void {
  const activePages = getOrgActivePages(orgId);
  
  if (active && !activePages.includes(pageId)) {
    activePages.push(pageId);
    saveOrgActivePages(orgId, activePages);
  } else if (!active && activePages.includes(pageId)) {
    const filtered = activePages.filter(p => p !== pageId);
    saveOrgActivePages(orgId, filtered);
  }
}

// Créer l'onglet Modèles (accès aux pages)
function createModelsTab(org: Organization, contentContainer: HTMLElement, orgId: string): void {
  contentContainer.innerHTML = "";
  
  const activePages = getOrgActivePages(orgId);
  const activePagesSet = new Set(activePages);
  
  // Compte rendu de l'état
  const statusCard = document.createElement("div");
  statusCard.style.cssText = "padding: 16px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02); margin-bottom: 20px;";
  
  const totalPages = AVAILABLE_PAGES.length;
  const activeCount = activePages.length;
  const requiredCount = AVAILABLE_PAGES.filter(p => p.required).length;
  
  statusCard.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #3b82f620; display: flex; align-items: center; justify-content: center; font-size: 24px;">
        📄
      </div>
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 700; color: var(--ic-text, #d4d4d4); margin-bottom: 4px;">
          Accès aux Pages
        </div>
        <div style="font-size: 13px; color: var(--ic-mutedText, #858585);">
          Configurez les pages accessibles pour cette organisation
        </div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-top: 16px; border-top: 1px solid var(--ic-border, #3e3e3e);">
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Pages actives</div>
        <div style="font-size: 20px; font-weight: 700; color: #34d399;">${activeCount}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Disponibles</div>
        <div style="font-size: 20px; font-weight: 700; color: var(--ic-text, #d4d4d4);">${totalPages}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Obligatoires</div>
        <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${requiredCount}</div>
      </div>
    </div>
  `;
  contentContainer.appendChild(statusCard);
  
  // Pages par catégorie
  const categories = [
    { id: "core", label: "Pages Core", color: "#3b82f6" },
    { id: "administration", label: "Administration", color: "#8b5cf6" },
    { id: "modules", label: "Modules", color: "#34d399" }
  ];
  
  categories.forEach(category => {
    const categoryPages = AVAILABLE_PAGES.filter(p => p.category === category.id);
    if (categoryPages.length === 0) return;
    
    const categorySection = document.createElement("div");
    categorySection.style.cssText = "margin-bottom: 24px;";
    categorySection.innerHTML = `
      <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #d4d4d4); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <span style="width: 4px; height: 16px; background: ${category.color}; border-radius: 2px;"></span>
        ${category.label}
      </div>
      <div id="pages-${category.id}" style="display: grid; gap: 8px;"></div>
    `;
    contentContainer.appendChild(categorySection);
    
    const categoryContainer = categorySection.querySelector(`#pages-${category.id}`);
    categoryPages.forEach(page => {
      const isActive = activePagesSet.has(page.id);
      const pageCard = document.createElement("div");
      pageCard.style.cssText = `
        padding: 14px;
        border: 1px solid ${isActive ? "#34d399" : "var(--ic-border, #3e3e3e)"};
        border-radius: 8px;
        background: ${isActive ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)"};
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s;
        ${page.required ? "opacity: 0.7;" : ""}
      `;
      
      pageCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: var(--ic-text, #d4d4d4); font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              ${page.label}
              ${page.required ? '<span style="padding: 2px 6px; background: #f59e0b20; color: #f59e0b; border-radius: 4px; font-size: 10px; font-weight: 600;">Obligatoire</span>' : ''}
            </div>
            <div style="font-size: 12px; color: var(--ic-mutedText, #858585); font-family: monospace;">
              /${page.id}
            </div>
          </div>
        </div>
        <label style="display: flex; align-items: center; gap: 8px; cursor: ${page.required ? "not-allowed" : "pointer"}; padding: 8px 12px; background: ${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}; border-radius: 6px; transition: all 0.2s; opacity: ${page.required ? "0.6" : "1"};" 
          ${page.required ? "" : `onmouseenter="this.style.background='${isActive ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}'" onmouseleave="this.style.background='${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}'"`}>
          <input type="checkbox" ${isActive ? "checked" : ""} ${page.required ? "disabled" : ""} data-page-id="${page.id}" style="cursor: ${page.required ? "not-allowed" : "pointer"}; width: 18px; height: 18px;">
          <span style="color: ${isActive ? "#34d399" : "var(--ic-mutedText, #858585)"}; font-size: 12px; font-weight: 600;">
            ${isActive ? "Actif" : "Inactif"}
          </span>
        </label>
      `;
      
      if (categoryContainer) {
        categoryContainer.appendChild(pageCard);
      }
    });
  });
  
  // Event listeners pour les checkboxes
  contentContainer.querySelectorAll('input[type="checkbox"][data-page-id]').forEach(checkbox => {
    checkbox.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const pageId = target.getAttribute("data-page-id");
      if (!pageId) return;
      
      const page = AVAILABLE_PAGES.find(p => p.id === pageId);
      if (page?.required) return; // Ne pas permettre la désactivation des pages obligatoires
      
      toggleOrgPage(orgId, pageId, target.checked);
      showToast(`✅ Page ${target.checked ? "activée" : "désactivée"} avec succès`, target.checked ? "success" : "info");
      
      // Recharger l'onglet après un court délai
      setTimeout(() => {
        const newOrg = getOrganizationById(orgId);
        if (newOrg) {
          createModelsTab(newOrg, contentContainer, orgId);
        }
      }, 300);
    });
  });
}

// Créer l'onglet Paramètres régionaux
function createRegionalTab(org: Organization, contentContainer: HTMLElement, orgId: string): void {
  contentContainer.innerHTML = `
    <div style="padding:14px;border:1px solid var(--ic-border, #3e3e3e);border-radius:8px;background:rgba(255,255,255,0.02);">
      <div style="font-weight:600;color:var(--ic-text, #d4d4d4);margin-bottom:12px;font-size:13px;">
        Paramètres régionaux
      </div>
      <div style="display:grid;gap:8px;">
        <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
          <span style="color:var(--ic-mutedText, #858585);">Région</span>
          <input id="orgRegionInput" type="text" value="${org.region}" style="padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--ic-border, #3e3e3e);border-radius:4px;color:var(--ic-text, #d4d4d4);font-size:14px;width:150px;text-align:right;">
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
          <span style="color:var(--ic-mutedText, #858585);font-size:13px;">Fuseau horaire</span>
          <input id="orgTimezoneInput" type="text" value="${org.timezone}" style="padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--ic-border, #3e3e3e);border-radius:4px;color:var(--ic-text, #d4d4d4);font-size:13px;width:140px;text-align:right;">
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
          <span style="color:var(--ic-mutedText, #858585);font-size:13px;">Langue</span>
          <input id="orgLanguageInput" type="text" value="${org.language}" style="padding:4px 8px;background:rgba(255,255,255,0.05);border:1px solid var(--ic-border, #3e3e3e);border-radius:4px;color:var(--ic-text, #d4d4d4);font-size:13px;width:140px;text-align:right;">
        </div>
      </div>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
      <button id="saveRegionalBtn" style="padding:10px 20px;background:var(--ic-accent, #7b2cff);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
        Enregistrer
      </button>
    </div>
  `;
  
  const saveBtn = contentContainer.querySelector("#saveRegionalBtn") as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.onclick = () => {
      const regionInput = contentContainer.querySelector("#orgRegionInput") as HTMLInputElement;
      const timezoneInput = contentContainer.querySelector("#orgTimezoneInput") as HTMLInputElement;
      const languageInput = contentContainer.querySelector("#orgLanguageInput") as HTMLInputElement;
      
      updateOrganization(orgId, {
        region: regionInput?.value || org.region,
        timezone: timezoneInput?.value || org.timezone,
        language: languageInput?.value || org.language
      });
      showToast("✅ Paramètres régionaux modifiés avec succès", "success");
      
      setTimeout(() => {
        const newOrg = getOrganizationById(orgId);
        if (newOrg) {
          createRegionalTab(newOrg, contentContainer, orgId);
        }
      }, 500);
    };
  }
}

// Créer l'onglet Abonnements
function createSubscriptionsTab(org: Organization, contentContainer: HTMLElement, orgId: string): void {
  contentContainer.innerHTML = "";
  
  const activeSubs = getActiveSubscriptions();
  const activeSubsByType = new Map(activeSubs.filter(s => s.status === "active").map(s => [s.subscriptionTypeId, s]));
  
  // Compte rendu de l'état du système
  const statusCard = document.createElement("div");
  statusCard.style.cssText = "padding: 16px; border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; background: rgba(255,255,255,0.02); margin-bottom: 20px;";
  
  const hasActiveSubs = activeSubsByType.size > 0;
  const modeColor = hasActiveSubs ? "#34d399" : "#f59e0b";
  const modeText = hasActiveSubs ? "Mode Premium" : "Mode Gratuit";
  const modeDesc = hasActiveSubs 
    ? "Cette organisation utilise des fonctionnalités premium activées." 
    : "Cette organisation fonctionne sur le système gratuit. Toutes les fonctionnalités de base sont disponibles.";
  
  statusCard.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: ${modeColor}20; display: flex; align-items: center; justify-content: center; font-size: 24px;">
        ${hasActiveSubs ? "⭐" : "✓"}
      </div>
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 700; color: var(--ic-text, #d4d4d4); margin-bottom: 4px;">
          ${modeText}
        </div>
        <div style="font-size: 13px; color: var(--ic-mutedText, #858585);">
          ${modeDesc}
        </div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-top: 16px; border-top: 1px solid var(--ic-border, #3e3e3e);">
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Abonnements actifs</div>
        <div style="font-size: 20px; font-weight: 700; color: ${modeColor};">${activeSubsByType.size}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">Disponibles</div>
        <div style="font-size: 20px; font-weight: 700; color: var(--ic-text, #d4d4d4);">${SUBSCRIPTION_TYPES.length}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: var(--ic-mutedText, #858585); margin-bottom: 4px;">État système</div>
        <div style="font-size: 18px; font-weight: 700; color: #4ec9b0;">Fonctionnel</div>
      </div>
    </div>
  `;
  contentContainer.appendChild(statusCard);
  
  // Liste des abonnements par catégorie
  const coreSubs = getSubscriptionsByCategory("core");
  const appSubs = getSubscriptionsByCategory("application");
  
  // Abonnements Cœur du Système
  const coreSection = document.createElement("div");
  coreSection.style.cssText = "margin-bottom: 24px;";
  coreSection.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #d4d4d4); margin-bottom: 12px;">
      Cœur du Système
    </div>
    <div id="core-subscriptions" style="display: grid; gap: 8px;"></div>
  `;
  contentContainer.appendChild(coreSection);
  
  const coreContainer = coreSection.querySelector("#core-subscriptions");
  coreSubs.forEach(sub => {
    const isActive = activeSubsByType.has(sub.id);
    const subscriptionCard = document.createElement("div");
    subscriptionCard.style.cssText = `
      padding: 14px;
      border: 1px solid ${isActive ? "#34d399" : "var(--ic-border, #3e3e3e)"};
      border-radius: 8px;
      background: ${isActive ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)"};
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    `;
    
    subscriptionCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <span style="font-size: 24px;">${sub.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--ic-text, #d4d4d4); font-size: 14px; margin-bottom: 4px;">
            ${sub.name}
          </div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #858585);">
            ${sub.description}
          </div>
        </div>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; background: ${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}; border-radius: 6px; transition: all 0.2s;" onmouseenter="this.style.background='${isActive ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}'" onmouseleave="this.style.background='${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}'">
        <input type="checkbox" ${isActive ? "checked" : ""} data-sub-id="${sub.id}" style="cursor: pointer; width: 18px; height: 18px;">
        <span style="color: ${isActive ? "#34d399" : "var(--ic-mutedText, #858585)"}; font-size: 12px; font-weight: 600;">
          ${isActive ? "Actif" : "Inactif"}
        </span>
      </label>
    `;
    
    if (coreContainer) {
      coreContainer.appendChild(subscriptionCard);
    }
  });
  
  // Abonnements Applications
  const appSection = document.createElement("div");
  appSection.style.cssText = "margin-bottom: 24px;";
  appSection.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #d4d4d4); margin-bottom: 12px;">
      Applications
    </div>
    <div id="app-subscriptions" style="display: grid; gap: 8px;"></div>
  `;
  contentContainer.appendChild(appSection);
  
  const appContainer = appSection.querySelector("#app-subscriptions");
  appSubs.forEach(sub => {
    const isActive = activeSubsByType.has(sub.id);
    const subscriptionCard = document.createElement("div");
    subscriptionCard.style.cssText = `
      padding: 14px;
      border: 1px solid ${isActive ? "#34d399" : "var(--ic-border, #3e3e3e)"};
      border-radius: 8px;
      background: ${isActive ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)"};
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    `;
    
    subscriptionCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <span style="font-size: 24px;">${sub.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--ic-text, #d4d4d4); font-size: 14px; margin-bottom: 4px;">
            ${sub.name}
          </div>
          <div style="font-size: 12px; color: var(--ic-mutedText, #858585);">
            ${sub.description}
          </div>
        </div>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; background: ${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}; border-radius: 6px; transition: all 0.2s;" onmouseenter="this.style.background='${isActive ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}'" onmouseleave="this.style.background='${isActive ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)"}'">
        <input type="checkbox" ${isActive ? "checked" : ""} data-sub-id="${sub.id}" style="cursor: pointer; width: 18px; height: 18px;">
        <span style="color: ${isActive ? "#34d399" : "var(--ic-mutedText, #858585)"}; font-size: 12px; font-weight: 600;">
          ${isActive ? "Actif" : "Inactif"}
        </span>
      </label>
    `;
    
    if (appContainer) {
      appContainer.appendChild(subscriptionCard);
    }
  });
  
  // Event listeners pour les checkboxes
  contentContainer.querySelectorAll('input[type="checkbox"][data-sub-id]').forEach(checkbox => {
    checkbox.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const subId = target.getAttribute("data-sub-id");
      if (!subId) return;
      
      const activeSub = activeSubsByType.get(subId);
      
      if (target.checked) {
        if (!activeSub) {
          activateSubscription(subId, "Organisation", undefined, { orgId });
          showToast(`✅ Abonnement activé avec succès`, "success");
        }
      } else {
        if (activeSub) {
          deactivateSubscription(activeSub.id);
          showToast(`✅ Abonnement désactivé`, "info");
        }
      }
      
      // Recharger l'onglet après un court délai
      setTimeout(() => {
        const newOrg = getOrganizationById(orgId);
        if (newOrg) {
          createSubscriptionsTab(newOrg, contentContainer, orgId);
        }
      }, 300);
    });
  });
}

// Rendre la vue détail d'une organisation avec sidebar d'onglets
function renderOrganizationDetail(root: HTMLElement, cardContent: HTMLElement, orgId: string): void {
  const org = getOrganizationById(orgId);
  
  // Masquer l'icône de notification
  const notifButton = document.querySelector(".icontrol-cp-right-section");
  if (notifButton) {
    (notifButton as HTMLElement).style.display = "none";
  }
  
  if (!org) {
    cardContent.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--ic-mutedText, #858585);">
        <div style="font-size:48px;margin-bottom:16px;">❌</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">Organisation non trouvée</div>
        <button id="backToList" style="margin-top:16px;padding:10px 20px;background:var(--ic-accent, #7b2cff);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          Retour à la liste
        </button>
      </div>
    `;
    const backBtn = cardContent.querySelector("#backToList");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        navigate("#/organization");
      });
    }
    return;
  }
  
  
  // Flèche retour sous le header (en haut à gauche)
  const backArrowContainer = document.createElement("div");
  backArrowContainer.style.cssText = `
    position: absolute;
    top: 56px;
    left: 16px;
    z-index: 100;
  `;
  
  const backArrow = document.createElement("button");
  backArrow.innerHTML = "←";
  backArrow.style.cssText = `
    width: 32px;
    height: 32px;
    padding: 0;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--ic-border, #3e3e3e);
    border-radius: 6px;
    color: var(--ic-text, #d4d4d4);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;
  backArrow.onmouseenter = () => {
    backArrow.style.background = "rgba(255,255,255,0.05)";
    backArrow.style.borderColor = "var(--ic-accent, #7b2cff)";
  };
  backArrow.onmouseleave = () => {
    backArrow.style.background = "rgba(255,255,255,0.02)";
    backArrow.style.borderColor = "var(--ic-border, #3e3e3e)";
  };
  backArrow.onclick = () => {
    navigate("#/organization");
  };
  backArrowContainer.appendChild(backArrow);
  document.body.appendChild(backArrowContainer);
  
  // Réinitialiser le header (l'indicateur système sera dans rightSection)
  const headerTitle = document.querySelector(".icontrol-cp-brand-title");
  if (headerTitle) {
    (headerTitle as HTMLElement).textContent = "Console";
  }
  
  // Fonction INDÉPENDANTE pour mettre à jour l'indicateur système ICON du header (spécifique à l'organisation)
  // Cette fonction est complètement séparée des autres indicateurs système
  const updateOrgSystemStatusIndicator = () => {
    const systemStatusIndicator = document.querySelector("#icontrol-system-status-indicator") as HTMLElement;
    if (!systemStatusIndicator) {
      // Réessayer après un court délai si l'indicateur n'existe pas encore
      setTimeout(updateOrgSystemStatusIndicator, 200);
      return;
    }
    
    const orgSystemStatus = getOrgSystemStatus(org);
    const orgStatusForMonitoring = orgSystemStatus.status === "ok" ? "healthy" : "warning";
    
    // Stocker les informations de l'organisation dans dataset pour que le système de monitoring les utilise
    // Utiliser un préfixe "org" pour éviter les conflits avec d'autres indicateurs
    systemStatusIndicator.dataset.orgDisplayName = org.name;
    systemStatusIndicator.dataset.orgStatus = orgSystemStatus.status;
    systemStatusIndicator.dataset.orgMessage = orgSystemStatus.message;
    systemStatusIndicator.dataset.orgIndicatorActive = "true"; // Flag pour identifier cet indicateur
    
    // Mettre à jour immédiatement l'indicateur avec le style original (point lumineux + texte)
    const statusConfig = orgSystemStatus.status === "ok" ? {
      bg: "rgba(78, 201, 176, 0.08)",
      color: "#4ec9b0",
      border: "rgba(78, 201, 176, 0.2)",
      hoverBg: "rgba(78, 201, 176, 0.15)"
    } : {
      bg: "rgba(245, 158, 11, 0.08)",
      color: "#f59e0b",
      border: "rgba(245, 158, 11, 0.2)",
      hoverBg: "rgba(245, 158, 11, 0.15)"
    };
    
    // S'assurer que l'indicateur est visible
    systemStatusIndicator.style.display = "";
    systemStatusIndicator.style.background = statusConfig.bg;
    systemStatusIndicator.style.color = statusConfig.color;
    systemStatusIndicator.style.border = `1px solid ${statusConfig.border}`;
    systemStatusIndicator.title = orgSystemStatus.message;
    systemStatusIndicator.innerHTML = `<span>${org.name}</span>`;
    systemStatusIndicator.classList.remove("status-healthy", "status-warning", "status-error");
    systemStatusIndicator.classList.add(`status-${orgStatusForMonitoring}`);
  };
  
  // Appeler immédiatement et après plusieurs délais pour s'assurer que l'indicateur est mis à jour
  updateOrgSystemStatusIndicator();
  setTimeout(updateOrgSystemStatusIndicator, 10);
  setTimeout(updateOrgSystemStatusIndicator, 100);
  setTimeout(updateOrgSystemStatusIndicator, 300);
  setTimeout(updateOrgSystemStatusIndicator, 600);
  
  // Conteneur principal avec sidebar
  const mainContainer = document.createElement("div");
  mainContainer.style.cssText = "display: flex; gap: 0; height: calc(100vh - 200px); min-height: 600px;";
  
  // Sidebar verticale avec onglets
  const sidebar = document.createElement("div");
  sidebar.style.cssText = `
    width: 220px;
    background: var(--ic-panel, #1a1d1f);
    border-right: 1px solid var(--ic-border, #2b3136);
    display: flex;
    flex-direction: column;
    padding: 12px 0;
    flex-shrink: 0;
  `;
  
  const activeTab = getActiveTabFromHash();
  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "general", label: "Informations générales" },
    { id: "users", label: "Utilisateurs" },
    { id: "regional", label: "Paramètres régionaux" },
    { id: "subscriptions", label: "Abonnements" },
    { id: "models", label: "Modèles" }
  ];
  
  tabs.forEach(tab => {
    const tabBtn = document.createElement("button");
    tabBtn.textContent = tab.label;
    const isActive = tab.id === activeTab;
    tabBtn.style.cssText = `
      padding: 12px 16px;
      background: ${isActive ? "rgba(59,130,246,0.15)" : "transparent"};
      border: none;
      border-left: 3px solid ${isActive ? "#3b82f6" : "transparent"};
      color: ${isActive ? "var(--ic-text, #e7ecef)" : "var(--ic-mutedText, #a7b0b7)"};
      font-size: 13px;
      font-weight: ${isActive ? "600" : "500"};
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    tabBtn.onmouseenter = () => {
      if (!isActive) {
        tabBtn.style.background = "rgba(255,255,255,0.05)";
      }
    };
    tabBtn.onmouseleave = () => {
      if (!isActive) {
        tabBtn.style.background = "transparent";
      }
    };
    
    tabBtn.onclick = () => {
      navigate(`#/organization?id=${orgId}&tab=${tab.id}`);
    };
    
    sidebar.appendChild(tabBtn);
  });
  
  mainContainer.appendChild(sidebar);
  
  // Contenu principal
  const contentContainer = document.createElement("div");
  contentContainer.style.cssText = `
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: var(--ic-card, #1a1d1f);
  `;
  
  // Afficher le contenu selon l'onglet actif
  switch (activeTab) {
    case "overview":
      createOverviewTab(org, contentContainer);
      break;
    case "general":
      createGeneralInfoTab(org, contentContainer, orgId);
      break;
    case "users":
      createUsersTab(org, contentContainer, orgId);
      break;
    case "regional":
      createRegionalTab(org, contentContainer, orgId);
      break;
    case "subscriptions":
      createSubscriptionsTab(org, contentContainer, orgId);
      break;
    case "models":
      createModelsTab(org, contentContainer, orgId);
      break;
    default:
      createOverviewTab(org, contentContainer);
  }
  
  mainContainer.appendChild(contentContainer);
  cardContent.appendChild(mainContainer);
}

export function renderOrganizationPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const orgId = getOrgIdFromHash();
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    orgId ? "Détail de l'organisation" : "Organisations",
    orgId ? "Modifier les informations et autorisations" : "Liste des organisations isolées"
  );
  
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();
  const role = getRole();
  const safeMode = getSafeMode();

  // Info admin
  const infoDiv = document.createElement("div");
  infoDiv.style.cssText = `
    padding: 14px;
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    display: grid;
    gap: 8px;
    margin-bottom: 20px;
  `;
  infoDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Application</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">Administration (CP)</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Administrateur actuel</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">${s.username} <span style="color:var(--ic-accent, var(--accent));">(${s.username === "Master" ? "Master" : s.role})</span></span>
    </div>
  `;
  cardContent.appendChild(infoDiv);

  // Rendre soit la liste soit le détail
  if (orgId) {
    renderOrganizationDetail(root, cardContent, orgId);
  } else {
    renderOrganizationList(root, cardContent);
  }
  
  // Écouter les changements de hash pour recharger la vue
  const handleHashChange = () => {
    const newOrgId = getOrgIdFromHash();
    cardContent.innerHTML = "";
    cardContent.appendChild(infoDiv);
    
    // Réinitialiser le header au cas où
    const headerTitle = document.querySelector(".icontrol-cp-brand-title");
    
    // Réinitialiser l'indicateur d'état système selon le contexte
    const systemStatusIndicator = document.querySelector("#icontrol-system-status-indicator") as HTMLElement;
    
    if (newOrgId) {
      // Mettre à jour le titre du panel
      const panelHeaderTitle = card.querySelector(".icontrol-panel-header > div");
      if (panelHeaderTitle) {
        panelHeaderTitle.textContent = "Détail de l'organisation";
      }
      const headerSubtitle = card.querySelector(".icontrol-panel-subtitle");
      if (headerSubtitle) {
        headerSubtitle.textContent = "Modifier les informations et autorisations";
      }
      renderOrganizationDetail(root, cardContent, newOrgId);
      
      // Réinitialiser le header (l'indicateur système sera dans rightSection)
      setTimeout(() => {
        const org = getOrganizationById(newOrgId);
        if (org && headerTitle) {
          (headerTitle as HTMLElement).textContent = "Console";
        }
        // L'indicateur système sera mis à jour par renderOrganizationDetail avec le nom de l'organisation
      }, 100);
    } else {
      // Mettre à jour le titre du panel
      const panelHeaderTitle = card.querySelector(".icontrol-panel-header > div");
      if (panelHeaderTitle) {
        panelHeaderTitle.textContent = "Organisations";
      }
      const headerSubtitle = card.querySelector(".icontrol-panel-subtitle");
      if (headerSubtitle) {
        headerSubtitle.textContent = "Liste des organisations isolées";
      }
      renderOrganizationList(root, cardContent);
      // renderOrganizationList réinitialisera l'indicateur système avec "iCONTROL"
    }
  };
  
  window.addEventListener("hashchange", handleHashChange);
}
