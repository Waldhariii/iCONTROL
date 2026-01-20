/**
 * ICONTROL_CP_FEATURE_FLAGS_V1
 * Page de gestion des feature flags
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { featureFlags, type FeatureFlag } from "/src/core/features/featureFlags";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showConfirmDialog } from "/src/core/ui/confirmDialog";
import { notificationManager } from "/src/core/ui/notificationCenter";
import { createFormField } from "/src/core/ui/formField";

export function renderFeatureFlagsPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "🚩 Feature Flags - Gestion des Fonctionnalités",
    "Activez/désactivez des fonctionnalités et contrôlez leur déploiement progressif"
  );
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();

  // Actions
  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;";

  const addBtn = document.createElement("button");
  addBtn.textContent = "➕ Créer un feature flag";
  addBtn.style.cssText = `
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
  addBtn.onmouseenter = () => { addBtn.style.background = "rgba(255,255,255,0.05)"; };
  addBtn.onmouseleave = () => { addBtn.style.background = "var(--ic-panel, #37373d)"; };
  addBtn.onclick = () => {
    showCreateFeatureFlagModal();
  };
  actionsDiv.appendChild(addBtn);

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
  actionsDiv.appendChild(refreshBtn);

  cardContent.appendChild(actionsDiv);

  // Tableau des feature flags
  const flags = featureFlags.getAllFlags();
  const flagsData = flags.map(flag => ({
    id: flag.key,
    key: flag.key,
    enabled: flag.enabled,
    rollout: flag.rollout?.percentage || 100,
    users: flag.rollout?.users?.length || 0,
    description: flag.metadata?.description || ""
  }));

  const columns: TableColumn<typeof flagsData[0]>[] = [
    {
      key: "key",
      label: "Clé",
      sortable: true
    },
    {
      key: "enabled",
      label: "Statut",
      sortable: true,
      render: (value) => {
        return value 
          ? `<span style="color:#10b981;font-weight:600;">✓ Activé</span>`
          : `<span style="color:#6b7280;font-weight:600;">✗ Désactivé</span>`;
      }
    },
    {
      key: "rollout",
      label: "Rollout",
      sortable: true,
      render: (value) => {
        return `${value}%`;
      }
    },
    {
      key: "users",
      label: "Whitelist",
      sortable: true,
      render: (value) => {
        return value > 0 ? `${value} utilisateur(s)` : "Aucun";
      }
    },
    {
      key: "description",
      label: "Description",
      sortable: false
    }
  ];

  const tableContainer = document.createElement("div");
  const table = createDataTable({
    columns,
    data: flagsData,
    searchable: true,
    sortable: true,
    pagination: true,
    pageSize: 20,
    actions: (row) => {
      const flag = flags.find(f => f.key === row.key);
      const actions = [];
      
      if (flag) {
        actions.push({
          label: flag.enabled ? "Désactiver" : "Activer",
          onClick: () => {
            const newFlag = { ...flag, enabled: !flag.enabled };
            featureFlags.setFlag(newFlag);
            notificationManager.add({
              type: "success",
              title: "Feature flag mis à jour",
              message: `Le flag "${flag.key}" a été ${newFlag.enabled ? "activé" : "désactivé"}.`
            });
            location.reload();
          },
          style: flag.enabled ? "warning" as const : "primary" as const
        });
        actions.push({
          label: "Modifier",
          onClick: () => {
            showEditFeatureFlagModal(flag);
          },
          style: "primary" as const
        });
        actions.push({
          label: "Supprimer",
          onClick: () => {
            showConfirmDialog({
              title: "Supprimer le feature flag",
              message: `Voulez-vous supprimer le feature flag "${flag.key}" ?`,
              confirmText: "Supprimer",
              confirmColor: "danger",
              onConfirm: () => {
                featureFlags.deleteFlag(flag.key);
                notificationManager.add({
                  type: "success",
                  title: "Feature flag supprimé",
                  message: `Le flag "${flag.key}" a été supprimé.`
                });
                location.reload();
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
}

function showCreateFeatureFlagModal(editFlag?: FeatureFlag) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const isEdit = !!editFlag;
  const modalTitle = isEdit ? "Modifier un feature flag" : "Créer un feature flag";
  const buttonLabel = isEdit ? "Modifier" : "Créer";

  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:600px;width:100%;">
      <h3 style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:20px;">${modalTitle}</h3>
      
      <div style="margin-bottom:16px;">
        <label style="display:block;color:#858585;font-size:13px;margin-bottom:6px;font-weight:600;">Clé (key)</label>
        <input id="flagKey" type="text" placeholder="ex: new_feature" value="${editFlag?.key || ''}" ${isEdit ? 'readonly' : ''}
          style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #3e3e3e;background:#252526;color:#d4d4d4;font-size:14px;${isEdit ? 'opacity:0.6;' : ''}" />
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;color:#858585;font-size:13px;margin-bottom:6px;font-weight:600;">Description</label>
        <input id="flagDesc" type="text" placeholder="Description du feature flag" value="${editFlag?.metadata?.description || ''}"
          style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #3e3e3e;background:#252526;color:#d4d4d4;font-size:14px;" />
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input id="flagEnabled" type="checkbox" ${editFlag?.enabled ? 'checked' : ''} />
          <span style="color:#858585;font-size:13px;">Activé</span>
        </label>
      </div>

      <div style="margin-bottom:16px;">
        <label style="display:block;color:#858585;font-size:13px;margin-bottom:6px;font-weight:600;">Rollout (% utilisateurs)</label>
        <input id="flagRollout" type="number" min="0" max="100" value="${editFlag?.rollout?.percentage || 100}"
          style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #3e3e3e;background:#252526;color:#d4d4d4;font-size:14px;" />
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">
        <button id="cancelBtn" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">Annuler</button>
        <button id="createBtn" style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;">${buttonLabel}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const keyInput = modal.querySelector("#flagKey") as HTMLInputElement;
  const descInput = modal.querySelector("#flagDesc") as HTMLInputElement;
  const enabledInput = modal.querySelector("#flagEnabled") as HTMLInputElement;
  const rolloutInput = modal.querySelector("#flagRollout") as HTMLInputElement;
  const createBtn = modal.querySelector("#createBtn") as HTMLButtonElement;
  const cancelBtn = modal.querySelector("#cancelBtn") as HTMLButtonElement;

  createBtn.onclick = () => {
    const key = keyInput.value.trim();
    if (!key) {
      alert("La clé est obligatoire");
      return;
    }

    const flag: FeatureFlag = {
      key,
      enabled: enabledInput.checked,
      rollout: {
        percentage: parseInt(rolloutInput.value) || 100
      },
      metadata: {
        description: descInput.value.trim() || undefined
      }
    };

    featureFlags.setFlag(flag);
    notificationManager.add({
      type: "success",
      title: isEdit ? "Feature flag modifié" : "Feature flag créé",
      message: `Le flag "${key}" a été ${isEdit ? 'modifié' : 'créé'} avec succès.`
    });
    document.body.removeChild(modal);
    location.reload();
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

function showEditFeatureFlagModal(flag: FeatureFlag) {
  // Utiliser la même fonction avec les valeurs pré-remplies
  showCreateFeatureFlagModal(flag);
}
