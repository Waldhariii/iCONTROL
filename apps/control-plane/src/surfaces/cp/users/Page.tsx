/**
 * ICONTROL_CP_USERS_VIEW_V2
 * Vues d'utilisateurs pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */
import { error } from "../../../platform/observability/logger";
import { appendList, appendTable, sectionCard } from "@modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks";
import { getSession } from "../../../localAuth";
import { getRole } from "../../../runtime/rbac";
import { createDataTable, type TableColumn } from "../../../core/ui/dataTable";
import { createConfirmModal } from "../../../core/ui/confirmModal";
import { showToast } from "../../../core/ui/toast";
const addTooltipToElement = (_el: HTMLElement, _text: string, _position: string) => {
  // no-op placeholder; replace when tooltip util is introduced
};
import { createToolbar } from "../../../core/ui/toolbar";
import { createContextualEmptyState } from "../../../core/ui/emptyState";
import { createRoleBadge } from "../../../core/ui/badge";
import { getSafeMode } from "@modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { isEnabled } from "../../../policies/feature_flags.enforce";
import { createAuditHook } from "../../../core/write-gateway/auditHook";
import { createLegacyAdapter } from "../../../core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../../core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../../core/write-gateway/writeGateway";
import { getLogger } from "../../../platform/observability/logger";
import { getTenantId } from "../../../core/runtime/tenant";
import { Vfs, type VfsScope } from "../../../platform/storage/vfs";
import { guardCpSurface } from "../../../core/runtime/cpSurfaceGuard";
import { canManageUsers, getPermissionClaims } from "../../../runtime/rbac";
import { getApiBase } from "../../../core/runtime/apiBase";
import { LocalStorageProvider } from "../../../core/control-plane/storage";

type UsersModelCp = {
  title: string;
  roles: string[];
  permissions: Array<{ moduleId: string; role: string; permissions: string[] }>;
  menuAccess: Array<{ menuId: string; label: string; roles: string[] }>;
};

type PageId = "dashboard" | "account" | "users" | "management" | "settings" | "toolbox" | "dossiers";

type UserPermissions = {
  pages: PageId[];
  canManagePermissions: boolean;
};

const USER_PERMS_KEY = "icontrol_cp_user_permissions_v1";
const RBAC_PERMS_KEY = "icontrol_rbac_permissions_v1";
const storage = new LocalStorageProvider("");

const RBAC_ROLE_PRESETS: Record<string, string[]> = {
  USER: [],
  ADMIN: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.pages.create",
    "cp.pages.update",
  ],
  SYSADMIN: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.access.providers",
    "cp.access.policies",
    "cp.access.security",
    "cp.access.toolbox",
    "cp.pages.create",
    "cp.pages.update",
    "cp.pages.delete",
    "cp.pages.publish",
    "cp.pages.activate",
    "cp.pages.sync",
  ],
  DEVELOPER: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.access.providers",
    "cp.access.policies",
    "cp.access.security",
    "cp.access.toolbox",
    "cp.pages.create",
    "cp.pages.update",
  ],
};

const RBAC_GROUP_PREFIXES: Array<{ label: string; prefix: string }> = [
  { label: "Access", prefix: "cp.access" },
  { label: "Pages", prefix: "cp.pages" },
  { label: "Providers", prefix: "cp.providers" },
  { label: "Policies", prefix: "cp.policies" },
  { label: "Security", prefix: "cp.security" },
  { label: "Branding", prefix: "cp.branding" },
  { label: "Tenants", prefix: "cp.tenants" },
  { label: "Users", prefix: "cp.users" },
  { label: "Theme", prefix: "cp.theme" },
];

function validatePermissions(perms: string[]) {
  const seen = new Set<string>();
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const pattern = /^[a-z0-9_.:-]+$/;
  perms.forEach((p) => {
    if (!pattern.test(p)) invalid.push(p);
    if (seen.has(p)) duplicates.push(p);
    seen.add(p);
  });
  return { invalid, duplicates };
}

function groupPermissions(perms: string[]) {
  const groups: Record<string, string[]> = {};
  RBAC_GROUP_PREFIXES.forEach((g) => (groups[g.label] = []));
  const other: string[] = [];
  perms.forEach((p) => {
    const group = RBAC_GROUP_PREFIXES.find((g) => p.startsWith(g.prefix));
    if (group) {
      if (!groups[group.label]) groups[group.label] = [];
      groups[group.label]!.push(p);
    }
    else other.push(p);
  });
  if (other.length) groups["Other"] = other;
  return groups;
}

