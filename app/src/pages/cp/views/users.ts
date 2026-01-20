/**
 * ICONTROL_CP_USERS_VIEW_V2
 * Vues d'utilisateurs pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */
import type { UsersModelCp } from "../models/users";
import { appendList, appendTable, sectionCard } from "/src/core/ui/uiBlocks";
import { getUserPermissions, setUserPermissions, canManagePermissions, type PageId } from "../../../core/permissions/userPermissions";
import { requireSession } from "../../../localAuth";
import { getRole } from "../../../runtime/rbac";
import { createDataTable, type TableColumn } from "../../../core/ui/dataTable";
import { showConfirmDialog } from "../../../core/ui/confirmDialog";
import { showToast } from "../../../core/ui/toast";
import { addTooltipToElement } from "../../../core/ui/tooltip";
import { createToolbar } from "../../../core/ui/toolbar";
import { createContextualEmptyState } from "../../../core/ui/emptyState";
import { createRoleBadge } from "../../../core/ui/badge";
import { getSafeMode } from "/src/core/runtime/safe";

// Type pour un utilisateur système
type SystemUser = {
  id: string;
  username: string;
  role: string;
  application: string;
  createdAt?: string;
};

const LS_KEY_SYSTEM_USERS = "icontrol_system_users_v1";

