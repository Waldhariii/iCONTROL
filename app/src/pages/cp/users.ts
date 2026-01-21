/**
 * ICONTROL_CP_USERS_V4
 * Control Plane users governance view (visual-only, governed actions).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { getRole } from "/src/runtime/rbac";
import { canAccess } from "../../../../modules/core-system/ui/frontend-ts/pages/users/contract";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { createBadge } from "/src/core/ui/badge";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createKpiStrip } from "/src/core/ui/kpi";
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { isCpDemoEnabled } from "./_shared/cpDemo";

type CpUser = {
  username: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  lastLogin: string;
  permissions: string[];
};

const DEMO_USERS: CpUser[] = [
  { username: "admin.core", role: "SYSADMIN", status: "ACTIVE", lastLogin: "2024-10-18 08:15", permissions: ["govern:all", "audit:read", "release:govern"] },
  { username: "ops.lead", role: "ADMIN", status: "ACTIVE", lastLogin: "2024-10-18 07:42", permissions: ["system:read", "tenants:govern", "flags:govern"] },
  { username: "security", role: "ADMIN", status: "ACTIVE", lastLogin: "2024-10-17 22:10", permissions: ["audit:read", "rbac:govern"] },
  { username: "support", role: "USER", status: "INVITED", lastLogin: "—", permissions: ["audit:read"] },
  { username: "reviewer", role: "USER", status: "SUSPENDED", lastLogin: "2024-10-15 12:02", permissions: ["audit:read"] }
];

export function renderUsers(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  const role = getRole();
  const allowed = canAccess(role, safeModeValue);

  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Utilisateurs & Rôles",
    subtitle: "Gouvernance des accès et permissions (lecture seule)",
    safeMode: safeModeValue,
    statusBadge: { label: allowed ? "GOUVERNÉ" : "ENTITLEMENT REQUIS", tone: allowed ? "info" : "warn" }
  });

  const data = isCpDemoEnabled() ? DEMO_USERS : DEMO_USERS;

  const kpis = createKpiStrip([
    { label: "Utilisateurs", value: String(data.length), tone: "info" },
    { label: "Admins", value: String(data.filter((u) => u.role !== "USER").length), tone: "ok" },
    { label: "Suspendus", value: String(data.filter((u) => u.status === "SUSPENDED").length), tone: "err" },
    { label: "Invités", value: String(data.filter((u) => u.status === "INVITED").length), tone: "warn" }
  ]);
  content.appendChild(kpis);

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  const { card: tableCard, body: tableBody } = createSectionCard({
    title: "Liste des utilisateurs",
    description: "Rôles et statuts (gouvernés)"
  });

  let selected: CpUser | null = data[0] || null;

  const renderDetail = (user: CpUser | null) => {
    const { card, body } = createSectionCard({
      title: "Gérer rôles",
      description: "Panneau de gouvernance (lecture seule)"
    });

    if (!user) {
      body.appendChild(createEmptyStateCard({
        title: "Aucun utilisateur sélectionné",
        message: "Sélectionnez un utilisateur pour afficher le détail."
      }));
      return card;
    }

    body.appendChild(createRow("Utilisateur", user.username));
    body.appendChild(createRow("Rôle", user.role));
    body.appendChild(createRow("Statut", user.status));
    body.appendChild(createRow("Dernière connexion", user.lastLogin));

    const perms = document.createElement("div");
    perms.style.cssText = "display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;";
    user.permissions.forEach((p) => perms.appendChild(createBadge(p, "neutral")));
    body.appendChild(perms);

    const hint = document.createElement("div");
    hint.textContent = "Actions gouvernées disponibles via le Core.";
    hint.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); margin-top: 8px;";
    body.appendChild(hint);

    return card;
  };

  if (!allowed) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Entitlement requis",
      message: "Accès gouverné requis pour consulter la liste complète."
    }));
  } else if (data.length === 0) {
    tableBody.appendChild(createEmptyStateCard({
      title: "Aucun utilisateur",
      message: "Aucun utilisateur administrateur actif.",
      action: { label: "Demander un accès", onClick: () => {} }
    }));
  } else {
    const columns: TableColumn<CpUser>[] = [
      { key: "username", label: "Utilisateur", sortable: true },
      { key: "role", label: "Rôle", sortable: true, render: (value) => createBadge(String(value), "info") },
      { key: "status", label: "Statut", sortable: true, render: (value) => createBadge(String(value), value === "ACTIVE" ? "ok" : value === "SUSPENDED" ? "err" : "warn") },
      { key: "lastLogin", label: "Dernière connexion", sortable: true }
    ];
    const table = createDataTable({
      columns,
      data,
      pagination: true,
      pageSize: 8,
      onRowClick: (row) => {
        selected = row;
        grid.replaceChild(renderDetail(row), grid.children[1]);
      }
    });
    tableBody.appendChild(table);
  }

  grid.appendChild(tableCard);
  grid.appendChild(renderDetail(selected));

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