function previewAccess(perms: string[]) {
  const has = (perm: string) => perms.includes(perm);
  return [
    { label: "Settings", ok: has("cp.access.settings") },
    { label: "Branding", ok: has("cp.access.branding") },
    { label: "Theme Studio", ok: has("cp.access.theme_studio") },
    { label: "Tenants", ok: has("cp.access.tenants") },
    { label: "Providers", ok: has("cp.access.providers") },
    { label: "Policies", ok: has("cp.access.policies") },
    { label: "Security", ok: has("cp.access.security") },
    { label: "Toolbox", ok: has("cp.access.toolbox") },
    { label: "Pages: create", ok: has("cp.pages.create") },
    { label: "Pages: update", ok: has("cp.pages.update") },
    { label: "Pages: delete", ok: has("cp.pages.delete") },
    { label: "Pages: publish", ok: has("cp.pages.publish") },
    { label: "Pages: activate", ok: has("cp.pages.activate") },
    { label: "Pages: sync", ok: has("cp.pages.sync") },
  ];
}

function readRbacStore(): Record<string, string[]> {
  try {
    const raw = storage.getItem(RBAC_PERMS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.roles && typeof parsed.roles === "object") {
      return parsed.roles as Record<string, string[]>;
    }
  } catch {}
  return {};
}

function writeRbacStore(roles: Record<string, string[]>): void {
  try {
    storage.setItem(RBAC_PERMS_KEY, JSON.stringify({ roles }));
  } catch {}
}

async function fetchRbacFromServer(): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(`${getApiBase()}/api/cp/rbac`, {
      headers: {
        "Content-Type": "application/json",
        "x-user-role": String((getSession() as any)?.role || "USER").toUpperCase(),
        "x-user-id": String((getSession() as any)?.username || ""),
        "x-tenant-id": String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default"),
      },
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { success: boolean; data?: { roles?: Record<string, string[]> } };
    return json.success && json.data?.roles ? json.data.roles : {};
  } catch {
    return {};
  }
}

