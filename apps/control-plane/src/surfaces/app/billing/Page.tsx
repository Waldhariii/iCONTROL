import React from "react";
import { BillingService } from "@modules/core-billing";

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    billing: "Gratuit pour toujours",
    features: [
      "1 utilisateur",
      "1 GB de stockage",
      "Fonctionnalités de base",
      "Support communautaire",
    ],
    color: "#6b7280",
  },
  {
    id: "PRO",
    name: "Pro",
    price: 29,
    billing: "par mois",
    features: [
      "5 utilisateurs",
      "50 GB de stockage",
      "Toutes les fonctionnalités",
      "Support prioritaire",
      "Rapports avancés",
      "Intégrations API",
    ],
    color: "#3b82f6",
    popular: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 99,
    billing: "par mois",
    features: [
      "Utilisateurs illimités",
      "500 GB de stockage",
      "Toutes les fonctionnalités Pro",
      "Support dédié 24/7",
      "SLA 99.9%",
      "SSO & audit avancé",
      "Déploiement on-premise",
    ],
    color: "#8b5cf6",
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = React.useState("FREE");
  const [showModal, setShowModal] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Charger le plan actuel depuis localStorage
    const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    const currentTenantId = localStorage.getItem("currentTenant");
    const tenant = tenants.find((t: any) => t.id === currentTenantId);
    if (tenant) {
      setCurrentPlan(tenant.plan);
    }
  }, []);

  const handleChangePlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowModal(true);
  };

  const confirmChangePlan = async () => {
    if (!selectedPlan) return;

    try {
      const currentTenantId = localStorage.getItem("currentTenant") || "";
      
      // Utiliser le vrai BillingService
      const result = await BillingService.createCheckoutSession({
        tenantId: currentTenantId,
        planId: selectedPlan as any,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      });

      if (result.success) {
        // Mock provider redirige directement vers successUrl
        // En production avec Stripe: window.location.href = result.checkoutUrl;
        
        // Mettre à jour le plan localement
        const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
        const updatedTenants = tenants.map((t: any) => {
          if (t.id === currentTenantId) {
            return { ...t, plan: selectedPlan, updatedAt: new Date().toISOString() };
          }
          return t;
        });
        localStorage.setItem("tenants", JSON.stringify(updatedTenants));

        setCurrentPlan(selectedPlan);
        setShowModal(false);
        setMessage(`✅ Plan changé avec succès vers ${selectedPlan}`);
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("❌ Erreur lors du changement de plan");
      }
    } catch (err) {
      console.error("Error changing plan:", err);
      setMessage("❌ Erreur lors du changement de plan");
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "32px", fontWeight: "700", margin: "0 0 12px 0" }}>
          Plans & Abonnement
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "16px", margin: 0 }}>
          Choisissez le plan qui correspond à vos besoins
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto 24px auto",
            padding: "12px",
            background: message.includes("✅") ? "#10b981" : "#ef4444",
            color: "white",
            borderRadius: "6px",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}

      {/* Current Plan Badge */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "8px 16px",
            background: "var(--surface-1)",
            border: "2px solid var(--accent-primary)",
            borderRadius: "20px",
            color: "var(--accent-primary)",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Plan actuel : {currentPlan}
        </div>
      </div>

      {/* Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: "var(--surface-1)",
              border: currentPlan === plan.id ? "2px solid var(--accent-primary)" : "1px solid var(--surface-border)",
              borderRadius: "12px",
              padding: "32px",
              position: "relative",
              transition: "transform 0.2s",
            }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: plan.color,
                  color: "white",
                  padding: "4px 16px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                POPULAIRE
              </div>
            )}

            {/* Plan Name */}
            <h3
              style={{
                color: plan.color,
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 8px 0",
              }}
            >
              {plan.name}
            </h3>

            {/* Price */}
            <div style={{ marginBottom: "24px" }}>
              <span
                style={{
                  color: "var(--text-primary)",
                  fontSize: "40px",
                  fontWeight: "700",
                }}
              >
                ${plan.price}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "16px", marginLeft: "8px" }}>
                {plan.billing}
              </span>
            </div>

            {/* Features */}
            <ul style={{ margin: "0 0 24px 0", padding: "0", listStyle: "none" }}>
              {plan.features.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    marginBottom: "12px",
                    paddingLeft: "24px",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "#10b981",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handleChangePlan(plan.id)}
              disabled={currentPlan === plan.id}
              style={{
                width: "100%",
                padding: "14px",
                background: currentPlan === plan.id ? "#6b7280" : plan.color,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: currentPlan === plan.id ? "not-allowed" : "pointer",
              }}
            >
              {currentPlan === plan.id ? "Plan actuel" : `Passer à ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Confirmation */}
      {showModal && selectedPlan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface-1)",
              padding: "32px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "500px",
              border: "1px solid var(--surface-border)",
            }}
          >
            <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
              Confirmer le changement de plan
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              Êtes-vous sûr de vouloir passer au plan <strong>{selectedPlan}</strong> ?
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "var(--surface-0)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmChangePlan}
                style={{
                  padding: "10px 20px",
                  background: "var(--accent-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--surface-border)",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", margin: "0 0 12px 0" }}>
          💳 Paiements sécurisés via Stripe (sera intégré prochainement)
        </p>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "14px" }}>
          Pour l&apos;instant, les changements de plan sont instantanés et gratuits (mode démo)
        </p>
      </div>
    </div>
  );
}
