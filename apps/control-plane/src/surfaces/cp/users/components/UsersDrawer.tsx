/**
 * UsersDrawer — Side panel to edit role permissions (RBAC). No network calls; calls onSaveRole only.
 */
import React from "react";
import styles from "../UsersPage.module.css";
import type { RbacRoles } from "../hooks/useUsersQueries";

export type RbacRoleRow = { role: string; permissions: string[] };

const ALL_PERMISSIONS = [
  "cp.access.settings",
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
];

export interface UsersDrawerProps {
  open: boolean;
  onClose: () => void;
  subject: RbacRoleRow | null;
  rbac: RbacRoles;
  onSaveRole: (nextRoles: Record<string, string[]>) => Promise<void>;
  saving?: boolean;
  error?: string | null;
}

export function UsersDrawer({
  open,
  onClose,
  subject,
  rbac,
  onSaveRole,
  saving = false,
  error = null,
}: UsersDrawerProps): React.ReactElement | null {
  const [localPerms, setLocalPerms] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (subject) {
      setLocalPerms([...subject.permissions]);
    }
  }, [subject?.role, subject?.permissions?.join(",")]);

  const handleSave = React.useCallback(() => {
    if (!subject) return;
    const next: RbacRoles = { ...rbac, [subject.role]: [...localPerms] };
    void onSaveRole(next);
  }, [subject, rbac, localPerms, onSaveRole]);

  const togglePerm = (perm: string) => {
    setLocalPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  if (!open) return null;

  return (
    <>
      <div
        className={styles.drawerBackdrop}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Fermer"
      />
      <div className={styles.drawer} role="dialog" aria-labelledby="drawer-title">
        <div className={styles.drawerHeader}>
          <h2 id="drawer-title" className={styles.drawerTitle}>
            {subject ? `Rôle: ${subject.role}` : "Permissions"}
          </h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className={styles.drawerBody}>
          {!subject && (
            <p className={styles.drawerHint}>Sélectionne un rôle dans le tableau.</p>
          )}
          {subject && (
            <>
              {error && (
                <div className={styles.errorBlock} role="alert">
                  {error}
                </div>
              )}
              <p className={styles.drawerHint}>
                Coche les permissions pour le rôle <strong>{subject.role}</strong>.
              </p>
              <div className={styles.permsList}>
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className={styles.permRow}>
                    <input
                      type="checkbox"
                      checked={localPerms.includes(perm)}
                      onChange={() => togglePerm(perm)}
                    />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        {subject && (
          <div className={styles.drawerActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Enregistrement…" : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