async function saveRbacToServer(roles: Record<string, string[]>): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/cp/rbac`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": String((getSession() as any)?.role || "USER").toUpperCase(),
        "x-user-id": String((getSession() as any)?.username || ""),
        "x-tenant-id": String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default"),
      },
      body: JSON.stringify({ roles }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function validateRbacPayload(payload: any): { roles: Record<string, string[]> } | null {
  if (!payload || typeof payload !== "object") return null;
  const roles = payload.roles;
  if (!roles || typeof roles !== "object") return null;
  const allowedRoles = ["USER", "ADMIN", "SYSADMIN", "DEVELOPER"];
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(roles)) {
    if (!allowedRoles.includes(key)) continue;
    const perms = roles[key];
    if (!Array.isArray(perms)) continue;
    out[key] = perms.map((p: any) => String(p).trim()).filter(Boolean);
  }
  return { roles: out };
}

function getUserPermissions(username: string, role: string): UserPermissions {
  try {
    const raw = storage.getItem(USER_PERMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, UserPermissions>;
      const stored = parsed?.[username];
      if (stored) return stored;
    }
  } catch {}
  const basePages: PageId[] = role === "MASTER" ? ["dashboard", "account", "users", "management", "settings", "toolbox", "dossiers"] : ["dashboard", "account"];
  return { pages: basePages, canManagePermissions: role === "MASTER" || role === "ADMIN" };
}

function setUserPermissions(username: string, perms: UserPermissions): void {
  try {
    const raw = storage.getItem(USER_PERMS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, UserPermissions>) : {};
    parsed[username] = perms;
    storage.setItem(USER_PERMS_KEY, JSON.stringify(parsed));
  } catch {}
}

function canManagePermissions(username: string, _role: string): boolean {
  void username;
  return canManageUsers();
}

function requireSession() {
  const s = getSession();
  if (!s) throw new Error("SESSION_REQUIRED");
  return s;
}

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
  const today = new Date().toISOString().split("T")[0] || new Date().toISOString();
  const defaultUsers: SystemUser[] = [
    { id: "master-001", username: "Master", role: "MASTER", application: "Administration (CP)", createdAt: today },
    { id: "dev-001", username: "Developpeur", role: "DEVELOPER", application: "Administration (CP)", createdAt: today },
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
    void error("ERR_CONSOLE_MIGRATED", "console migrated", {
      payload: { message: "Erreur lors de la sauvegarde des utilisateurs système", err: String(e) },
    });
  }
}

function addSystemUser(user: Omit<SystemUser, "id" | "createdAt">): void {
  const users = getSystemUsers();
  const newId = `user-${Date.now()}`;
  const newUser: SystemUser = {
    ...user,
    id: newId,
    createdAt: new Date().toISOString().split("T")[0] || new Date().toISOString()
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
  void model;
  const s = requireSession();
  const currentRole = getRole();
  const isMaster = s.username === "Master" || String(currentRole) === "MASTER" || currentRole === "SYSADMIN";
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
      render: (value) => {
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
          createConfirmModal({
            title: "Réinitialiser le mot de passe",
            message: `Voulez-vous réinitialiser le mot de passe de ${row.username} ?`,
            confirmLabel: "Réinitialiser",
            danger: false,
            onConfirm: () => {
              showToast({ status: "info", message: `Le mot de passe de ${row.username} sera réinitialisé. (Fonctionnalité à implémenter)` });
            },
            onCancel: () => {},
          }).show();
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
            
            createConfirmModal({
              title: "Supprimer l'utilisateur",
              message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${row.username}" ? Cette action est irréversible.`,
              confirmLabel: "Supprimer",
              danger: true,
              onConfirm: () => {
                deleteSystemUser(user.id);
                showToast({ status: "success", message: `Utilisateur "${row.username}" supprimé avec succès` });
                setTimeout(() => {
                  location.reload();
                }, 300);
              },
              onCancel: () => {},
            }).show();
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
        filter: currentRoleFilter || "",
        searchQuery: currentSearchQuery || "",
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

  if (!canManage) {
    return;
  }

  // RBAC Editor (local store)
  const rbacCard = sectionCard("RBAC Editor — Permissions par rôle");
  const rbacWrap = document.createElement("div");
  rbacWrap.className = "ic-admin-rbac";

  const row = document.createElement("div");
  row.className = "ic-admin-rbac__row";

  const roleLabel = document.createElement("label");
  roleLabel.className = "ic-admin-mini-label";
  roleLabel.textContent = "Rôle";
  const roleSelect = document.createElement("select");
  roleSelect.className = "ic-admin-input";
  ["USER", "ADMIN", "SYSADMIN", "DEVELOPER"].forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    roleSelect.appendChild(opt);
  });
  roleLabel.appendChild(roleSelect);

  const permsLabel = document.createElement("label");
  permsLabel.className = "ic-admin-mini-label";
  permsLabel.textContent = "Permissions (une par ligne)";
  const permsArea = document.createElement("textarea");
  permsArea.className = "ic-admin-textarea";
  permsArea.rows = 6;
  permsLabel.appendChild(permsArea);

  row.appendChild(roleLabel);
  row.appendChild(permsLabel);
  rbacWrap.appendChild(row);

  const actions = document.createElement("div");
  actions.className = "ic-admin-rbac__actions";
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn-primary";
  saveBtn.textContent = "Enregistrer";
  const resetBtn = document.createElement("button");
  resetBtn.className = "ic-admin-btn";
  resetBtn.textContent = "Reset rôle";
  const currentBtn = document.createElement("button");
  currentBtn.className = "ic-admin-btn";
  currentBtn.textContent = "Charger mes permissions";
  const exportBtn = document.createElement("button");
  exportBtn.className = "ic-admin-btn";
  exportBtn.textContent = "Exporter JSON";
  const importBtn = document.createElement("button");
  importBtn.className = "ic-admin-btn";
  importBtn.textContent = "Importer JSON";
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json";
  importInput.style.display = "none";
  actions.appendChild(saveBtn);
  actions.appendChild(resetBtn);
  actions.appendChild(currentBtn);
  actions.appendChild(exportBtn);
  actions.appendChild(importBtn);
  actions.appendChild(importInput);
  rbacWrap.appendChild(actions);

  const tags = document.createElement("div");
  tags.className = "ic-admin-rbac__list";
  rbacWrap.appendChild(tags);

  const statusLine = document.createElement("div");
  statusLine.className = "ic-admin-rbac__status";
  rbacWrap.appendChild(statusLine);

  const groupsWrap = document.createElement("div");
  groupsWrap.className = "ic-admin-rbac__groups";
  rbacWrap.appendChild(groupsWrap);

  const previewWrap = document.createElement("div");
  previewWrap.className = "ic-admin-rbac__preview";
  rbacWrap.appendChild(previewWrap);

  const renderTags = (perms: string[]) => {
    tags.innerHTML = "";
    perms.forEach((p) => {
      const chip = document.createElement("span");
      chip.className = "ic-admin-rbac__tag";
      chip.textContent = p;
      tags.appendChild(chip);
    });
  };

  const renderMeta = (perms: string[]) => {
    const { invalid, duplicates } = validatePermissions(perms);
    if (invalid.length || duplicates.length) {
      statusLine.textContent = `⚠️ ${invalid.length ? `Invalid: ${invalid.join(", ")}` : ""}${invalid.length && duplicates.length ? " | " : ""}${duplicates.length ? `Duplicates: ${duplicates.join(", ")}` : ""}`;
    } else {
      statusLine.textContent = "Schema OK";
    }

    groupsWrap.innerHTML = "";
    const grouped = groupPermissions(perms);
    Object.entries(grouped).forEach(([group, items]) => {
      const chip = document.createElement("span");
      chip.className = "ic-admin-rbac__group";
      chip.textContent = `${group}: ${items.length}`;
      groupsWrap.appendChild(chip);
    });

    previewWrap.innerHTML = "";
    const title = document.createElement("div");
    title.className = "ic-admin-rbac__preview-title";
    title.textContent = "Preview accès";
    previewWrap.appendChild(title);
    const list = document.createElement("div");
    list.className = "ic-admin-rbac__preview-grid";
    previewAccess(perms).forEach((item) => {
      const badge = document.createElement("span");
      badge.className = item.ok ? "ic-admin-badge ic-admin-badge--ok" : "ic-admin-badge ic-admin-badge--muted";
      badge.textContent = item.label;
      list.appendChild(badge);
    });
    previewWrap.appendChild(list);
  };

  const loadRole = (role: string) => {
    const store = readRbacStore();
    const perms = store[role] || RBAC_ROLE_PRESETS[role] || [];
    permsArea.value = perms.join("\n");
    renderTags(perms);
    renderMeta(perms);
  };

  roleSelect.value = "SYSADMIN";
  loadRole(roleSelect.value);

  void fetchRbacFromServer().then((serverRoles) => {
    if (Object.keys(serverRoles).length) {
      writeRbacStore(serverRoles);
      loadRole(roleSelect.value);
    }
  });

  roleSelect.onchange = () => loadRole(roleSelect.value);

  saveBtn.onclick = () => {
    const role = roleSelect.value;
    const perms = permsArea.value
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const store = readRbacStore();
    store[role] = perms;
    writeRbacStore(store);
    renderTags(perms);
    renderMeta(perms);
    void saveRbacToServer(store).then((ok) => {
      showToast({ status: ok ? "success" : "warning", message: ok ? `RBAC ${role} mis à jour` : "RBAC sauvegardé localement seulement" });
    });
  };

  resetBtn.onclick = () => {
    const role = roleSelect.value;
    const store = readRbacStore();
    store[role] = RBAC_ROLE_PRESETS[role] || [];
    writeRbacStore(store);
    loadRole(role);
    void saveRbacToServer(store).then(() => {
      showToast({ status: "info", message: `RBAC ${role} réinitialisé` });
    });
  };

  currentBtn.onclick = () => {
    const perms = getPermissionClaims();
    permsArea.value = perms.join("\n");
    renderTags(perms);
    renderMeta(perms);
  };

  exportBtn.onclick = () => {
    const store = readRbacStore();
    const payload = { roles: { ...RBAC_ROLE_PRESETS, ...store } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rbac-permissions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  importBtn.onclick = () => importInput.click();
  importInput.onchange = async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      showToast({ status: "error", message: "JSON invalide" });
      return;
    }
    const valid = validateRbacPayload(parsed);
    if (!valid) {
      showToast({ status: "error", message: "Structure RBAC invalide" });
      return;
    }
    writeRbacStore(valid.roles);
    loadRole(roleSelect.value);
    const ok = await saveRbacToServer(valid.roles);
    showToast({ status: ok ? "success" : "warning", message: ok ? "RBAC importé" : "RBAC importé localement seulement" });
  };

  rbacCard.appendChild(rbacWrap);
  root.appendChild(rbacCard);
  
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
