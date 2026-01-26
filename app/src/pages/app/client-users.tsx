import React from "react";
import { ClientSidebar } from "../../core/ui/clientSidebar";

export default function Page() {
  React.useEffect(() => {
    const slot = document.getElementById("__CLIENT_PAGE_SLOT__");
    if (slot) slot.innerHTML = "";
  }, []);

  return (
    <ClientSidebar>
      {/* slot rendu dans ClientSidebar */}
      <div />
    </ClientSidebar>
  );
}

export function ClientPageContent() {
  return (
    <div style={{ padding: 14, borderRadius: 16, border: "1px solid var(--ic-highlight)", background: "var(--ic-surfaceOverlay)" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Utilisateurs</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Page Client V2 reconstruite. Contenu métier à intégrer (modules, services, data).
      </p>
    </div>
  );
}
