import React from "react";

export default function DashboardPage() {
  const params = new URLSearchParams((window.location.hash.split("?")[1] || ""));
  const state = (params.get("state") || "").toLowerCase();

  const isDisabled = state === "disabled";
  const isDenied = state === "denied";

  return (
    <div style={{ padding: 24 }}>
      {/* __CLIENT_V2_UI_STATE_IN_DASHBOARD__ */}
      {(isDisabled || isDenied) ? (
        <div style={{ border: "1px solid var(--ic-borderLight)", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {isDisabled ? "Client désactivé (maintenance)" : "Accès refusé"}
          </h2>
          <p style={{ opacity: 0.8, marginTop: 8, marginBottom: 0 }}>
            État rendu dans une route autorisée (#/dashboard) pour préserver la constitution à 5 routes.
          </p>
        </div>
      ) : (
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
          <p style={{ opacity: 0.8, marginTop: 8 }}>Surface Client V2 — fondations actives.</p>
        </div>
      )}
    </div>
  );
}