// Récupérer les utilisateurs système
function getSystemUsers(): SystemUser[] {
  try {
    const stored = localStorage.getItem(LS_KEY_SYSTEM_USERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  
  // Données par défaut
  const defaultUsers: SystemUser[] = [
    { id: "master-001", username: "Master", role: "MASTER", application: "Administration (CP)", createdAt: new Date().toISOString().split("T")[0] },
    { id: "dev-001", username: "Developpeur", role: "DEVELOPER", application: "Administration (CP)", createdAt: new Date().toISOString().split("T")[0] },
  ];
  
  saveSystemUsers(defaultUsers);
  return defaultUsers;
}

function saveSystemUsers(users: SystemUser[]): void {
  try {
    localStorage.setItem(LS_KEY_SYSTEM_USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des utilisateurs système:", e);
  }
}

function addSystemUser(user: Omit<SystemUser, "id" | "createdAt">): void {
  const users = getSystemUsers();
  const newId = `user-${Date.now()}`;
  const newUser: SystemUser = {
    ...user,
    id: newId,
    createdAt: new Date().toISOString().split("T")[0]
  };
  users.push(newUser);
  saveSystemUsers(users);
}

function deleteSystemUser(userId: string): void {
  const users = getSystemUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveSystemUsers(filtered);
}

function renderUsersOverviewCp(root: HTMLElement, model: UsersModelCp): void {
  const card = sectionCard(model.title);
  appendList(card, [
    "Gestion complète des utilisateurs du système.",
    "Roles et permissions pour l'administration.",
    "Menu access pour tous les modules d'administration."
  ]);
  root.appendChild(card);
}

export function renderUsersListCp(root: HTMLElement, model: UsersModelCp): void {
  const s = requireSession();
  const currentRole = getRole();
  const isMaster = s.username === "Master" || currentRole === "MASTER";
  const isDeveloper = s.username === "Developpeur" || currentRole === "DEVELOPER";
  const canManage = canManagePermissions(s.username, currentRole);
  const safeMode = getSafeMode();
  
  // Liste des utilisateurs du système (Administration seulement)
  // Récupérer depuis localStorage avec fallback sur les valeurs par défaut
  const allUsers = getSystemUsers();
  
  // Filtrer selon le rôle de l'utilisateur connecté
  // Master voit tous, Developer voit seulement les Developer (mais peut modifier)
  const visibleUsers = isMaster 
    ? allUsers 
    : isDeveloper 
      ? allUsers.filter(u => u.role === "DEVELOPER" || u.username === "Developpeur")
      : [];

  // Préparer les données pour le tableau
  const tableData = visibleUsers.map(user => {
    const permissions = getUserPermissions(user.username, user.role as any);
    const displayRole = user.username === "Master" ? "Master" : user.role;
    const canModifyThisUser = canManage && 
      (isMaster ? user.username !== "Master" : (isDeveloper && user.role === "DEVELOPER"));
    
    return {
      ...user,
      displayRole,
      pagesCount: permissions.pages.length,
      pagesList: permissions.pages.join(", ") || "Aucune",
      canModify: canModifyThisUser
    };
  });

  // Colonnes du tableau
  const columns: TableColumn<typeof tableData[0]>[] = [
    {
      key: "username",
      label: "Nom d'utilisateur",
      sortable: true,
      render: (value, row) => {
        const div = document.createElement("div");
  div.style.minWidth = "0";
  div.style.boxSizing = "border-box";
        div.style.cssText = "display: flex; align-items: center; gap: 8px;";
        const name = document.createElement("span");
        name.style.cssText = "font-weight: 600; color: var(--ic-text, #e7ecef);";
        name.textContent = String(value);
        div.appendChild(name);
        return div;
      }
    },
    {
      key: "displayRole",
      label: "Rôle",
      sortable: true,
      render: (value) => {
        return createRoleBadge(String(value));
      }
    },
    {
      key: "application",
      label: "Application",
      sortable: true
    },
    {
      key: "pagesList",
      label: "Pages accessibles",
      sortable: false,
      render: (value) => {
        const div = document.createElement("div");
        div.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis;";
        div.textContent = String(value);
        div.title = String(value);
        return div;
      }
    }
  ];

  let currentFilteredData = [...tableData];
  let currentRoleFilter = "";
  let currentSearchQuery = "";

  const { element: toolbar, searchInput } = createToolbar({
    searchPlaceholder: "Rechercher un utilisateur...",
    onSearch: (value) => {
      currentSearchQuery = value.toLowerCase().trim();
      applyFilters();
    },
    filters: [
      {
        label: "Rôle",
        options: [
          { label: "Tous", value: "" },
          { label: "MASTER", value: "MASTER" },
          { label: "ADMIN", value: "ADMIN" },
          { label: "SYSADMIN", value: "SYSADMIN" },
          { label: "DEVELOPER", value: "DEVELOPER" },
          { label: "USER", value: "USER" }
        ],
        onChange: (value) => {
          currentRoleFilter = value;
          applyFilters();
        }
      }
    ],
    actions: [
      {
        label: "+ Ajouter un utilisateur",
        primary: true,
        onClick: () => {
          showAddSystemUserModal(() => {
            location.reload();
          });
        }
      }
    ]
  });

  root.appendChild(toolbar);

  if (searchInput) {
    addTooltipToElement(searchInput, "Recherche par nom, rôle ou application", "top");
  }
  
  // Connecter le filtre par rôle
  const applyFilters = () => {
    currentFilteredData = tableData.filter((row) => {
      const roleMatch = !currentRoleFilter || row.role === currentRoleFilter;
      const searchMatch = !currentSearchQuery ||
        row.username.toLowerCase().includes(currentSearchQuery) ||
        row.role.toLowerCase().includes(currentSearchQuery) ||
        row.application.toLowerCase().includes(currentSearchQuery);
      return roleMatch && searchMatch;
    });
    renderTable();
  };
  
  // Fonction helper pour les actions
  function getActionsForRow(row: typeof tableData[0]) {
    const actions = [];
    // Bouton "Voir comme cet utilisateur" (Simulateur)
    if (row.username !== s.username) {
      actions.push({
        label: "👁️ Voir comme",
        onClick: () => {
          showToast({ status: "info", message: `Simulation du point de vue de ${row.username} (fonctionnalité à implémenter)` });
        },
        style: "primary" as const
      });
    }
    
    if (row.canModify) {
      actions.push({
        label: "Modifier",
        onClick: () => {
          (window as any).__editPermissions?.(row.username, row.role);
        },
        style: "primary" as const
      });
    }
    if (row.username !== "Master" && canManage && safeMode !== "STRICT") {
      actions.push({
        label: "Réinitialiser MDP",
        onClick: () => {
          showConfirmDialog({
            title: "Réinitialiser le mot de passe",
            message: `Voulez-vous réinitialiser le mot de passe de ${row.username} ?`,
            confirmText: "Réinitialiser",
            confirmColor: "warning",
            onConfirm: () => {
              showToast({ status: "info", message: `Le mot de passe de ${row.username} sera réinitialisé. (Fonctionnalité à implémenter)` });
            }
          });
        },
        style: "warning" as const
      });
      
      // Bouton Supprimer (sauf Master)
      if (row.username !== "Master" && row.role !== "MASTER") {
        actions.push({
          label: "Supprimer",
          onClick: () => {
            const user = allUsers.find(u => u.username === row.username);
            if (!user) return;
            
            showConfirmDialog({
              title: "Supprimer l'utilisateur",
              message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${row.username}" ? Cette action est irréversible.`,
              confirmText: "Supprimer",
              confirmColor: "danger",
              onConfirm: () => {
                deleteSystemUser(user.id);
                showToast({ status: "success", message: `Utilisateur "${row.username}" supprimé avec succès` });
                setTimeout(() => {
                  location.reload();
                }, 300);
              }
            });
          },
          style: "danger" as const
        });
      }
    }
    return actions;
  }
  
  // Créer le tableau avec DataTable
  const tableContainer = document.createElement("div");
  tableContainer.style.cssText = "margin-top: 0;";

  const renderTable = () => {
    tableContainer.innerHTML = "";
    const table = createDataTable({
      columns,
      data: currentFilteredData,
      searchable: false,
      sortable: true,
      pagination: true,
      pageSize: 10,
      onRowClick: (row) => {
        if (row.canModify) {
          (window as any).__editPermissions?.(row.username, row.role);
        }
      },
      actions: getActionsForRow
    });
    tableContainer.appendChild(table);

    if (currentFilteredData.length === 0) {
      const empty = createContextualEmptyState("users", {
        filter: currentRoleFilter || undefined,
        searchQuery: currentSearchQuery || undefined,
        onAdd: () => {
          showAddSystemUserModal(() => location.reload());
        },
        onClearFilter: () => {
          currentRoleFilter = "";
          currentSearchQuery = "";
          if (searchInput) searchInput.value = "";
          applyFilters();
        }
      });
      tableContainer.appendChild(empty);
    }
  };

  renderTable();
  root.appendChild(tableContainer);
  
  // Fonction pour éditer les permissions
  (window as any).__editPermissions = (username: string, role?: string) => {
    const user = visibleUsers.find(u => u.username === username);
    if (!user) return;
    
    const userRole = role || user.role;
    const permissions = getUserPermissions(username, userRole as any);
    const modal = document.createElement("div");
    modal.setAttribute("style", `
      position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:20px;
    `);
    
    const allPages: PageId[] = ["dashboard", "account", "users", "management", "settings", "toolbox", "dossiers"];
    
    // Construire le HTML du modal
    const modalContent = document.createElement("div");
    modalContent.setAttribute("style", "background:#1e1e1e; border:1px solid #3e3e3e; border-radius:12px; padding:24px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto;");
    
    const header = document.createElement("div");
    header.setAttribute("style", "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;");
    header.innerHTML = `
      <h3 style="font-size:18px; font-weight:700; color:#d4d4d4; margin:0;">Modifier les permissions de ${username}</h3>
      <button id="close-modal" style="background:transparent; border:none; color:#858585; font-size:24px; cursor:pointer; padding:0; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">×</button>
    `;
    
    const pagesSection = document.createElement("div");
    pagesSection.setAttribute("style", "margin-bottom:20px;");
    pagesSection.innerHTML = `
      <label style="display:block; color:#858585; font-size:13px; margin-bottom:8px;">Pages accessibles</label>
      <div style="display:grid; gap:8px;" id="pages-list"></div>
    `;
    
    const pagesList = pagesSection.querySelector("#pages-list");
    allPages.forEach(page => {
      const label = document.createElement("label");
      label.setAttribute("style", "display:flex; align-items:center; gap:8px; padding:8px; background:#252526; border-radius:6px; cursor:pointer;");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = permissions.pages.includes(page);
      checkbox.setAttribute("data-page", page);
      checkbox.style.cursor = "pointer";
      const span = document.createElement("span");
      span.setAttribute("style", "color:#d4d4d4; text-transform:capitalize;");
      span.textContent = page;
      label.appendChild(checkbox);
      label.appendChild(span);
      if (pagesList) pagesList.appendChild(label);
    });
    
    const actions = document.createElement("div");
    actions.setAttribute("style", "display:flex; gap:12px; justify-content:flex-end;");
    actions.innerHTML = `
      <button id="cancel-btn" style="padding:10px 20px; background:#3e3e3e; color:#d4d4d4; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Annuler</button>
      <button id="save-btn" style="padding:10px 20px; background:#37373d; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Enregistrer</button>
    `;
    
    modalContent.appendChild(header);
    modalContent.appendChild(pagesSection);
    modalContent.appendChild(actions);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Gestionnaires d'événements
    const closeModal = () => modal.remove();
    header.querySelector("#close-modal")?.addEventListener("click", closeModal);
    actions.querySelector("#cancel-btn")?.addEventListener("click", closeModal);
    
    actions.querySelector("#save-btn")?.addEventListener("click", () => {
      const checkboxes = modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-page]');
      const selectedPages: PageId[] = [];
      checkboxes.forEach(cb => {
        if (cb.checked) {
          selectedPages.push(cb.getAttribute("data-page") as PageId);
        }
      });
      
      const newPermissions = {
        pages: selectedPages,
        canManageUsers: false,
        canManagePermissions: false,
      };
      
      setUserPermissions(username, newPermissions);
      showToast({ status: "success", message: `Permissions de ${username} mises à jour avec succès!` });
      modal.remove();
      location.reload();
    });
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  };
}

function renderUsersRolesCp(root: HTMLElement, model: UsersModelCp): void {
  const card = sectionCard("Roles catalog - Administration");
  appendTable(
    card,
    ["Role"],
    model.roles.map((role) => ({ Role: role }))
  );
  root.appendChild(card);
}

function renderUsersPermissionsCp(root: HTMLElement, model: UsersModelCp): void {
  const card = sectionCard("Role permissions - Administration");
  appendTable(
    card,
    ["Module", "Role", "Permissions"],
    model.permissions.map((row) => ({
      Module: row.moduleId,
      Role: row.role,
      Permissions: row.permissions.join(", ")
    }))
  );
  root.appendChild(card);
}

function renderUsersMenuAccessCp(root: HTMLElement, model: UsersModelCp): void {
  const card = sectionCard("Menu access - Administration (roles)");
  appendTable(
    card,
    ["Menu", "Label", "Roles"],
    model.menuAccess.map((row) => ({
      Menu: row.menuId,
      Label: row.label,
      Roles: row.roles.join(", ")
    }))
  );
  root.appendChild(card);
}

// Modal pour ajouter un utilisateur système
function showAddSystemUserModal(onSuccess: () => void): void {
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
      Ajouter un utilisateur système
    </div>
    
    <div style="display: grid; gap: 16px; margin-bottom: 24px;">
      <div>
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Nom d'utilisateur *</label>
        <input id="newUsernameInput" type="text" placeholder="ex: admin" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
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
        <label style="display: block; color: var(--ic-mutedText, #858585); font-size: 13px; margin-bottom: 8px;">Application</label>
        <input id="newApplicationInput" type="text" value="Administration (CP)" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
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
  const roleSelect = modalContent.querySelector("#newRoleSelect") as HTMLSelectElement;
  const applicationInput = modalContent.querySelector("#newApplicationInput") as HTMLInputElement;
  
  const closeModal = () => modal.remove();
  
  cancelBtn.onclick = closeModal;
  
  confirmBtn.onclick = () => {
    const username = usernameInput?.value.trim();
    const role = roleSelect?.value;
    const application = applicationInput?.value.trim();
    
    if (!username || !role) {
      showToast({ status: "error", message: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUsers = getSystemUsers();
    if (existingUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      showToast({ status: "error", message: `Un utilisateur avec le nom "${username}" existe déjà` });
      return;
    }
    
    // Ne pas permettre de créer un utilisateur MASTER
    if (role === "MASTER") {
      showToast({ status: "error", message: "Vous ne pouvez pas créer un utilisateur avec le rôle MASTER" });
      return;
    }
    
    addSystemUser({
      username,
      role: role || "USER",
      application: application || "Administration (CP)"
    });
    
    showToast({ status: "success", message: `Utilisateur "${username}" ajouté avec succès` });
    closeModal();
    
    setTimeout(() => {
      onSuccess();
    }, 300);
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}
