/**
 * ICONTROL_CP_SESSIONS_V1
 * Page de gestion des sessions actives
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { sessionManager, type ActiveSession } from "/src/core/session/sessionManager";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showConfirmDialog } from "/src/core/ui/confirmDialog";
import { notificationManager } from "/src/core/ui/notificationCenter";
import { logout } from "/src/localAuth";
import { navigate } from "/src/router";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

export function renderSessionsPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "Gestion des sessions",
    "Voir et gérer toutes les sessions actives"
  );
  
  const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
  if (headerTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "🔐";
    iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
    headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
  }
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();
  const role = getRole();

  // Info sur session actuelle
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
      <span style="color:var(--ic-mutedText, var(--muted));">Utilisateur actuel</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">${s.username}</span>
    </div>
  `;
  cardContent.appendChild(infoDiv);

  // Tableau des sessions
  const sessions = sessionManager.getAllSessions();
  const sessionsData = sessions.map(session => ({
    id: session.id,
    username: session.username,
    startTime: session.startTime,
    lastActivity: session.lastActivity,
    ipAddress: session.ipAddress || "N/A",
    userAgent: session.userAgent || "N/A",
    current: session.current,
    duration: formatDuration(new Date().getTime() - session.startTime.getTime())
  }));

  const columns: TableColumn<typeof sessionsData[0]>[] = [
    {
      key: "username",
      label: "Utilisateur",
      sortable: true,
      render: (value, row) => {
        const div = document.createElement("div");
        div.style.cssText = "display: flex; align-items: center; gap: 8px;";
        if (row.current) {
          const badge = document.createElement("span");
          badge.style.cssText = "padding: 2px 6px; background: rgba(78,201,176,0.15); color: #4ec9b0; border-radius: 3px; font-size: 10px; font-weight: 600;";
          badge.textContent = "ACTUELLE";
          div.appendChild(badge);
        }
        const span = document.createElement("span");
        span.textContent = String(value);
        div.appendChild(span);
        return div;
      }
    },
    {
      key: "startTime",
      label: "Début",
      sortable: true,
      render: (value) => {
        const date = value as Date;
        return formatDateTime(date);
      }
    },
    {
      key: "lastActivity",
      label: "Dernière activité",
      sortable: true,
      render: (value) => {
        const date = value as Date;
        return formatDateTime(date);
      }
    },
    {
      key: "duration",
      label: "Durée",
      sortable: false
    },
    {
      key: "ipAddress",
      label: "IP",
      sortable: true
    }
  ];

  const tableContainer = document.createElement("div");
  const table = createDataTable({
    columns,
    data: sessionsData,
    searchable: true,
    sortable: true,
    pagination: true,
    pageSize: 10,
    actions: (row) => {
      const actions = [];
      if (!row.current) {
        actions.push({
          label: "Déconnecter",
          onClick: () => {
            showConfirmDialog({
              title: "Déconnecter la session",
              message: `Voulez-vous déconnecter la session de ${row.username} ?`,
              confirmText: "Déconnecter",
              confirmColor: "danger",
              onConfirm: () => {
                if (sessionManager.terminateSession(row.id)) {
                  notificationManager.add({
                    type: "success",
                    title: "Session déconnectée",
                    message: `La session de ${row.username} a été déconnectée avec succès.`
                  });
                  // Recharger la page pour mettre à jour le tableau
                  setTimeout(() => location.reload(), 500);
                }
              }
            });
          },
          style: "danger" as const
        });
      }
      return actions;
    }
  });
  tableContainer.appendChild(table);
  cardContent.appendChild(tableContainer);

  // Actions en masse
  const bulkActions = document.createElement("div");
  bulkActions.style.cssText = "display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--ic-border, #2b3136);";
  
  const terminateOthersBtn = document.createElement("button");
  terminateOthersBtn.textContent = "Déconnecter toutes les autres sessions";
  terminateOthersBtn.style.cssText = `
    padding: 10px 20px;
    background: rgba(244,135,113,0.15);
    border: 1px solid #f48771;
    color: #f48771;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  terminateOthersBtn.onmouseenter = () => { terminateOthersBtn.style.background = "rgba(244,135,113,0.25)"; };
  terminateOthersBtn.onmouseleave = () => { terminateOthersBtn.style.background = "rgba(244,135,113,0.15)"; };
  terminateOthersBtn.onclick = () => {
    showConfirmDialog({
      title: "Déconnecter toutes les autres sessions",
      message: "Toutes vos autres sessions seront déconnectées. Vous resterez connecté sur cette session.",
      confirmText: "Déconnecter toutes",
      confirmColor: "warning",
      onConfirm: () => {
        const count = sessionManager.terminateAllOtherSessions(s.username);
        notificationManager.add({
          type: "success",
          title: "Sessions déconnectées",
          message: `${count} session(s) ont été déconnectée(s).`
        });
        setTimeout(() => location.reload(), 500);
      }
    });
  };
  bulkActions.appendChild(terminateOthersBtn);

  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Actualiser";
  refreshBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  refreshBtn.onmouseenter = () => { refreshBtn.style.background = "rgba(255,255,255,0.05)"; };
  refreshBtn.onmouseleave = () => { refreshBtn.style.background = "var(--ic-panel, #37373d)"; };
  refreshBtn.onclick = () => location.reload();
  bulkActions.appendChild(refreshBtn);

  cardContent.appendChild(bulkActions);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  if (minutes > 0) return `${minutes}min`;
  return `${seconds}s`;
}
