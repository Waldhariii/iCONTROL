import React from "react";
import { useTenantsQuery } from "../queries";
import { useTenantsCommands } from "../commands";
import { canWriteTenants } from "@/runtime/rbac";
import { TenantDrawer } from "./TenantDrawer";

export function TenantsList() {
  const { data, isLoading, error, refresh } = useTenantsQuery();
  const { createTenant, updateTenant, deleteTenant } = useTenantsCommands();
  const [showModal, setShowModal] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ id: "", name: "", plan: "FREE" });
  const [message, setMessage] = React.useState<string | null>(null);
  const canWrite = canWriteTenants();

  const onCreate = async () => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setMessage(null);
    await createTenant({ ...form });
    setForm({ id: "", name: "", plan: "FREE" });
    await refresh();
    setMessage("✅ Tenant créé.");
    setShowModal(false);
  };

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>Erreur : {error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "var(--text-primary)" }}>Liste des Tenants</h2>
        {canWrite && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 20px",
              background: "var(--accent-primary)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            + Créer un tenant
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div style={{ 
          padding: "12px", 
          marginBottom: "16px", 
          background: message.includes("✅") ? "#10b981" : "#ef4444",
          color: "white",
          borderRadius: "6px"
        }}>
          {message}
        </div>
      )}

      {/* Table */}
      <div style={{ 
        background: "var(--surface-1)", 
        border: "1px solid var(--surface-border)", 
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-0)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Nom</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Plan</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Statut</th>
              <th style={{ padding: "12px", textAlign: "right", color: "var(--text-primary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  Aucun tenant trouvé
                </td>
              </tr>
            ) : (
              data.map((tenant: any) => (
                <tr key={tenant.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{tenant.id}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{tenant.name}</td>
                  <td style={{ padding: "12px", color: "var(--text-muted)" }}>{tenant.plan || "FREE"}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      background: "#10b981", 
                      color: "white", 
                      borderRadius: "4px",
                      fontSize: "11px"
                    }}>
                      ACTIF
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedTenant(tenant.id)}
                      style={{
                        padding: "6px 12px",
                        background: "var(--surface-0)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginRight: "8px"
                      }}
                    >
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Créer Tenant */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "var(--surface-1)",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "500px",
            border: "1px solid var(--surface-border)"
          }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Créer un nouveau tenant</h3>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)" }}>
                ID/Slug *
              </label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="acme-corp"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface-0)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)" }}>
                Nom *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corporation"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface-0)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)"
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: "var(--text-primary)" }}>
                Plan initial
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface-0)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)"
                }}
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "var(--surface-0)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={onCreate}
                disabled={!form.id || !form.name}
                style={{
                  padding: "10px 20px",
                  background: form.id && form.name ? "var(--accent-primary)" : "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: form.id && form.name ? "pointer" : "not-allowed",
                  fontWeight: "600"
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Profil Tenant */}
      {selectedTenant && (
        <TenantDrawer
          tenantId={selectedTenant}
          onClose={() => setSelectedTenant(null)}
        />
      )}
    </div>
  );
}
