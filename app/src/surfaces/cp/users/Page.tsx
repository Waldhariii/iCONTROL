/**
 * ICONTROL_CP_USERS_VIEW_V2
 * Vues d'utilisateurs pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */
import type { UsersModelCp } from "../models/users";
import { debug, info, warn, error } from "../../../platform/observability/logger";
import { appendList, appendTable, sectionCard } from "../../../../../../modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks";
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
import { getSafeMode } from "../../../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { isEnabled } from "../../../policies/feature_flags.enforce";
import { createAuditHook } from "../../../core/write-gateway/auditHook";
import { createLegacyAdapter } from "../../../core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../../core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../../core/write-gateway/writeGateway";
import { getLogger } from "../../../platform/observability/logger";
import { getTenantId } from "../../../core/runtime/tenant";
import { Vfs, type VfsScope } from "../../../platform/storage/vfs";
import { guardCpSurface } from "../../../core/runtime/cpSurfaceGuard";


/** WRITE_GATEWAY_WRITE_SURFACE — shadow scaffold (legacy-first; NO-OP adapter). */
const __wsLogger = getLogger("WRITE_GATEWAY_WRITE_SURFACE");
let __wsGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveWsGateway() {
  // Move14: centralized CP surface guard (tenant matrix first)
  const tenantId = (globalThis as any).__ICONTROL_RUNTIME__?.tenantId ?? null;
  const actorId  = (globalThis as any).__ICONTROL_RUNTIME__?.actorId ?? null;
  const gd = guardCpSurface({ tenantId, actorId, surfaceKey: "cp.users" });
  if (!gd.allow) {
    // keep render safe; actual redirect handled by governed redirect strategy
    return null as any;
  }


  if (__wsGateway) return __wsGateway;
  __wsGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "writeSurfaceShadowNoop"),
    safeMode: { enabled: true },
  });
  return __wsGateway;
}

function __isWsShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "users_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["users_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

// Type pour un utilisateur système
type SystemUser = {
  id: string;
  username: string;
  role: string;
  application: string;
  createdAt?: string;
};

const LS_KEY_SYSTEM_USERS = "icontrol_system_users_v1";

function getUsersScope(): VfsScope {
  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  return { tenantId, namespace: "cp.users" };
}

