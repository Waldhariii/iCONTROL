/**
 * ICONTROL_CP_USERS_VIEW — Users / RBAC (React, hook-driven, no innerHTML, no direct fetch)
 */
import React, { useMemo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useUsersQueries } from "./hooks/useUsersQueries";
import { useUsersCommands } from "./hooks/useUsersCommands";
import { UsersTable, type TableRow } from "./components/UsersTable";
import { UsersDrawer } from "./components/UsersDrawer";
import type { RbacRoles } from "./hooks/useUsersQueries";
import styles from "./UsersPage.module.css";

export function renderUsersCp(root: HTMLElement): void {
  const container = document.createElement("div");
  container.className = styles.page;
  while (root.firstChild) root.removeChild(root.firstChild);
  root.appendChild(container);
  const client = createRoot(container);
  client.render(React.createElement(UsersPage));
}

function UsersPage(): React.ReactElement {
  const { rbac, loading, error, refreshRbac } = useUsersQueries();
  const { saveRbac } = useUsersCommands();

  const [filterText, setFilterText] = useState("");
  const [selected, setSelected] = useState<TableRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const rows: TableRow[] = useMemo(
    () =>
      Object.entries(rbac).map(([role, permissions]) => ({
        role,
        permissions: Array.isArray(permissions) ? permissions : [],
      })),
    [rbac]
  );

  const handleSelect = useCallback((row: TableRow) => {
    setSelected(row);
    setDrawerOpen(true);
    setSaveError(null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSaveError(null);
  }, []);

  const handleSaveRole = useCallback(
    async (nextRoles: RbacRoles) => {
      setSaving(true);
      setSaveError(null);
      try {
        const ok = await saveRbac(nextRoles);
        if (ok) {
          await refreshRbac();
          setDrawerOpen(false);
          setSelected(null);
        } else {
          setSaveError("Échec de l’enregistrement.");
        }
      } catch (e) {
        setSaveError(String(e));
      } finally {
        setSaving(false);
      }
    },
    [saveRbac, refreshRbac]
  );

  const roleCount = rows.length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Users</h1>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => refreshRbac()}
  disabled={loading || saving}
        >
          Actualiser
        </button>
      </header>

      <div className={styles.banner}>
        MODE RBAC — Permissions par rôle (utilisateurs non exposés par l’API).
      </div>

      {rows.length > 0 && (
        <div className={styles.kpi}>
          <span>Rôles: {rows.length}</span>
        </div>
      )}

      <UsersTable
        rows={rows}
        selectedId={selected?.role}
        onSelect={handleSelect}
        filterText={filterText}
        onFilterTextChange={setFilterText}
        loading={loading}
        error={error}
      />

      <UsersDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        subject={selected}
        rbac={rbac}
        onSaveRole={handleSaveRole}
        saving={saving}
        error={saveError}
      />
    </div>
  );
}