// Récupérer les utilisateurs système
function getSystemUsers(): SystemUser[] {
  try {
    const stored = Vfs.get(getUsersScope(), LS_KEY_SYSTEM_USERS);
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
    Vfs.set(getUsersScope(), LS_KEY_SYSTEM_USERS, JSON.stringify(users));
  
    // Shadow path (report-only): emit write intent via gateway (NO-OP adapter; legacy already wrote).
    if (__isWsShadowEnabled()) {
      const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
      const correlationId = createCorrelationId("ws");
      const cmd = {
        kind: "USERS_WRITE_SHADOW",
        tenantId,
        correlationId,
        payload: { key: String(LS_KEY_SYSTEM_USERS) },
        meta: { shadow: true, source: "ssot" },
      };

      try {
        const res = __resolveWsGateway().execute(cmd as any);
        if (res.status !== "OK" && res.status !== "SKIPPED") {
          __wsLogger.warn("WRITE_GATEWAY_WRITE_SURFACE_FALLBACK", {
            kind: cmd.kind,
            tenant_id: tenantId,
            correlation_id: correlationId,
            status: res.status,
          });
        }
      } catch (err) {
        __wsLogger.warn("WRITE_GATEWAY_WRITE_SURFACE_ERROR", {
          kind: cmd.kind,
          tenant_id: tenantId,
          correlation_id: correlationId,
          error: String(err),
        });
      }
    }

  } catch (e) {
    void error("ERR_CONSOLE_MIGRATED","console migrated", { payload: ("Erreur lors de la sauvegarde des utilisateurs système:", e) });
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

export function renderUsersOverviewCp(root: HTMLElement, model: UsersModelCp): void {
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
  // Récupérer depuis VFS avec fallback sur les valeurs par défaut
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
        div.classList.add("ic-cp-743b0c6402");
        const name = document.createElement("span");
        name.classList.add("ic-cp-be4987cde3");
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
        div.classList.add("ic-cp-8f412f8e5b");
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
  tableContainer.classList.add("ic-cp-c312289912");

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
    modal.classList.add("ic-cp-90e5d31543");
const allPages: PageId[] = ["dashboard", "account", "users", "management", "settings", "toolbox", "dossiers"];
    
    // Construire le HTML du modal
    const modalContent = document.createElement("div");
    modalContent.classList.add("ic-cp-users-modalContent");
    
    const header = document.createElement("div");
    header.classList.add("ic-cp-users-modalHeader");
    header.innerHTML = `
      <h3 class="ic-cp-412ed9be4c">Modifier les permissions de ${username}</h3>
      <button id="close-modal" class="ic-cp-8280351f95">×</button>
    `;
    
    const pagesSection = document.createElement("div");
    pagesSection.classList.add("ic-cp-users-pagesSection");
    pagesSection.innerHTML = `
      <label class="ic-cp-0f2473504d">Pages accessibles</label>
      <div class="ic-cp-76dd8f5d14" id="pages-list"></div>
    `;
    
    const pagesList = pagesSection.querySelector("#pages-list");
    allPages.forEach(page => {
      const label = document.createElement("label");
      label.classList.add("ic-cp-users-pageLabel");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = permissions.pages.includes(page);
      checkbox.setAttribute("data-page", page);
      checkbox.style.cursor = "pointer";
      const span = document.createElement("span");
      span.classList.add("ic-cp-users-pageLabelText");
      span.textContent = page;
      label.appendChild(checkbox);
      label.appendChild(span);
      if (pagesList) pagesList.appendChild(label);
    });
    
    const actions = document.createElement("div");
    actions.classList.add("ic-cp-users-modalActions");
    actions.innerHTML = `
      <button id="cancel-btn" class="ic-cp-4ff5b34435">Annuler</button>
      <button id="save-btn" class="ic-cp-c42a579e18">Enregistrer</button>
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

export function renderUsersRolesCp(root: HTMLElement, model: UsersModelCp): void {
  const card = sectionCard("Roles catalog - Administration");
  appendTable(
    card,
    ["Role"],
    model.roles.map((role) => ({ Role: role }))
  );
  root.appendChild(card);
}

export function renderUsersPermissionsCp(root: HTMLElement, model: UsersModelCp): void {
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

export function renderUsersMenuAccessCp(root: HTMLElement, model: UsersModelCp): void {
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
  modal.classList.add("ic-cp-4e0cd0b8fc");
const modalContent = document.createElement("div");
  modalContent.classList.add("ic-cp-1207b45b93");
modalContent.innerHTML = `
    <div class="ic-cp-47069ae5b8">
      Ajouter un utilisateur système
    </div>
    
    <div class="ic-cp-ea4e050ce0">
      <div>
        <label class="ic-cp-77477863ab">Nom d'utilisateur *</label>
        <input id="newUsernameInput" type="text" placeholder="ex: admin" class="ic-cp-4d7c3942b8">
      </div>
      
      <div>
        <label class="ic-cp-77477863ab">Rôle *</label>
        <select id="newRoleSelect" class="ic-cp-4d7c3942b8">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SYSADMIN">SYSADMIN</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>
      </div>
      
      <div>
        <label class="ic-cp-77477863ab">Application</label>
        <input id="newApplicationInput" type="text" value="Administration (CP)" class="ic-cp-4d7c3942b8">
      </div>
    </div>
    
    <div class="ic-cp-d051cf88e8">
      <button id="cancelAddBtn" class="ic-cp-53cdf7ee17">
        Annuler
      </button>
      <button id="confirmAddBtn" class="ic-cp-9d25861807">
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
